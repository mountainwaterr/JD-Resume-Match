'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Sparkles, Briefcase, FolderKanban, Lightbulb } from 'lucide-react';
import type { RegenerateItemInput } from '@/lib/api/enrichment';
import { t } from '@/lib/i18n/t-shim';

interface RegenerateInstructionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: RegenerateItemInput[];
  instruction: string;
  onInstructionChange: (instruction: string) => void;
  error: string | null;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

/**
 * RegenerateInstructionDialog Component
 *
 * Second step of the regenerate wizard.
 * Shows selected items and allows user to input improvement instructions.
 * Swiss International Style design.
 */
export const RegenerateInstructionDialog: React.FC<RegenerateInstructionDialogProps> = ({
  open,
  onOpenChange,
  selectedItems,
  instruction,
  onInstructionChange,
  error,
  onBack,
  onGenerate,
  isGenerating,
}) => {
  const resolveErrorMessage = (value: string) => {
    if (value === 'No items selected') {
      return '请至少选择一个项目';
    }

    if (/network|fetch/i.test(value) || value.includes('Failed to fetch')) {
      return '网络错误，请检查您的连接。';
    }

    return '生成内容失败，请重试。';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter key in textarea without closing dialog
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'experience':
        return <Briefcase className="w-4 h-4" />;
      case 'project':
        return <FolderKanban className="w-4 h-4" />;
      case 'skills':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 ">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="font-serif text-xl font-bold uppercase tracking-tight">
            {'您想要改进什么？'}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground mt-2">
            {'提供具体反馈以指导 AI'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {error ? (
            <div className="border border-red-600 bg-red-50 px-4 py-3">
              <p className="font-mono text-xs text-red-700">{resolveErrorMessage(error)}</p>
            </div>
          ) : null}
          {/* Selected Items Summary */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{'已选项目'}</label>
            <div className="bg-muted border border-border p-3 space-y-2 max-h-32 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.item_id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{getItemIcon(item.item_type)}</span>
                  <span className="font-medium truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-muted-foreground text-xs truncate">
                      | {item.subtitle}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instruction Input */}
          <div className="space-y-2">
            <label
              htmlFor="regenerate-instruction"
              className="text-xs font-medium text-muted-foreground"
            >
              {'请具体说明您不满意的地方'}
            </label>
            <Textarea
              id="regenerate-instruction"
              value={instruction}
              onChange={(e) => onInstructionChange(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
              placeholder={'示例：添加更多量化指标、强调领导能力、使用更多行动动词...'}
              className="min-h-[120px] border-border"
              disabled={isGenerating}
            />
          </div>
        </div>

        <DialogFooter className="p-4 bg-secondary border-t border-border flex-row justify-between gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isGenerating}
            className=" border-border"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {'返回'}
          </Button>
          <Button onClick={onGenerate} disabled={isGenerating} className="">
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                {'正在生成改进内容...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {'生成'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegenerateInstructionDialog;
