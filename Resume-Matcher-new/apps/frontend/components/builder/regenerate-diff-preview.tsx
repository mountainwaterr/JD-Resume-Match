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
import {
  Check,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Briefcase,
  FolderKanban,
  Lightbulb,
} from 'lucide-react';
import type { RegenerateItemError, RegeneratedItem } from '@/lib/api/enrichment';
import { t } from '@/lib/i18n/t-shim';

interface RegenerateDiffPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regeneratedItems: RegeneratedItem[];
  regenerateErrors?: RegenerateItemError[];
  error: string | null;
  onAccept: () => void;
  onReject: () => void;
  isApplying: boolean;
}

/**
 * RegenerateDiffPreview Component
 *
 * Third step of the regenerate wizard.
 * Shows side-by-side comparison of original vs regenerated content.
 * Swiss International Style design.
 */
export const RegenerateDiffPreview: React.FC<RegenerateDiffPreviewProps> = ({
  open,
  onOpenChange,
  regeneratedItems,
  regenerateErrors = [],
  error,
  onAccept,
  onReject,
  isApplying,
}) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set(regeneratedItems.map((item) => item.item_id))
  );

  React.useEffect(() => {
    // Expand all items when regeneratedItems changes
    setExpandedItems(new Set(regeneratedItems.map((item) => item.item_id)));
  }, [regeneratedItems]);

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  type ItemLabelSource = Pick<RegeneratedItem, 'item_id' | 'item_type' | 'title' | 'subtitle'>;

  const getItemLabel = (item: ItemLabelSource) => {
    if (item.item_type === 'skills') {
      return '技术技能';
    }

    const title = item.title?.trim();
    const subtitle = item.subtitle?.trim();

    if (title && subtitle) {
      return `${title} | ${subtitle}`;
    }

    return title || item.item_id;
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

  const resolveErrorMessage = (value: string) => {
    if (value === 'No changes to apply') {
      return '没有可应用的变更。';
    }

    if (/network|fetch/i.test(value) || value.includes('Failed to fetch')) {
      return '网络错误，请检查您的连接。';
    }

    if (/resume content changed|uniquely matched|please regenerate/i.test(value)) {
      return '简历内容在重新生成后已发生变化。请重新生成后再试。';
    }

    return '应用变更失败，请重试。';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 gap-0  overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="font-serif text-xl font-bold uppercase tracking-tight">
            {'预览变更'}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground mt-2">
            {'应用前查看重新生成的内容'}
          </DialogDescription>
        </DialogHeader>

        {/* Stats Card */}
        <div className="px-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 text-green-700 font-mono text-xs">
            <Check className="w-3 h-3" />
            {'{count} 个项目已修改'.replace('{count}', String(regeneratedItems.length))}
          </div>
        </div>

        {error ? (
          <div className="px-6 pt-4">
            <div className="border border-red-600 bg-red-50 px-4 py-3">
              <p className="font-mono text-xs text-red-700">{resolveErrorMessage(error)}</p>
            </div>
          </div>
        ) : null}

        {regenerateErrors.length > 0 ? (
          <div className="px-6 pt-4">
            <div className="border border-border bg-[#FFF9DB] px-4 py-3">
              <p className="font-mono text-xs text-muted-foreground">
                {t('builder.regenerate.diffPreview.partialFailures', {
                  count: regenerateErrors.length,
                })}
              </p>
              <ul className="mt-2 space-y-1">
                {regenerateErrors.map((failed) => (
                  <li key={failed.item_id} className="font-mono text-xs text-muted-foreground">
                    • {getItemLabel(failed)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {/* Diff Content */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {regeneratedItems.map((item) => (
            <div key={item.item_id} className="border border-border">
              {/* Item Header */}
              <button
                type="button"
                onClick={() => toggleItem(item.item_id)}
                aria-expanded={expandedItems.has(item.item_id)}
                aria-label={
                  expandedItems.has(item.item_id)
                    ? t('builder.regenerate.diffPreview.collapseItem', { item: getItemLabel(item) })
                    : t('builder.regenerate.diffPreview.expandItem', { item: getItemLabel(item) })
                }
                className="w-full p-4 flex items-center justify-between bg-background hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getItemIcon(item.item_type)}
                  <span className="font-mono text-sm tracking-wider font-medium truncate">
                    {getItemLabel(item)}
                  </span>
                </div>
                {expandedItems.has(item.item_id) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Item Diff Content */}
              {expandedItems.has(item.item_id) && (
                <div className="border-t border-border">
                  {/* Change Summary */}
                  {item.diff_summary && (
                    <div className="p-3 border-b border-border">
                      <p className="font-mono text-xs text-blue-700">{item.diff_summary}</p>
                    </div>
                  )}

                  {/* Original Content */}
                  <div className="p-4 border-b border-border">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-600 border border-border" />
                      {'原始'}
                    </div>
                    <div className="border border-border bg-white p-3 space-y-1">
                      {item.original_content.length > 0 ? (
                        item.original_content.map((content, idx) => (
                          <p key={idx} className="text-sm text-red-700 line-through">
                            <span className="font-mono mr-2">−</span>
                            {content}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">{'无内容'}</p>
                      )}
                    </div>
                  </div>

                  {/* New Content */}
                  <div className="p-4">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-700 border border-border" />
                      {'新内容'}
                    </div>
                    <div className="border border-border bg-white p-3 space-y-1">
                      {item.new_content.length > 0 ? (
                        item.new_content.map((content, idx) => (
                          <p key={idx} className="text-sm text-green-700">
                            <span className="font-mono mr-2">+</span>
                            {content}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">{'无内容'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="p-4 bg-secondary border-t border-border flex-row justify-between gap-3">
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isApplying}
            className=" border-border"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {'拒绝并重新生成'}
          </Button>
          <Button variant="success" onClick={onAccept} disabled={isApplying} className="">
            {isApplying ? (
              <>
                <span className="animate-spin mr-2">
                  <Check className="w-4 h-4" />
                </span>
                {'正在应用...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {'接受变更'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegenerateDiffPreview;
