'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Copy, Check, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n/t-shim';

export interface OutreachEditorProps {
  /** Outreach message content */
  content: string;
  /** Callback when content changes */
  onChange: (content: string) => void;
  /** Callback when save is triggered */
  onSave: () => void;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Additional class names */
  className?: string;
}

export function OutreachEditor({
  content,
  onChange,
  onSave,
  isSaving,
  className,
}: OutreachEditorProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = content.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border bg-[#F5F5F0]">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          <h2 className="text-base font-semibold">{'联系邮件'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {t('builder.contentStats.wordsChars', { wordCount, charCount })}
          </span>
          <Button size="sm" variant="outline" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? '保存中...' : '保存'}
          </Button>
          <Button size="sm" onClick={handleCopy} disabled={!content}>
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                {'已复制！'}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {'复制'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={'启用外联消息生成并完成一次简历定制后，外联消息会显示在这里...'}
          className={cn(
            'w-full h-full min-h-[250px] p-4',
            'font-mono text-sm leading-relaxed',
            'border border-border bg-white',
            'resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2',
            'placeholder:text-muted-foreground'
          )}
        />
      </div>

      {/* Footer Tips */}
      <div className="p-4 border-t border-paper-tint bg-[#F5F5F0]">
        <p className="font-mono text-xs text-muted-foreground">
          {'提示：外联消息建议保持简短（100-150 词）。可复制后粘贴到 LinkedIn 或邮件中。'}
        </p>
      </div>
    </div>
  );
}
