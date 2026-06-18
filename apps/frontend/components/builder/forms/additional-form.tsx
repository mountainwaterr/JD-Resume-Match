'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdditionalInfo } from '@/components/dashboard/resume-component';
import { t } from '@/lib/i18n/t-shim';

interface AdditionalFormProps {
  data: AdditionalInfo;
  onChange: (data: AdditionalInfo) => void;
}

export const AdditionalForm: React.FC<AdditionalFormProps> = ({ data, onChange }) => {
  // Helper to handle array conversions (text -> string[])
  const handleArrayChange = (field: keyof AdditionalInfo, value: string) => {
    // Split by newlines only (preserving spaces within items)
    const items = value.split('\n').filter((item) => item.trim() !== '');
    onChange({
      ...data,
      [field]: items,
    });
  };

  const formatArray = (arr?: string[]) => {
    return arr?.join('\n') || '';
  };

  // Explicitly allow Enter key to create newlines (prevent form submission interference)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // Allow default behavior (newline insertion)
      e.stopPropagation();
    }
  };

  return (
    <div className="space-y-6">
      <p className="font-mono text-xs uppercase tracking-wider text-blue-700">
        {'每行输入一条内容（按 Enter 换行）。'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="technicalSkills" className="text-xs font-medium text-muted-foreground">
            {'技术技能'}
          </Label>
          <Textarea
            id="technicalSkills"
            value={formatArray(data.technicalSkills)}
            onChange={(e) => handleArrayChange('technicalSkills', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'React\nTypeScript\nNode.js'}
            className="min-h-[120px] text-black  border-border bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-700"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="languages" className="text-xs font-medium text-muted-foreground">
            {'语言能力'}
          </Label>
          <Textarea
            id="languages"
            value={formatArray(data.languages)}
            onChange={(e) => handleArrayChange('languages', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'中文\n英语'}
            className="min-h-[120px] text-black  border-border bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-700"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="certifications" className="text-xs font-medium text-muted-foreground">
            {'培训与证书'}
          </Label>
          <Textarea
            id="certifications"
            value={formatArray(data.certificationsTraining)}
            onChange={(e) => handleArrayChange('certificationsTraining', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'AWS 解决方案架构师\nGoogle Analytics'}
            className="min-h-[120px] text-black  border-border bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-700"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="awards" className="text-xs font-medium text-muted-foreground">
            {'荣誉奖项'}
          </Label>
          <Textarea
            id="awards"
            value={formatArray(data.awards)}
            onChange={(e) => handleArrayChange('awards', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'月度最佳员工\n黑客松冠军'}
            className="min-h-[120px] text-black  border-border bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-700"
          />
        </div>
      </div>
    </div>
  );
};
