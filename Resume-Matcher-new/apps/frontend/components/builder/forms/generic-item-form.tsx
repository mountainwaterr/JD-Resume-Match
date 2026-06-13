'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n/t-shim';

// Lazy-load TipTap-based editor — keeps it out of the initial bundle.
const RichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[100px] border border-border bg-transparent" aria-busy="true" />
    ),
  }
);
import { Plus, Trash2 } from 'lucide-react';
import type { CustomSectionItem } from '@/components/dashboard/resume-component';
interface GenericItemFormProps {
  items: CustomSectionItem[];
  onChange: (items: CustomSectionItem[]) => void;
  itemLabel?: string;
  addLabel?: string;
  showSubtitle?: boolean;
  showLocation?: boolean;
  showYears?: boolean;
  titlePlaceholder?: string;
  subtitlePlaceholder?: string;
  locationPlaceholder?: string;
  yearsPlaceholder?: string;
  descriptionPlaceholder?: string;
}

/**
 * Generic Item Form Component
 *
 * Used for ITEM_LIST type sections (like Experience, Education, Projects).
 * Renders a list of items with configurable fields.
 */
export const GenericItemForm: React.FC<GenericItemFormProps> = ({
  items,
  onChange,
  itemLabel,
  addLabel,
  showSubtitle = true,
  showLocation = true,
  showYears = true,
  titlePlaceholder,
  subtitlePlaceholder,
  locationPlaceholder,
  yearsPlaceholder,
  descriptionPlaceholder,
}) => {
  const finalItemLabel = itemLabel ?? '条目';
  const finalAddLabel =
    addLabel ?? t('builder.genericItemForm.addItemLabel', { label: finalItemLabel });

  const finalTitlePlaceholder = titlePlaceholder ?? '标题';
  const finalSubtitlePlaceholder = subtitlePlaceholder ?? '组织/公司';
  const finalLocationPlaceholder = locationPlaceholder ?? '地点';
  const finalYearsPlaceholder = yearsPlaceholder ?? '2020年1月 - 至今';
  const finalDescriptionPlaceholder = descriptionPlaceholder ?? '描述你的贡献...';

  const handleAdd = () => {
    const newId = Math.max(...items.map((d) => d.id), 0) + 1;
    onChange([
      ...items,
      {
        id: newId,
        title: '',
        subtitle: '',
        location: '',
        years: '',
        description: [''],
      },
    ]);
  };

  const handleRemove = (id: number) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleChange = (id: number, field: keyof CustomSectionItem, value: string | string[]) => {
    onChange(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleDescriptionChange = (id: number, index: number, value: string) => {
    onChange(
      items.map((item) => {
        if (item.id === id) {
          const newDesc = [...(item.description || [])];
          newDesc[index] = value;
          return { ...item, description: newDesc };
        }
        return item;
      })
    );
  };

  const handleAddDescription = (id: number) => {
    onChange(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, description: [...(item.description || []), ''] };
        }
        return item;
      })
    );
  };

  const handleRemoveDescription = (id: number, index: number) => {
    onChange(
      items.map((item) => {
        if (item.id === id) {
          const newDesc = [...(item.description || [])];
          newDesc.splice(index, 1);
          return { ...item, description: newDesc };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className=" border-border hover:bg-black hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> {finalAddLabel}
        </Button>
      </div>

      <div className="space-y-8">
        {items.map((item) => (
          <div key={item.id} className="p-6 border border-border bg-muted relative group">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleRemove(item.id)}
              aria-label={'移除项目'}
              title={'移除项目'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">{'标题'}</Label>
                <Input
                  value={item.title || ''}
                  onChange={(e) => handleChange(item.id, 'title', e.target.value)}
                  placeholder={finalTitlePlaceholder}
                  className=" border-border bg-white"
                />
              </div>
              {showSubtitle && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">{'组织/公司'}</Label>
                  <Input
                    value={item.subtitle || ''}
                    onChange={(e) => handleChange(item.id, 'subtitle', e.target.value)}
                    placeholder={finalSubtitlePlaceholder}
                    className=" border-border bg-white"
                  />
                </div>
              )}
              {showLocation && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">{'地点'}</Label>
                  <Input
                    value={item.location || ''}
                    onChange={(e) => handleChange(item.id, 'location', e.target.value)}
                    placeholder={finalLocationPlaceholder}
                    className=" border-border bg-white"
                  />
                </div>
              )}
              {showYears && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">{'时间'}</Label>
                  <Input
                    value={item.years || ''}
                    onChange={(e) => handleChange(item.id, 'years', e.target.value)}
                    placeholder={finalYearsPlaceholder}
                    className=" border-border bg-white"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-medium text-muted-foreground">{'描述要点'}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddDescription(item.id)}
                  className="h-6 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                >
                  <Plus className="w-3 h-3 mr-1" /> {'添加要点'}
                </Button>
              </div>
              {item.description?.map((desc, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-1">
                    <RichTextEditor
                      value={desc}
                      onChange={(html) => handleDescriptionChange(item.id, idx, html)}
                      placeholder={finalDescriptionPlaceholder}
                      minHeight="60px"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDescription(item.id, idx)}
                    className="h-[60px] w-8 text-muted-foreground hover:text-destructive self-end"
                    aria-label={'移除此行'}
                    title={'移除此行'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 bg-muted border border-dashed border-border">
            <p className="font-mono text-sm text-muted-foreground mb-4">
              {t('builder.genericItemForm.noEntries', { label: finalItemLabel })}
            </p>
            <Button variant="outline" size="sm" onClick={handleAdd} className=" border-border">
              <Plus className="w-4 h-4 mr-2" />{' '}
              {t('builder.genericItemForm.addFirstItem', { label: finalItemLabel })}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
