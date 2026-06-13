'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, List, ListOrdered } from 'lucide-react';
import type { SectionType } from '@/components/dashboard/resume-component';
import { t } from '@/lib/i18n/t-shim';

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (displayName: string, sectionType: SectionType) => void;
}

type SelectableSectionType = Exclude<SectionType, 'personalInfo'>;

/**
 * AddSectionDialog Component
 *
 * Dialog for creating new custom sections.
 * Allows user to enter a name and select a section type.
 */
export const AddSectionDialog: React.FC<AddSectionDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [sectionType, setSectionType] = useState<SelectableSectionType>('text');

  const handleSubmit = () => {
    if (displayName.trim()) {
      onAdd(displayName.trim(), sectionType);
      setDisplayName('');
      setSectionType('text');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && displayName.trim()) {
      handleSubmit();
    }
  };

  const sectionTypes: {
    type: SelectableSectionType;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      type: 'text',
      label: '文本块',
      icon: <FileText className="w-5 h-5" />,
      description: '单个文本区域（类似个人简介）',
    },
    {
      type: 'itemList',
      label: '条目列表',
      icon: <ListOrdered className="w-5 h-5" />,
      description: '包含多个条目的列表（类似工作经历）',
    },
    {
      type: 'stringList',
      label: '简单列表',
      icon: <List className="w-5 h-5" />,
      description: '简单的文本列表（类似技能）',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 ">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="font-serif text-xl font-bold uppercase tracking-tight">
            {'添加自定义板块'}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground mt-2">
            {'为简历创建一个自定义名称与类型的新板块。'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Section Name */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">{'板块名称'}</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={'例如：论文发表、志愿者经历、证书'}
              className=" border-border"
              autoFocus
            />
          </div>

          {/* Section Type */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">{'板块类型'}</Label>
            <div className="space-y-2">
              {sectionTypes.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSectionType(item.type)}
                  className={`w-full p-4 border text-left transition-colors ${
                    sectionType === item.type
                      ? 'border-border bg-muted shadow-sm'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 border ${
                        sectionType === item.type
                          ? 'border-border bg-white'
                          : 'border-border bg-muted'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-sans font-medium text-sm">{item.label}</div>
                      <div className="font-mono text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    {sectionType === item.type && (
                      <div className="w-4 h-4 border border-border bg-black" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-background border-t border-border flex-row justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" className=" border-border">
              {'取消'}
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!displayName.trim()} className="">
            <Plus className="w-4 h-4 mr-2" />
            {'添加板块'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * AddSectionButton Component
 *
 * Button that triggers the AddSectionDialog.
 */
interface AddSectionButtonProps {
  onAdd: (displayName: string, sectionType: SectionType) => void;
}

export const AddSectionButton: React.FC<AddSectionButtonProps> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full  border-dashed border border-border py-6 hover:bg-muted hover:border-solid transition-all"
      >
        <Plus className="w-5 h-5 mr-2" />
        {'添加自定义板块'}
      </Button>
      <AddSectionDialog open={open} onOpenChange={setOpen} onAdd={onAdd} />
    </>
  );
};
