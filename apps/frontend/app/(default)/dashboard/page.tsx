'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Settings,
  AlertTriangle,
  Upload,
  FileText,
  FileSearch,
  Target,
  Search,
  ArrowRight,
} from 'lucide-react';

import {
  fetchResume,
  fetchResumeList,
  deleteResume,
  retryProcessing,
  fetchJobDescription,
  type ResumeListItem,
} from '@/lib/api/resume';
import { useStatusCache } from '@/lib/context/status-cache';

type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'loading';

export default function DashboardPage() {
  const [masterResumeId, setMasterResumeId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('loading');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tailoredResumes, setTailoredResumes] = useState<ResumeListItem[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const router = useRouter();

  const {
    status: systemStatus,
    isLoading: statusLoading,
    incrementResumes,
    decrementResumes,
    setHasMasterResume,
  } = useStatusCache();

  const loadRequestIdRef = useRef(0);
  const jobSnippetCacheRef = useRef<Record<string, string>>({});

  const isLlmConfigured = !statusLoading && systemStatus?.llm_configured;
  const isTailorEnabled =
    Boolean(masterResumeId) && processingStatus === 'ready' && isLlmConfigured;

  const checkResumeStatus = useCallback(async (resumeId: string) => {
    try {
      setProcessingStatus('loading');
      const data = await fetchResume(resumeId);
      const status = data.raw_resume?.processing_status || 'pending';
      setProcessingStatus(status as ProcessingStatus);
    } catch (err: unknown) {
      console.error('Failed to check resume status:', err);
      if (err instanceof Error && err.message.includes('404')) {
        localStorage.removeItem('master_resume_id');
        setMasterResumeId(null);
        return;
      }
      setProcessingStatus('failed');
    }
  }, []);

  useEffect(() => {
    const storedId = localStorage.getItem('master_resume_id');
    if (storedId) {
      setMasterResumeId(storedId);
      checkResumeStatus(storedId);
    }
  }, [checkResumeStatus]);

  const loadTailoredResumes = useCallback(async () => {
    try {
      const data = await fetchResumeList(true);
      const masterFromList = data.find((r) => r.is_master);
      const storedId = localStorage.getItem('master_resume_id');
      const resolvedMasterId = masterFromList?.resume_id || storedId;

      if (resolvedMasterId) {
        localStorage.setItem('master_resume_id', resolvedMasterId);
        setMasterResumeId(resolvedMasterId);
        checkResumeStatus(resolvedMasterId);
      } else {
        localStorage.removeItem('master_resume_id');
        setMasterResumeId(null);
      }

      const filtered = data.filter((r) => r.resume_id !== resolvedMasterId);
      setTailoredResumes(filtered);

      const tailoredWithParent = filtered.filter((r) => r.parent_id);
      const requestId = ++loadRequestIdRef.current;
      const jobSnippets: Record<string, string> = {};
      await Promise.all(
        tailoredWithParent.map(async (r) => {
          if (jobSnippetCacheRef.current[r.resume_id]) {
            jobSnippets[r.resume_id] = jobSnippetCacheRef.current[r.resume_id];
            return;
          }
          try {
            const jd = await fetchJobDescription(r.resume_id);
            const snippet = (jd?.content || '').slice(0, 80);
            jobSnippetCacheRef.current[r.resume_id] = snippet;
            jobSnippets[r.resume_id] = snippet;
          } catch {
            jobSnippetCacheRef.current[r.resume_id] = '';
            jobSnippets[r.resume_id] = '';
          }
        })
      );

      if (requestId === loadRequestIdRef.current) {
        setTailoredResumes((prev) =>
          prev.map((r) => ({
            ...r,
            jobSnippet: jobSnippets[r.resume_id] || '',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load tailored resumes:', err);
    }
  }, [checkResumeStatus]);

  useEffect(() => {
    loadTailoredResumes();
  }, [loadTailoredResumes]);

  // Focus refresh with 30s cooldown to avoid re-fetching on every alt-tab
  const lastFocusRef = useRef(0);
  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastFocusRef.current > 30_000) {
        lastFocusRef.current = Date.now();
        loadTailoredResumes();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadTailoredResumes]);

  const handleUploadComplete = (resumeId: string) => {
    localStorage.setItem('master_resume_id', resumeId);
    setMasterResumeId(resumeId);
    checkResumeStatus(resumeId);
    incrementResumes();
    setHasMasterResume(true);
  };

  const handleRetryProcessing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!masterResumeId) return;
    setIsRetrying(true);
    try {
      const result = await retryProcessing(masterResumeId);
      if (result.processing_status === 'ready') {
        setProcessingStatus('ready');
      } else if (
        result.processing_status === 'processing' ||
        result.processing_status === 'pending'
      ) {
        setProcessingStatus(result.processing_status);
      } else {
        setProcessingStatus('failed');
      }
    } catch (err) {
      console.error('Retry processing failed:', err);
      setProcessingStatus('failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDeleteAndReupload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDeleteAndReupload = async () => {
    if (!masterResumeId) return;
    try {
      await deleteResume(masterResumeId);
      decrementResumes();
      setHasMasterResume(false);
      localStorage.removeItem('master_resume_id');
      setMasterResumeId(null);
      setProcessingStatus('loading');
      setIsUploadDialogOpen(true);
      await loadTailoredResumes();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const getStatusBadge = () => {
    switch (processingStatus) {
      case 'loading':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="size-3 animate-spin" />
            检查中
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="size-3 animate-spin" />
            解析中
          </Badge>
        );
      case 'ready':
        return <Badge variant="default">就绪</Badge>;
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="size-3" />
            失败
          </Badge>
        );
      default:
        return <Badge variant="secondary">待处理</Badge>;
    }
  };

  const formatDate = (value: string) => {
    if (!value) return '未知';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未知';
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: '2-digit',
    });
  };

  const resumeCount = tailoredResumes.length;

  return (
    <AppLayout>
      <div className="space-y-6 p-8">
        {/* LLM info banner — non-blocking */}
        {!isLlmConfigured && !statusLoading && (
          <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-3">
              <FileSearch className="size-4 text-blue-500" />
              <div>
                <p className="text-xs text-blue-700">
                  使用默认 DeepSeek 模型，所有功能可直接使用。如需更好效果，可配置自己的 API Key
                </p>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Settings className="size-3" />
                去设置
              </Button>
            </Link>
          </div>
        )}

        {/* ── Resume Status Card ── */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">我的简历</p>
                  {masterResumeId && processingStatus === 'ready' ? (
                    <p className="text-sm text-muted-foreground">
                      简历已就绪，可进行职位匹配或 JD 分析
                    </p>
                  ) : masterResumeId && processingStatus === 'processing' ? (
                    <p className="text-sm text-muted-foreground">AI 正在解析你的简历…</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">上传简历，开始你的求职之旅</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {masterResumeId && getStatusBadge()}
                {masterResumeId ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/resumes/${masterResumeId}`)}
                    >
                      查看简历
                    </Button>
                    <ResumeUploadDialog
                      open={isUploadDialogOpen}
                      onOpenChange={setIsUploadDialogOpen}
                      onUploadComplete={handleUploadComplete}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsUploadDialogOpen(true)}
                        >
                          <Upload className="size-3.5 mr-1.5" />
                          更新
                        </Button>
                      }
                    />
                    {(processingStatus === 'failed' || processingStatus === 'processing') && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRetryProcessing}
                          disabled={isRetrying}
                        >
                          {isRetrying ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={handleDeleteAndReupload}
                        >
                          删除重传
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <ResumeUploadDialog
                    open={isUploadDialogOpen}
                    onOpenChange={setIsUploadDialogOpen}
                    onUploadComplete={handleUploadComplete}
                    trigger={
                      <Button size="sm" onClick={() => setIsUploadDialogOpen(true)}>
                        <Upload className="size-3.5 mr-1.5" />
                        上传简历
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            快速开始
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 职位匹配 — always clickable, /tailor handles no-resume state */}
            <Link href="/tailor" className="block group">
              <Card className="shadow-sm h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                      <Target className="size-5 text-blue-600" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="font-semibold mb-1">职位匹配</h3>
                  <p className="text-sm text-muted-foreground">粘贴职位描述，AI 定制简历</p>
                </CardContent>
              </Card>
            </Link>

            {/* JD分析 — always available */}
            <Link href="/jd-analysis" className="block group">
              <Card className="shadow-sm h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
                      <Search className="size-5 text-emerald-600" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="font-semibold mb-1">JD 分析</h3>
                  <p className="text-sm text-muted-foreground">分析JD，生成学习路径+项目推荐</p>
                </CardContent>
              </Card>
            </Link>

            {/* 简历匹配分析 — always available */}
            <Link href="/resume-match" className="block group">
              <Card className="shadow-sm h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50">
                      <FileSearch className="size-5 text-purple-600" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="font-semibold mb-1">简历匹配分析</h3>
                  <p className="text-sm text-muted-foreground">6维度打分，关键词级修改建议</p>
                </CardContent>
              </Card>
            </Link>

            {/* 管理简历 — always clickable, /resumes handles empty state */}
            <Link href="/resumes" className="block group">
              <Card className="shadow-sm h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
                      <FileText className="size-5 text-amber-600" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <h3 className="font-semibold mb-1">管理简历</h3>
                  <p className="text-sm text-muted-foreground">查看、编辑、导出你的简历</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* ── Recent Activity ── */}
        {tailoredResumes.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                最近定制
              </h2>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-xs"
                onClick={() => router.push('/tailor')}
                disabled={!isTailorEnabled}
              >
                <Plus className="size-3" />
                新建匹配
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tailoredResumes.slice(0, 3).map((resume) => {
                const title = resume.title || resume.jobSnippet || resume.filename || '定制简历';
                const colorIdx =
                  Math.abs(
                    title.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
                  ) % 4;
                const accentColors = [
                  'bg-blue-100 text-blue-700',
                  'bg-emerald-100 text-emerald-700',
                  'bg-amber-100 text-amber-700',
                  'bg-purple-100 text-purple-700',
                ];
                return (
                  <Card
                    key={resume.resume_id}
                    className="cursor-pointer shadow-sm transition-shadow hover:shadow-md"
                    onClick={() => router.push(`/resumes/${resume.resume_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${accentColors[colorIdx]}`}
                        >
                          {title.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-medium">{title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(resume.updated_at || resume.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="删除主简历"
          description="删除主简历将同时删除所有关联的定制简历，此操作不可撤销。"
          confirmLabel="删除并重新上传"
          cancelLabel="保留"
          onConfirm={confirmDeleteAndReupload}
          variant="danger"
        />
      </div>
    </AppLayout>
  );
}
