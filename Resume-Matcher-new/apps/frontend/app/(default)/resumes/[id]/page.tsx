'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { NextSteps } from '@/components/common/next-steps';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Resume, { ResumeData } from '@/components/dashboard/resume-component';
import {
  fetchResume,
  downloadResumePdf,
  getResumePdfUrl,
  deleteResume,
  retryProcessing,
  renameResume,
} from '@/lib/api/resume';
import { useStatusCache } from '@/lib/context/status-cache';
import { ArrowLeft, Edit, Download, Loader2, AlertCircle, Sparkles, Pencil } from 'lucide-react';
import { EnrichmentModal } from '@/components/enrichment/enrichment-modal';
import { withLocalizedDefaultSections } from '@/lib/utils/section-helpers';
import { useLanguage } from '@/lib/context/language-context';
import { downloadBlobAsFile, openUrlInNewTab, sanitizeFilename } from '@/lib/utils/download';
import { t } from '@/lib/i18n/t-shim';

type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export default function ResumeViewerPage() {
  const { uiLanguage } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { decrementResumes, setHasMasterResume } = useStatusCache();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [isMasterResume, setIsMasterResume] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteSuccessDialog, setShowDeleteSuccessDialog] = useState(false);
  const [showDownloadSuccessDialog, setShowDownloadSuccessDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showEnrichmentModal, setShowEnrichmentModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resumeTitle, setResumeTitle] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  const resumeId = params?.id as string;

  const localizedResumeData = useMemo(() => {
    if (!resumeData) return null;
    return withLocalizedDefaultSections(resumeData, t);
  }, [resumeData, t]);

  useEffect(() => {
    if (!resumeId) return;

    const loadResume = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchResume(resumeId);

        // Get processing status
        const status = (data.raw_resume?.processing_status || 'pending') as ProcessingStatus;
        setProcessingStatus(status);

        // Capture title for editable display (always set to clear stale state)
        setResumeTitle(data.title ?? null);

        // Prioritize processed_resume if available (structured JSON)
        if (data.processed_resume) {
          setResumeData(data.processed_resume as ResumeData);
          setError(null);
        } else if (status === 'failed') {
          setError('我们无法读取您的简历。请重试处理，或删除后上传其他文件。');
        } else if (status === 'processing') {
          setError('您的简历仍在处理中。请等待几秒后刷新页面。');
        } else if (data.raw_resume?.content) {
          // Try to parse raw_resume content as JSON (for tailored resumes stored as JSON)
          try {
            const parsed = JSON.parse(data.raw_resume.content);
            setResumeData(parsed as ResumeData);
          } catch {
            setError('简历尚未处理。请使用定制功能生成结构化简历。');
          }
        } else {
          setError('没有可用的简历数据。');
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
        setError('加载简历数据失败。');
      } finally {
        setLoading(false);
      }
    };

    loadResume();
    setIsMasterResume(localStorage.getItem('master_resume_id') === resumeId);
  }, [resumeId, t]);

  const handleRetryProcessing = async () => {
    if (!resumeId) return;
    setIsRetrying(true);
    try {
      const result = await retryProcessing(resumeId);
      if (result.processing_status === 'ready') {
        // Reload the page to show the processed resume
        window.location.reload();
      } else {
        setError('我们无法读取您的简历。请重试处理，或删除后上传其他文件。');
      }
    } catch (err) {
      console.error('Retry processing failed:', err);
      setError('我们无法读取您的简历。请重试处理，或删除后上传其他文件。');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleEdit = () => {
    router.push(`/builder?id=${resumeId}`);
  };

  const handleTitleSave = async () => {
    const trimmed = editingTitleValue.trim();
    if (!trimmed || trimmed === resumeTitle) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await renameResume(resumeId, trimmed);
      setResumeTitle(trimmed);
    } catch (err) {
      console.error('Failed to rename resume:', err);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  // Reload resume data after enrichment
  const reloadResumeData = async () => {
    try {
      const data = await fetchResume(resumeId);
      if (data.processed_resume) {
        setResumeData(data.processed_resume as ResumeData);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to reload resume:', err);
    }
  };

  const handleEnrichmentComplete = () => {
    setShowEnrichmentModal(false);
    reloadResumeData();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadResumePdf(resumeId, undefined, uiLanguage);
      const filename = sanitizeFilename(resumeTitle, resumeId, 'resume');
      downloadBlobAsFile(blob, filename);
      setShowDownloadSuccessDialog(true);
    } catch (err) {
      console.error('Failed to download resume:', err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        const fallbackUrl = getResumePdfUrl(resumeId, undefined, uiLanguage);
        const didOpen = openUrlInNewTab(fallbackUrl);
        if (!didOpen) {
          alert(t('common.popupBlocked', { url: fallbackUrl }));
        }
        return;
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteResume = async () => {
    try {
      setDeleteError(null);
      await deleteResume(resumeId);
      // Update cached counters
      decrementResumes();
      if (isMasterResume) {
        localStorage.removeItem('master_resume_id');
        setHasMasterResume(false);
      }
      setShowDeleteDialog(false);
      setShowDeleteSuccessDialog(true);
    } catch (err) {
      console.error('Failed to delete resume:', err);
      setDeleteError('删除简历失败，请重试。');
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteSuccessConfirm = () => {
    setShowDeleteSuccessDialog(false);
    router.push('/dashboard');
  };

  const handleDownloadSuccessConfirm = () => {
    setShowDownloadSuccessDialog(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="mb-4 size-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">{'正在加载简历...'}</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !resumeData) {
    const isProcessing = processingStatus === 'processing';
    const isFailed = processingStatus === 'failed';

    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-32">
          <div
            className={`rounded-xl border p-6 text-center max-w-md ${
              isProcessing
                ? 'bg-blue-50 border-blue-200'
                : isFailed
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex justify-center mb-4">
              {isProcessing ? (
                <Loader2 className="size-8 animate-spin text-blue-700" />
              ) : isFailed ? (
                <AlertCircle className="size-8 text-orange-600" />
              ) : (
                <AlertCircle className="size-8 text-red-600" />
              )}
            </div>
            <p
              className={`font-medium mb-4 ${
                isProcessing ? 'text-blue-700' : isFailed ? 'text-orange-700' : 'text-red-700'
              }`}
            >
              {error || '未找到简历'}
            </p>
            <div className="flex flex-col gap-2">
              {isFailed && (
                <>
                  <Button onClick={handleRetryProcessing} disabled={isRetrying}>
                    {isRetrying ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {'处理中...'}
                      </>
                    ) : (
                      '重试处理'
                    )}
                  </Button>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    {'删除并重新开始'}
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                {'返回仪表板'}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="size-4" />
            {'返回仪表板'}
          </Button>

          <div className="flex gap-3">
            {isMasterResume && (
              <Button onClick={() => setShowEnrichmentModal(true)} className="gap-2">
                <Sparkles className="size-4" />
                {'增强简历'}
              </Button>
            )}
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="size-4" />
              {'编辑简历'}
            </Button>
            <Button variant="success" onClick={handleDownload} disabled={isDownloading}>
              <Download className="size-4" />
              {isDownloading ? '生成中...' : '下载简历'}
            </Button>
          </div>
        </div>

        {/* Editable Title */}
        {!isMasterResume && (
          <div className="no-print">
            {isEditingTitle ? (
              <input
                type="text"
                value={editingTitleValue}
                onChange={(e) => setEditingTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                maxLength={80}
                placeholder={'输入简历标题...'}
                className="w-full max-w-xl border-b-2 border-border bg-transparent px-0 py-1 text-2xl font-semibold outline-none focus:border-primary"
              />
            ) : (
              <button
                onClick={() => {
                  setEditingTitleValue(resumeTitle || '');
                  setIsEditingTitle(true);
                }}
                className="group flex items-center gap-2 border-none bg-transparent p-0 cursor-pointer"
              >
                <h2
                  className={`text-2xl font-semibold border-b-2 border-transparent group-hover:border-border transition-colors ${!resumeTitle ? 'text-muted-foreground' : ''}`}
                >
                  {resumeTitle || '输入简历标题...'}
                </h2>
                <Pencil
                  className={`size-4 transition-opacity ${resumeTitle ? 'opacity-0 group-hover:opacity-60' : 'opacity-40 group-hover:opacity-60'}`}
                />
              </button>
            )}
          </div>
        )}

        {/* Resume Preview */}
        <div className="flex justify-center">
          <div className="resume-print w-full max-w-[250mm] rounded-lg border border-border bg-white shadow-md">
            <Resume
              resumeData={localizedResumeData || resumeData}
              additionalSectionLabels={{
                technicalSkills: '技术技能：',
                languages: '语言能力：',
                certifications: '培训与证书：',
                awards: '荣誉奖项：',
              }}
              sectionHeadings={{
                summary: '个人简介',
                experience: '工作经历',
                education: '教育背景',
                projects: '项目经历',
                certifications: '培训与证书',
                skills: '技能',
                languages: '语言能力',
                awards: '荣誉奖项',
                links: '链接',
              }}
              fallbackLabels={{ name: '你的姓名' }}
            />
          </div>
        </div>

        <div className="flex justify-end no-print">
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            {isMasterResume ? '删除主简历' : '删除简历'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={isMasterResume ? '删除主简历' : '删除简历'}
        description={isMasterResume ? '您的主简历将被永久删除。' : '该简历将被永久删除。'}
        confirmLabel={'删除简历'}
        cancelLabel={'保留简历'}
        onConfirm={handleDeleteResume}
        variant="danger"
      />

      <ConfirmDialog
        open={showDeleteSuccessDialog}
        onOpenChange={setShowDeleteSuccessDialog}
        title={'已删除简历'}
        description={
          isMasterResume ? '您的主简历已从系统中永久删除。' : '该简历已从系统中永久删除。'
        }
        confirmLabel={'返回仪表板'}
        onConfirm={handleDeleteSuccessConfirm}
        variant="success"
        showCancelButton={false}
      />

      <ConfirmDialog
        open={showDownloadSuccessDialog}
        onOpenChange={setShowDownloadSuccessDialog}
        title={'成功'}
        description={'简历已下载'}
        confirmLabel={'确定'}
        onConfirm={handleDownloadSuccessConfirm}
        variant="success"
        showCancelButton={false}
      />

      {deleteError && (
        <ConfirmDialog
          open={!!deleteError}
          onOpenChange={() => setDeleteError(null)}
          title={'删除失败'}
          description={deleteError}
          confirmLabel={'确定'}
          onConfirm={() => setDeleteError(null)}
          variant="danger"
          showCancelButton={false}
        />
      )}

      {/* Enrichment Modal - Only for master resume */}
      {isMasterResume && (
        <EnrichmentModal
          resumeId={resumeId}
          isOpen={showEnrichmentModal}
          onClose={() => setShowEnrichmentModal(false)}
          onComplete={handleEnrichmentComplete}
        />
      )}

      <NextSteps
        message="接下来："
        links={[
          { label: '去职位匹配', href: '/tailor' },
          { label: 'JD 分析', href: '/jd-analysis', variant: 'outline' },
          { label: '回到首页', href: '/dashboard', variant: 'outline' },
        ]}
      />
    </AppLayout>
  );
}
