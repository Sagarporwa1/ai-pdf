import { Copy, Check, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { PDFDocument } from '@/types/graphTypes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    sources?: PDFDocument[];
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const isLoading = message.role === 'assistant' && message.content === '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const showSources =
    message.role === 'assistant' &&
    message.sources &&
    message.sources.length > 0;

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mt-0.5">
        <Bot className="w-4 h-4 text-violet-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-1 h-8 px-1">
            {[0, 0.2, 0.4].map((delay, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-violet-400"
                style={{ animation: `loading 1s ease-in-out ${delay}s infinite` }}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-4">
              {/* Markdown-rendered response */}
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:text-foreground prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0
                prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-2
                prose-strong:text-foreground prose-strong:font-semibold
                prose-em:text-foreground/80
                prose-ul:my-2 prose-ul:pl-4 prose-li:my-1 prose-li:text-foreground/90
                prose-ol:my-2 prose-ol:pl-4
                prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-4
                prose-blockquote:border-l-violet-500 prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground prose-blockquote:italic
                prose-hr:border-white/10
                prose-a:text-violet-400 prose-a:underline-offset-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 pl-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            {/* Sources */}
            {showSources && message.sources && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="sources" className="border-0">
                  <AccordionTrigger className="text-xs py-1.5 px-2 hover:no-underline text-muted-foreground hover:text-foreground justify-start gap-2 rounded-lg hover:bg-white/5 transition-colors [&[data-state=open]]:text-violet-400">
                    <FileText className="w-3.5 h-3.5" />
                    {message.sources.length} source{message.sources.length > 1 ? 's' : ''} referenced
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {message.sources.map((source, index) => (
                        <Card
                          key={index}
                          className="glass border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200 cursor-pointer"
                        >
                          <CardContent className="p-3 flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-3.5 h-3.5 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {source.metadata?.source ||
                                  source.metadata?.filename ||
                                  'Document'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Page {source.metadata?.loc?.pageNumber || '—'}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </>
        )}
      </div>
    </div>
  );
}
