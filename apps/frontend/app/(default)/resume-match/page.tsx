'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { NextSteps } from '@/components/common/next-steps';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MatchScoreCard } from '@/components/match/score-card';
import { analyzeResumeMatch, type MatchAnalysisResult } from '@/lib/api/analysis';
import { fetchResumeList, type ResumeListItem } from '@/lib/api/resume';
import { useStatusCache } from '@/lib/context/status-cache';
import { Loader2, AlertTriangle, FileSearch, FileText, ArrowLeft } from 'lucide-react';

type InputMode = 'select' | 'paste';

export default function ResumeMatchPage() {
  const [mode, setMode] = useState<InputMode>('select');
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchAnalysisResult | null>(null);

  const { status: systemStatus } = useStatusCache();

  // Elapsed timer
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

  // Load resumes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchResumeList();
        if (!cancelled) setResumes(data);
      } catch {
        // silently fail, user can paste instead
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = (selectedResumeId || resumeText.trim()) && jobDescription.trim().length >= 50;

  const handleAnalyze = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    startTimer();

    try {
      const data = await analyzeResumeMatch(
        jobDescription,
        selectedResumeId || undefined,
        mode === 'paste' ? resumeText : undefined
      );
      setResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '分析失败';
      setError(msg);
    } finally {
      stopTimer();
      setIsLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}分${sec}秒` : `${sec}秒`;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">回到首页</span>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-gray-900">简历匹配分析</h1>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Beta</span>
        </div>

        {/* LLM status info banner — non-blocking */}
        {!systemStatus?.llm_configured && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <FileSearch className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-blue-700">
                使用默认 DeepSeek 模型，可直接分析。如需更好效果或使用其他模型，
                <Link href="/settings" className="text-blue-600 underline mx-1">
                  去设置
                </Link>
                配置自己的 API Key（免费注册即送500万tokens）
              </p>
            </div>
          </div>
        )}

        {/* Input section */}
        {!result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Resume input */}
            <div className="bg-white border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  简历内容
                </h2>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      mode === 'select'
                        ? 'bg-white shadow text-gray-900 font-medium'
                        : 'text-gray-500'
                    }`}
                    onClick={() => setMode('select')}
                    disabled={resumes.length === 0}
                  >
                    选择已有
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      mode === 'paste'
                        ? 'bg-white shadow text-gray-900 font-medium'
                        : 'text-gray-500'
                    }`}
                    onClick={() => setMode('paste')}
                  >
                    粘贴文本
                  </button>
                </div>
              </div>

              {mode === 'select' ? (
                <div>
                  {resumes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">暂无简历</p>
                      <Link
                        href="/builder"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        创建第一份简历
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {resumes.map((r) => {
                        const isReady = r.processing_status === 'ready';
                        return (
                          <label
                            key={r.resume_id}
                            className={`block border rounded-lg p-3 transition-colors ${
                              !isReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              selectedResumeId === r.resume_id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="resume"
                              value={r.resume_id}
                              checked={selectedResumeId === r.resume_id}
                              onChange={(e) => isReady && setSelectedResumeId(e.target.value)}
                              disabled={!isReady}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">
                                {r.title || r.filename || '未命名简历'}
                              </span>
                              {!isReady && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                  {r.processing_status === 'processing'
                                    ? '解析中'
                                    : r.processing_status === 'failed'
                                      ? '解析失败'
                                      : '待处理'}
                                </span>
                              )}
                            </div>
                            {r.created_at && (
                              <span className="text-xs text-gray-400 mt-0.5 block">
                                {new Date(r.created_at).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Textarea
                  placeholder="在此粘贴简历文本...&#10;&#10;支持纯文本格式，可以包含：&#10;- 个人信息&#10;- 技能列表&#10;- 工作经历&#10;- 项目经验&#10;- 教育背景"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={12}
                  className="text-sm"
                />
              )}
            </div>

            {/* JD input */}
            <div className="bg-white border rounded-xl p-5 space-y-3">
              <h2 className="font-serif font-bold text-gray-900 flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                目标职位描述
              </h2>
              <Textarea
                placeholder="在此粘贴目标岗位的职位描述（JD）...&#10;&#10;至少50个字符，建议完整粘贴岗位职责和要求部分"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={14}
                className="text-sm"
              />
              {jobDescription.trim() && jobDescription.trim().length < 50 && (
                <p className="text-xs text-amber-600">
                  职位描述太短（{jobDescription.trim().length}
                  /50字符），建议粘贴完整的岗位描述以获得更准确的分析
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit button */}
        {!result && (
          <div className="flex justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={!canSubmit || isLoading}
              variant="default"
              size="lg"
              className="px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  分析中... {formatTime(elapsed)}
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4 mr-2" />
                  开始分析
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-gray-900">分析结果</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
              >
                重新分析
              </Button>
            </div>
            <MatchScoreCard result={result} />
          </>
        )}

        <NextSteps
          message="分析完成后："
          links={[
            { label: '回到首页', href: '/dashboard', variant: 'outline' },
            { label: '去定制简历', href: '/tailor', variant: 'outline' },
            { label: 'JD 分析', href: '/jd-analysis', variant: 'outline' },
          ]}
        />
      </div>
    </AppLayout>
  );
}
