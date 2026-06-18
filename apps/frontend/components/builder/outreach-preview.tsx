'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Linkedin, Mail } from 'lucide-react';
export interface OutreachPreviewProps {
  /** Outreach message content */
  content: string;
  /** Additional class names */
  className?: string;
}

export function OutreachPreview({ content, className }: OutreachPreviewProps) {
  return (
    <div className={cn('bg-white border border-border', 'shadow-md', 'overflow-hidden', className)}>
      {/* Preview Header */}
      <div className="p-4 border-b-2 border-border bg-[#F5F5F0]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0077B5]" />
            <span className="font-mono text-xs uppercase">{'LinkedIn'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-xs uppercase">{'邮件'}</span>
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="p-6 md:p-8">
        {content ? (
          <div className="space-y-4">
            {/* Message Bubble Style */}
            <div className="bg-[#F5F5F0] border border-border p-4 shadow-sm">
              <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            </div>

            {/* Usage Tips */}
            <div className="pt-4 border-t border-paper-tint">
              <p className="font-mono text-xs text-muted-foreground uppercase mb-2">
                {'使用方法：'}
              </p>
              <ul className="font-mono text-xs text-muted-foreground space-y-1">
                <li>{'1. 点击上方按钮复制消息'}</li>
                <li>{'2. 打开 LinkedIn 或你的邮件客户端'}</li>
                <li>{'3. 粘贴并按需个性化调整'}</li>
                <li>{'4. 发送给招聘人员或用人经理'}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-mono text-sm">{'还没有外联消息。'}</p>
            <p className="font-mono text-xs mt-2">
              {'请在设置中启用外联消息生成，然后完成一次简历定制。'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
