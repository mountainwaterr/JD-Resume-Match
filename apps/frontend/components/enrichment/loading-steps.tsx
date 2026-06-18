'use client';

import { Loader2, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n/t-shim';

interface LoadingStepProps {
  message: string;
  submessage?: string;
}

function LoadingStep({ message, submessage }: LoadingStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
      <div className="text-center">
        <p className="text-xl font-mono font-bold">{message}</p>
        {submessage && <p className="text-sm text-steel-grey mt-2 font-mono">{submessage}</p>}
      </div>
    </div>
  );
}

export function AnalyzingStep() {
  return <LoadingStep message={'正在分析你的简历...'} submessage={'识别哪些内容需要补充细节'} />;
}

export function GeneratingStep() {
  return <LoadingStep message={'正在生成增强描述...'} submessage={'根据你的回答优化简历内容'} />;
}

export function ApplyingStep() {
  return <LoadingStep message={'正在应用增强内容...'} submessage={'更新你的主简历'} />;
}

interface CompleteStepProps {
  onClose: () => void;
  updatedCount?: number;
}

export function CompleteStep({ onClose, updatedCount }: CompleteStepProps) {
  const hasUpdatedCount = updatedCount !== undefined;
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
      <div className="relative">
        <CheckCircle2 className="w-16 h-16 text-green-600" />
      </div>
      <div className="text-center">
        <p className="text-2xl font-mono font-bold">{'简历已增强！'}</p>
        <p className="text-sm text-steel-grey mt-2 font-mono">
          {hasUpdatedCount
            ? updatedCount === 1
              ? t('enrichment.complete.updatedCountSingular', { count: updatedCount })
              : t('enrichment.complete.updatedCountPlural', { count: updatedCount })
            : '已将增强描述更新到你的简历中'}
        </p>
      </div>
      <Button onClick={onClose} className="mt-4 gap-2">
        <Sparkles className="w-4 h-4" />
        {'完成'}
      </Button>
    </div>
  );
}

interface NoImprovementsStepProps {
  onClose: () => void;
  summary?: string;
}

export function NoImprovementsStep({ onClose, summary }: NoImprovementsStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
      <div className="relative">
        <CheckCircle2 className="w-16 h-16 text-green-600" />
      </div>
      <div className="text-center max-w-md">
        <p className="text-2xl font-mono font-bold">{'你的简历已经很棒！'}</p>
        <p className="text-sm text-steel-grey mt-2 font-mono">
          {summary || '未发现需要改进的条目。你的经历与项目描述已经足够详细。'}
        </p>
      </div>
      <Button onClick={onClose} className="mt-4 gap-2">
        <Sparkles className="w-4 h-4" />
        {'关闭'}
      </Button>
    </div>
  );
}

interface ErrorStepProps {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}

export function ErrorStep({ error, onRetry, onClose }: ErrorStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
      <div className="relative">
        <AlertCircle className="w-16 h-16 text-red-500" />
      </div>
      <div className="text-center max-w-md">
        <p className="text-xl font-mono font-bold">{'出现错误'}</p>
        <p className="text-sm text-red-600 mt-2 font-mono bg-red-50 p-3 border border-red-200">
          {error}
        </p>
      </div>
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onClose}>
          {'取消'}
        </Button>
        <Button onClick={onRetry}>{'重试'}</Button>
      </div>
    </div>
  );
}
