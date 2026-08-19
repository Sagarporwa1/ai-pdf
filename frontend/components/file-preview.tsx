import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="group flex items-center gap-2 glass rounded-xl p-2.5 border border-white/5 hover:border-violet-500/20 transition-all duration-200 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate leading-none mb-0.5">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground leading-none">{formatBytes(file.size)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-all shrink-0"
        onClick={onRemove}
        title="Remove file"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
