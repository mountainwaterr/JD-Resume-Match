'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { NextSteps } from '@/components/common/next-steps';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useResumePreview } from '@/components/common/resume_previewer_context';
import type { ImprovedResult } from '@/components/common/resume_previewer_context';
import type { ResumeData } from '@/components/dashboard/resume-component';
import {
  uploadJobDescriptions,
  previewImproveResume,
  confirmImproveResume,
} from '@/lib/api/resume';
import { fetchPromptConfig, type PromptOption } from '@/lib/api/config';
import { Dropdown } from '@/components/ui/dropdown';
import { useStatusCache } from '@/lib/context/status-cache';
import { Loader2, ArrowLeft, AlertTriangle, FileSearch } from 'lucide-react';
import { DiffPreviewModal } from '@/components/tailor/diff-preview-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { t } from '@/lib/i18n/t-shim';

export default function TailorPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterResumeId, setMasterResumeId] = useState<string | null>(null);
  const [promptOptions, setPromptOptions] = useState<PromptOption[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('keywords');
  const [promptLoading, setPromptLoading] = useState(false);
  const hasUserSelectedPrompt = useRef(false);
  const missingDiffConfirmInFlight = useRef(false);

  // Diff preview modal state
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [pendingResult, setPendingResult] = useState<ImprovedResult | null>(null);
  const [diffConfirmError, setDiffConfirmError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showMissingDiffDialog, setShowMissingDiffDialog] = useState(false);
  const [missingDiffResult, setMissingDiffResult] = useState<ImprovedResult | null>(null);
  const [missingDiffError, setMissingDiffError] = useState<string | null>(null);

  // Elapsed timer for long operations
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setElapsed(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const router = useRouter();
  const { setImprovedData } = useResumePreview();
  const {
    status: systemStatus,
    isLoading: statusLoading,
    incrementJobs,
    incrementImprovements,
    incrementResumes,
  } = useStatusCache();

  // Check if LLM is configured
  const isLlmConfigured = !statusLoading && systemStatus?.llm_configured;

  const [noResumeId, setNoResumeId] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('master_resume_id');
    if (!storedId) {
      setNoResumeId(true);
    } else {
      setMasterResumeId(storedId);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const loadPromptConfig = async () => {
      setPromptLoading(true);
      try {
        const config = await fetchPromptConfig();
        if (!cancelled) {
          setPromptOptions(config.prompt_options || []);
          if (!hasUserSelectedPrompt.current) {
            setSelectedPromptId(config.default_prompt_id || 'keywords');
          }
        }
      } catch (err) {
        console.error('Failed to load prompt config', err);
      } finally {
        if (!cancelled) {
          setPromptLoading(false);
        }
      }
    };

    loadPromptConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  const buildConfirmPayload = (result: ImprovedResult) => {
    if (!masterResumeId) {
      throw new Error('Master resume ID is missing.');
    }
    const resumePreview = result.data.resume_preview;
    if (!resumePreview || typeof resumePreview !== 'object' || Array.isArray(resumePreview)) {
      throw new Error('Resume preview data is invalid.');
    }
    const previewRecord = resumePreview as unknown as Record<string, unknown>;
    if (
      !previewRecord.personalInfo ||
      typeof previewRecord.personalInfo !== 'object' ||
      Array.isArray(previewRecord.personalInfo)
    ) {
      throw new Error('Resume preview data is invalid.');
    }
    return {
      resume_id: masterResumeId,
      job_id: result.data.job_id,
      improved_data: resumePreview as ResumeData,
      improvements:
        result.data.improvements?.map((item) => ({
          suggestion: item.suggestion,
          lineNumber: typeof item.lineNumber === 'number' ? item.lineNumber : null,
        })) ?? [],
    };
  };

  const confirmAndNavigate = async (result: ImprovedResult) => {
    const confirmed = await confirmImproveResume(buildConfirmPayload(result));
    incrementImprovements();
    incrementResumes();
    setImprovedData(confirmed);

    const newResumeId = confirmed?.data?.resume_id;
    if (newResumeId) {
      router.push(`/resumes/${newResumeId}`);
    } else {
      router.push('/builder');
    }
  };

  const getGenerateValidationError = (trimmedDescription: string) => {
    if (!trimmedDescription) return null;
    if (trimmedDescription.length < 50) {
      return '职位描述过短。请添加更多细节后重试。';
    }
    return null;
  };

  const runGenerate = async (resumeId: string, description: string) => {
    try {
      // 1. Upload Job Description
      // The API expects an array of strings
      const jobId = await uploadJobDescriptions([description], resumeId);
      incrementJobs(); // Update cached counter

      // 2. Preview Resume
      const result = await previewImproveResume(resumeId, jobId, selectedPromptId);

      if (!result?.data?.diff_summary || !result?.data?.detailed_changes) {
        console.warn('Diff data missing for tailor preview; requesting user confirmation.');
        setDiffConfirmError(null);
        setPendingResult(null);
        setShowDiffModal(false);
        setMissingDiffError(null);
        setMissingDiffResult(result);
        setShowMissingDiffDialog(true);
        return;
      }

      // 3. Show diff preview modal
      setDiffConfirmError(null);
      setMissingDiffError(null);
      setPendingResult(result);
      setShowDiffModal(true);
    } catch (err) {
      console.error(err);
      // Check for common error patterns
      const errorMessage = err instanceof Error ? err.message : '';
      if (
        errorMessage.toLowerCase().includes('api key') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('authentication') ||
        errorMessage.includes('401')
      ) {
        setError('您的 API 密钥无效。请在设置中检查。');
      } else if (
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.includes('429')
      ) {
        setError('已达到速率限制。请等待约一分钟后重试。');
      } else if (
        errorMessage.toLowerCase().includes('timed out') ||
        errorMessage.toLowerCase().includes('timeout')
      ) {
        setError('请求超时。请尝试使用更短的职位描述或检查网络连接后重试。');
      } else {
        setError('无法预览简历。请在设置中检查 API 密钥后重试。');
      }
    }
  };

  const handleGenerate = async () => {
    const trimmedDescription = jobDescription.trim();
    if (!trimmedDescription || !masterResumeId) return;
    const validationError = getGenerateValidationError(trimmedDescription);
    if (validationError) {
      setError(validationError);
      return;
    }
    const resumeId = masterResumeId;
    setIsLoading(true);
    setError(null);
    startTimer();
    try {
      await runGenerate(resumeId, trimmedDescription);
    } finally {
      setIsLoading(false);
      stopTimer();
    }
  };

  // User confirms changes
  const handleConfirmChanges = async () => {
    if (!pendingResult || isConfirming) return;

    setIsConfirming(true);
    setError(null);
    setDiffConfirmError(null);

    try {
      await confirmAndNavigate(pendingResult);
      setShowDiffModal(false);
      setPendingResult(null);
    } catch (err) {
      console.error(err);
      const errorMessage = '无法应用更改。请重试。';
      setError(errorMessage);
      setDiffConfirmError(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  // User rejects changes
  const handleRejectChanges = () => {
    setShowDiffModal(false);
    setPendingResult(null);
    setDiffConfirmError(null);
    setShowRegenerateDialog(true);
  };

  const handleCloseDiffModal = () => {
    setShowDiffModal(false);
    setPendingResult(null);
    setDiffConfirmError(null);
  };

  const handleCloseMissingDiffDialog = () => {
    setShowMissingDiffDialog(false);
    setMissingDiffResult(null);
    setMissingDiffError(null);
    missingDiffConfirmInFlight.current = false;
  };

  const handleMissingDiffConfirm = async () => {
    if (!missingDiffResult || isLoading || missingDiffConfirmInFlight.current) return;
    missingDiffConfirmInFlight.current = true;
    setIsLoading(true);
    setError(null);
    setMissingDiffError(null);
    try {
      await confirmAndNavigate(missingDiffResult);
      handleCloseMissingDiffDialog();
    } catch (err) {
      console.error(err);
      const errorMessage = '无法应用更改。请重试。';
      setError(errorMessage);
      setMissingDiffError(errorMessage);
    } finally {
      missingDiffConfirmInFlight.current = false;
      setIsLoading(false);
    }
  };

  const handleRegenerateConfirm = async () => {
    setShowRegenerateDialog(false);
    const trimmedDescription = jobDescription.trim();
    if (!trimmedDescription || !masterResumeId) return;
    const validationError = getGenerateValidationError(trimmedDescription);
    if (validationError) {
      setError(validationError);
      return;
    }
    const resumeId = masterResumeId;
    setIsLoading(true);
    setError(null);
    startTimer();
    try {
      await runGenerate(resumeId, trimmedDescription);
    } finally {
      setIsLoading(false);
      stopTimer();
    }
  };

  if (noResumeId) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center px-6 py-32">
          <div className="max-w-md text-center space-y-6">
            <div className="inline-flex rounded-full bg-primary/10 p-4">
              <AlertTriangle className="size-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">请先上传简历</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                你需要先上传一份主简历，才能使用职位匹配功能。请前往「我的简历」页面上传或创建你的第一份简历。
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                前往总览
              </Button>
              <Button onClick={() => router.push('/resumes')}>我的简历</Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl rounded-xl border border-border bg-card p-8 shadow-md md:p-12 lg:p-14 relative">
          {/* Back Button */}
          <Button variant="link" className="absolute top-4 left-4" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
            {'返回'}
          </Button>

          <div className="mb-8 mt-4 text-center">
            <h1 className="font-serif text-4xl font-bold uppercase tracking-tight mb-2">
              {'定制您的简历'}
            </h1>
            <p className="font-mono text-sm text-blue-700 font-bold uppercase">
              {'// '}
              {'在下方粘贴职位描述'}
            </p>
          </div>

          {/* LLM not configured — non-blocking info banner */}
          {!statusLoading && !isLlmConfigured && (
            <div className="mb-6 border border-blue-200 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-3">
                <FileSearch className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-sans text-xs text-blue-700">
                    使用默认 DeepSeek 模型，可直接分析。如需更好效果，可
                    <Link href="/settings" className="text-blue-600 underline mx-1">
                      去设置
                    </Link>
                    配置自己的 API Key（免费注册即送500万tokens）
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <Dropdown
              options={
                promptOptions.length > 0
                  ? promptOptions.map((opt) => ({
                      id: opt.id,
                      label: t(`tailor.promptOptions.${opt.id}.label`),
                      description: t(`tailor.promptOptions.${opt.id}.description`),
                    }))
                  : [
                      {
                        id: 'nudge',
                        label: '轻度调整',
                        description: '最小化修改以更好匹配现有经验。',
                      },
                      {
                        id: 'keywords',
                        label: '关键词增强',
                        description: '不改变角色或范围，融入相关关键词。',
                      },
                      {
                        id: 'full',
                        label: '完全定制',
                        description: '基于职位描述进行全面定制。',
                      },
                    ]
              }
              value={selectedPromptId}
              onChange={(value) => {
                hasUserSelectedPrompt.current = true;
                setSelectedPromptId(value);
              }}
              label={'匹配强度'}
              description={'选择与职位描述对齐的程度。'}
              disabled={isLoading || promptLoading}
            />

            <div className="relative">
              <Textarea
                placeholder={'在此粘贴职位描述...'}
                className="min-h-[300px] font-mono text-sm bg-background border-2 border-black focus:ring-0 focus:border-blue-700 resize-none p-4 rounded-none"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                disabled={isLoading}
              />
              <div className="absolute bottom-2 right-2 text-xs font-mono text-steel-grey pointer-events-none">
                {t('tailor.charactersCount', { count: jobDescription.length })}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-mono flex items-center gap-2">
                <span>!</span> {error}
              </div>
            )}

            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isLoading || statusLoading || !jobDescription.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {'处理中...'}
                  {elapsed > 0 && (
                    <span className="font-mono text-xs opacity-70 ml-2">{elapsed}s</span>
                  )}
                </>
              ) : statusLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {'检查中...'}
                </>
              ) : (
                '生成定制简历'
              )}
            </Button>
          </div>
        </div>

        {/* Diff preview modal */}
        {showDiffModal && pendingResult && (
          <DiffPreviewModal
            isOpen={showDiffModal}
            isConfirming={isConfirming}
            onClose={handleCloseDiffModal}
            onReject={handleRejectChanges}
            onConfirm={handleConfirmChanges}
            diffSummary={pendingResult?.data?.diff_summary}
            detailedChanges={pendingResult?.data?.detailed_changes}
            errorMessage={diffConfirmError ?? undefined}
          />
        )}

        <ConfirmDialog
          open={showRegenerateDialog}
          onOpenChange={setShowRegenerateDialog}
          title={'重新生成定制简历？'}
          description={'这将丢弃当前预览并请求新的 AI 定制结果。'}
          confirmLabel={'重新生成'}
          cancelLabel={'取消'}
          variant="warning"
          onConfirm={handleRegenerateConfirm}
        />

        <ConfirmDialog
          open={showMissingDiffDialog}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseMissingDiffDialog();
            }
          }}
          title={'无法计算变更'}
          description={
            '无法为此简历计算差异。这可能发生在缺少结构化数据的旧简历上。你可以继续保存定制简历，或取消后再检查。'
          }
          confirmLabel={'继续保存'}
          cancelLabel={'取消'}
          variant="warning"
          closeOnConfirm={false}
          onConfirm={handleMissingDiffConfirm}
          onCancel={handleCloseMissingDiffDialog}
          confirmDisabled={isLoading || !missingDiffResult}
          errorMessage={missingDiffError ?? undefined}
        />
      </div>

      <NextSteps
        message="完成定制后："
        links={[
          { label: '回到首页', href: '/dashboard', variant: 'outline' },
          { label: 'JD 分析', href: '/jd-analysis', variant: 'outline' },
        ]}
      />
    </AppLayout>
  );
}
