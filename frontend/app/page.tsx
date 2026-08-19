'use client';

import type React from 'react';

import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, ArrowUp, Loader2, FileText, Sparkles, Zap, BookOpen } from 'lucide-react';
import { ExamplePrompts } from '@/components/example-prompts';
import { ChatMessage } from '@/components/chat-message';
import { FilePreview } from '@/components/file-preview';
import { client } from '@/lib/langgraph-client';
import {
  AgentState,
  documentType,
  PDFDocument,
  RetrieveDocumentsNodeUpdates,
} from '@/types/graphTypes';

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      sources?: PDFDocument[];
    }>
  >([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastRetrievedDocsRef = useRef<PDFDocument[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initThread = async () => {
      if (threadId) return;
      try {
        const thread = await client.createThread();
        setThreadId(thread.thread_id);
      } catch (error) {
        console.error('Error creating thread:', error);
        toast({
          title: 'Connection Error',
          description:
            'Could not establish a session. Make sure LANGGRAPH_API_URL is set correctly. ' +
            error,
          variant: 'destructive',
        });
      }
    };
    initThread();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const adjustTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !threadId || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, sources: undefined },
      { role: 'assistant', content: '', sources: undefined },
    ]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    lastRetrievedDocsRef.current = [];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, threadId }),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split('\n').filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const sseString = line.slice('data: '.length);
          let sseEvent: any;
          try {
            sseEvent = JSON.parse(sseString);
          } catch (err) {
            console.error('Error parsing SSE line:', err, line);
            continue;
          }

          const { event, data } = sseEvent;

          if (event === 'messages/partial') {
            if (Array.isArray(data)) {
              const lastObj = data[data.length - 1];
              if (lastObj?.type === 'ai') {
                const partialContent = lastObj.content ?? '';
                if (typeof partialContent === 'string' && !partialContent.startsWith('{')) {
                  setMessages((prev) => {
                    const newArr = [...prev];
                    if (newArr.length > 0 && newArr[newArr.length - 1].role === 'assistant') {
                      newArr[newArr.length - 1].content = partialContent;
                      newArr[newArr.length - 1].sources = lastRetrievedDocsRef.current;
                    }
                    return newArr;
                  });
                }
              }
            }
          } else if (event === 'updates' && data) {
            if (
              data &&
              typeof data === 'object' &&
              'retrieveDocuments' in data &&
              data.retrieveDocuments &&
              Array.isArray(data.retrieveDocuments.documents)
            ) {
              const retrievedDocs = (data as RetrieveDocumentsNodeUpdates)
                .retrieveDocuments.documents as PDFDocument[];
              lastRetrievedDocsRef.current = retrievedDocs;
            } else {
              lastRetrievedDocsRef.current = [];
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description:
          'Failed to send message. Please try again.\n' +
          (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
      setMessages((prev) => {
        const newArr = [...prev];
        newArr[newArr.length - 1].content =
          'Sorry, there was an error processing your message. Please try again.';
        return newArr;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const nonPdfFiles = selectedFiles.filter((file) => file.type !== 'application/pdf');
    if (nonPdfFiles.length > 0) {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF files are supported.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/ingest', { method: 'POST', body: formData });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload files');
      }

      setFiles((prev) => [...prev, ...selectedFiles]);
      toast({
        title: '✓ Uploaded successfully',
        description: `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} ready for questions`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description:
          'Failed to upload files. Please try again.\n' +
          (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center glow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">DocMind AI</h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">PDF Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {threadId ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-xs text-amber-400 font-medium">Connecting…</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-16 pb-40">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-10 animate-fade-in-up">
            {/* Hero */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 flex items-center justify-center mx-auto animate-float glow">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-2">
                  Ask anything about your PDFs
                </h2>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                  Upload documents and chat with them using AI. Get instant, accurate answers with source citations.
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { icon: <Zap className="w-3 h-3" />, text: 'Instant answers' },
                { icon: <FileText className="w-3 h-3" />, text: 'Multi-PDF support' },
                { icon: <Sparkles className="w-3 h-3" />, text: 'Source citations' },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-muted-foreground border border-white/5"
                >
                  <span className="text-violet-400">{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>

            <ExamplePrompts onPromptSelect={(p) => { setInput(p); textareaRef.current?.focus(); }} />
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {messages.map((message, i) => (
              <ChatMessage key={i} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Bottom input bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-4 pt-2">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          {/* File previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 animate-fade-in">
              {files.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => handleRemoveFile(file)}
                />
              ))}
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSubmit}>
            <div className="glass-strong rounded-2xl overflow-hidden input-glow transition-all duration-200">
              <div className="flex items-end gap-2 p-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf"
                  multiple
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  id="upload-btn"
                  className="shrink-0 w-9 h-9 rounded-xl hover:bg-violet-500/10 hover:text-violet-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Upload PDF"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); adjustTextarea(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isUploading ? 'Processing PDF…' : 'Ask anything about your documents…'}
                  rows={1}
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-2 px-1 leading-relaxed max-h-40 overflow-y-auto"
                  disabled={isUploading || isLoading || !threadId}
                  id="chat-input"
                />

                <Button
                  type="submit"
                  size="icon"
                  id="send-btn"
                  className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 transition-all duration-200 disabled:opacity-30"
                  disabled={!input.trim() || isUploading || isLoading || !threadId}
                  title="Send message (Enter)"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-xs text-muted-foreground/50">
                  {files.length > 0
                    ? `${files.length} PDF${files.length > 1 ? 's' : ''} loaded`
                    : 'Upload PDFs to get started'}
                </span>
                <span className="text-xs text-muted-foreground/50">Enter to send · Shift+Enter for new line</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
