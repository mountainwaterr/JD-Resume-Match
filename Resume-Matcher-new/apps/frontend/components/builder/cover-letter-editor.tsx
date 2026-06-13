'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n/t-shim';

export interface CoverLetterEditorProps {
  /** Cover letter content */
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

export function CoverLetterEditor({
  content,
  onChange,
  onSave,
  isSaving,
  className,
}: CoverLetterEditorProps) {
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = content.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border bg-[#F5F5F0]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <h2 className="text-base font-semibold">{'求职信'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {t('builder.contentStats.wordsChars', { wordCount, charCount })}
          </span>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={'启用求职信生成并完成一次简历定制后，求职信内容会显示在这里...'}
          className={cn(
            'w-full h-full min-h-[400px] p-4',
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
          {'提示：一封好的求职信通常在 300-400 词左右，可根据需要进行个性化修改。'}
        </p>
      </div>
    </div>
  );
}
