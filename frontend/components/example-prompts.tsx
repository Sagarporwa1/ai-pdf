import { BookOpen, Search, Lightbulb, HelpCircle } from 'lucide-react';

interface ExamplePromptsProps {
  onPromptSelect: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  {
    icon: <BookOpen className="w-4 h-4" />,
    title: 'Summarize this document',
    description: 'Get a concise overview of the key points',
  },
  {
    icon: <Search className="w-4 h-4" />,
    title: 'What are the main topics?',
    description: 'Identify themes and subjects covered',
  },
  {
    icon: <Lightbulb className="w-4 h-4" />,
    title: 'Extract key insights',
    description: 'Find the most important takeaways',
  },
  {
    icon: <HelpCircle className="w-4 h-4" />,
    title: 'What is this document about?',
    description: 'Understand the purpose and context',
  },
];

export function ExamplePrompts({ onPromptSelect }: ExamplePromptsProps) {
  return (
    <div className="w-full max-w-xl space-y-2">
      <p className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wider mb-3">
        Try asking
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {EXAMPLE_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            className="group flex items-start gap-3 p-3.5 rounded-xl glass border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 text-left transition-all duration-200 cursor-pointer"
            style={{ animationDelay: `${i * 80}ms` }}
            onClick={() => onPromptSelect(prompt.title)}
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
              {prompt.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug">{prompt.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{prompt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
