'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { analyzeJDs, type JDAnalysisResult } from '@/lib/api/analysis';
import { useStatusCache } from '@/lib/context/status-cache';
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Settings,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  ExternalLink,
  GitBranch,
  Target,
  FileSearch,
} from 'lucide-react';

const IMPORTANCE_COLORS: Record<string, string> = {
  required: 'bg-red-50 border-red-200 text-red-800',
  preferred: 'bg-amber-50 border-amber-200 text-amber-800',
  'nice-to-have': 'bg-green-50 border-green-200 text-green-800',
};

const IMPORTANCE_BORDER: Record<string, string> = {
  required: 'border-l-red-400',
  preferred: 'border-l-amber-400',
  'nice-to-have': 'border-l-green-400',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  入门: 'bg-green-50 border-green-200 text-green-700',
  进阶: 'bg-blue-50 border-blue-200 text-blue-700',
  高级: 'bg-purple-50 border-purple-200 text-purple-700',
};

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function JDAnalysisPage() {
  const { status: systemStatus, isLoading: statusLoading } = useStatusCache();

  const [jobDescriptions, setJobDescriptions] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JDAnalysisResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLlmConfigured = !statusLoading && systemStatus?.llm_configured;

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

  const addJD = () => setJobDescriptions([...jobDescriptions, '']);

  const removeJD = (index: number) => {
    if (jobDescriptions.length <= 1) return;
    setJobDescriptions(jobDescriptions.filter((_, i) => i !== index));
  };

  const updateJD = (index: number, value: string) => {
    const updated = [...jobDescriptions];
    updated[index] = value;
    setJobDescriptions(updated);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  const handleAnalyze = async () => {
    const nonEmpty = jobDescriptions.filter((jd) => jd.trim().length > 0);
    if (nonEmpty.length === 0) {
      setError('请至少粘贴一个职位描述。');
      return;
    }
    for (const jd of nonEmpty) {
      if (jd.trim().length < 50) {
        setError('每个职位描述至少需要 50 个字符。');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    startTimer();
    try {
      const analysisResult = await analyzeJDs(nonEmpty);
      setResult(analysisResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('unauthorized')) {
        setError('分析失败，请在设置页面检查 API 密钥后重试。');
      } else if (msg.toLowerCase().includes('timed out')) {
        setError('分析超时，请减少职位描述数量或缩短内容后重试。');
      } else {
        setError('网络错误，请检查连接后重试。');
      }
    } finally {
      setIsLoading(false);
      stopTimer();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border-soft bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" aria-label="返回">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="font-serif text-2xl text-foreground">JD分析</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            批量分析职位描述，了解岗位的真实需求，制定个性化的学习计划
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>在下方粘贴多个职位描述，AI 将跨岗位分析共同的能力要求</CardTitle>
            <CardDescription>真正看懂雇主要什么</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* LLM not configured — non-blocking info banner */}
            {!statusLoading && !isLlmConfigured && (
              <div className="flex items-start gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
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
            )}

            {jobDescriptions.map((jd, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">JD #{index + 1}</span>
                  {jobDescriptions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeJD(index)}
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                      <span className="ml-1 text-xs">删除</span>
                    </Button>
                  )}
                </div>
                <Textarea
                  value={jd}
                  onChange={(e) => updateJD(index, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="在此粘贴职位描述..."
                  className="min-h-[140px] font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
            ))}

            <Button variant="outline" onClick={addJD} disabled={isLoading} className="w-full">
              <Plus className="w-4 h-4" />
              <span className="ml-2">添加更多JD</span>
            </Button>

            {jobDescriptions.length < 2 && (
              <p className="text-xs text-muted-foreground">
                建议粘贴 2 个以上的职位描述，这样能更准确地发现不同雇主之间的共同要求。
              </p>
            )}
          </CardContent>
        </Card>

        {/* Analyze Button */}
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={isLoading || statusLoading}
            className="w-full max-w-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                分析中...
                {elapsed > 0 && (
                  <span className="font-mono text-xs opacity-70 ml-2">{elapsed}s</span>
                )}
              </>
            ) : statusLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                检查中...
              </>
            ) : (
              '开始分析'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-8">
            {/* Skills Analysis */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-xl">技能要求分析</CardTitle>
                <CardDescription>{result.skills_analysis.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Skill Categories */}
                {result.skills_analysis.skill_categories.length > 0 && (
                  <SectionBlock
                    title="技能分类"
                    defaultExpanded
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    sectionKey="skillCategories"
                  >
                    <div className="space-y-3">
                      {result.skills_analysis.skill_categories.map((cat, i) => (
                        <div
                          key={i}
                          className={`border-l-4 ${IMPORTANCE_BORDER[cat.importance] || 'border-l-muted'} pl-4 py-2`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-sans text-sm font-medium">{cat.category}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${IMPORTANCE_COLORS[cat.importance] || ''}`}
                            >
                              {cat.importance === 'required'
                                ? '必选'
                                : cat.importance === 'preferred'
                                  ? '优选'
                                  : '加分'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cat.skills.map((skill, j) => (
                              <span
                                key={j}
                                className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>
                )}

                {/* Experience Requirements */}
                {result.skills_analysis.experience_requirements.length > 0 && (
                  <SectionBlock
                    title="经验要求"
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    sectionKey="experienceRequirements"
                  >
                    <ul className="space-y-2">
                      {result.skills_analysis.experience_requirements.map((exp, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-16 text-xs font-medium text-muted-foreground uppercase">
                            {exp.level}
                          </span>
                          <span>{exp.description}</span>
                        </li>
                      ))}
                    </ul>
                  </SectionBlock>
                )}

                {/* Soft Skills */}
                {result.skills_analysis.soft_skills.length > 0 && (
                  <SectionBlock
                    title="软技能"
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    sectionKey="softSkills"
                  >
                    <div className="flex flex-wrap gap-2">
                      {result.skills_analysis.soft_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-sm bg-muted px-3 py-1 rounded-full text-muted-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </SectionBlock>
                )}

                {/* Education Requirements */}
                {result.skills_analysis.education_requirements.length > 0 && (
                  <SectionBlock
                    title="学历与证书要求"
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    sectionKey="educationRequirements"
                  >
                    <ul className="list-disc list-inside space-y-1">
                      {result.skills_analysis.education_requirements.map((req, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          {req}
                        </li>
                      ))}
                    </ul>
                  </SectionBlock>
                )}

                {/* Industry Insights */}
                {result.skills_analysis.industry_insights.length > 0 && (
                  <SectionBlock
                    title="行业洞察"
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    sectionKey="industryInsights"
                  >
                    <div className="space-y-3">
                      {result.skills_analysis.industry_insights.map((insight, i) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">{insight.topic}</p>
                          <p className="text-sm text-muted-foreground">{insight.detail}</p>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>
                )}

                {/* Cross-JD Patterns */}
                {result.skills_analysis.cross_jd_patterns.length > 0 && (
                  <SectionBlock
                    title="跨岗位共同模式"
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    sectionKey="crossJDPatterns"
                  >
                    <ul className="space-y-2">
                      {result.skills_analysis.cross_jd_patterns.map((pattern, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary mt-0.5">&#9679;</span>
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </SectionBlock>
                )}
              </CardContent>
            </Card>

            {/* Learning Path */}
            {result.learning_path && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="font-serif text-xl">学习路径</CardTitle>
                  <CardDescription>
                    {result.learning_path.target_role}
                    {' — '}
                    {result.learning_path.current_gap_summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {result.learning_path.stages.map((stage, si) => (
                    <div key={si} className="border border-border-soft rounded-lg p-4">
                      {/* Stage Header */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                          {stage.order}
                        </span>
                        <h3 className="font-sans text-base font-medium">{stage.topic}</h3>
                        {stage.difficulty && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${DIFFICULTY_COLORS[stage.difficulty] || ''}`}
                          >
                            {stage.difficulty}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          前置：{stage.prerequisites}
                        </span>
                      </div>

                      {/* Goal */}
                      <div className="mb-3 ml-11">
                        <p className="text-sm font-medium text-foreground">阶段目标</p>
                        <p className="text-sm text-muted-foreground">{stage.goal}</p>
                      </div>

                      {/* Abilities Covered */}
                      {stage.abilities_covered.length > 0 && (
                        <div className="mb-3 ml-11">
                          <p className="text-xs font-medium text-muted-foreground mb-1">覆盖能力</p>
                          <div className="flex flex-wrap gap-1">
                            {stage.abilities_covered.map((ab, ai) => (
                              <span
                                key={ai}
                                className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground"
                              >
                                {ab}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Readings */}
                      {stage.readings.length > 0 && (
                        <div className="mb-3 ml-11">
                          <p className="text-xs font-medium text-muted-foreground mb-1">推荐阅读</p>
                          <div className="space-y-1">
                            {stage.readings.map((r, ri) => (
                              <a
                                key={ri}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2 text-sm text-primary hover:underline"
                              >
                                <span className="text-muted-foreground mt-0.5">&#9656;</span>
                                <div>
                                  <span className="font-medium">{r.title}</span>
                                  <span className="text-muted-foreground"> — {r.description}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expected Output */}
                      <div className="mb-4 ml-11">
                        <p className="text-xs font-medium text-muted-foreground mb-1">预期产出</p>
                        <p className="text-sm text-muted-foreground italic">
                          &ldquo;{stage.expected_output}&rdquo;
                        </p>
                      </div>

                      {/* Project Cards */}
                      {stage.projects.length > 0 ? (
                        <div className="ml-11 space-y-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            推荐项目 ({stage.projects.length}个)
                          </p>
                          {stage.projects.map((repo, ri) => (
                            <a
                              key={ri}
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-muted/30 hover:bg-muted/60 rounded-lg p-3 transition-colors border border-transparent hover:border-border-soft"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Repo name + meta */}
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-mono text-sm font-medium truncate">
                                      {repo.full_name}
                                    </span>
                                    {repo.language && (
                                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        {repo.language}
                                      </span>
                                    )}
                                  </div>

                                  {/* Difficulty stars + time estimate */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-yellow-500 text-xs">
                                      {'★'.repeat(repo.difficulty_stars)}
                                      {'☆'.repeat(5 - repo.difficulty_stars)}
                                    </span>
                                    {repo.estimated_time && (
                                      <span className="text-xs text-muted-foreground">
                                        预计 {repo.estimated_time}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Star className="w-3 h-3" />
                                      {formatStars(repo.stars)}
                                    </span>
                                  </div>

                                  {/* Why learn */}
                                  {repo.why_learn && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {repo.why_learn}
                                    </p>
                                  )}

                                  {/* Covers abilities */}
                                  {repo.covers_abilities.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {repo.covers_abilities.map((ca, cai) => (
                                        <span
                                          key={cai}
                                          className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                                        >
                                          {ca}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic ml-11">
                          GitHub API 未返回相关项目，请尝试更换搜索关键词或稍后重试。
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Additional Tips */}
                  {result.learning_path.additional_tips.length > 0 && (
                    <SectionBlock
                      title="学习建议"
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                      sectionKey="learningTips"
                    >
                      <ul className="space-y-2">
                        {result.learning_path.additional_tips.map((tip, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-primary mt-0.5">&#9679;</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </SectionBlock>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Next Step Guidance */}
            {result && (
              <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-sm font-medium text-primary">分析完成，下一步：</span>
                <Link href="/tailor">
                  <Button size="sm" className="gap-1.5">
                    <Target className="size-3.5" />
                    用这份分析定制简历
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    返回首页
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Collapsible Section Helper ── */

function SectionBlock({
  title,
  children,
  defaultExpanded = false,
  expandedSections,
  toggleSection,
  sectionKey,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expandedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  sectionKey: string;
}) {
  const isExpanded = expandedSections[sectionKey] ?? defaultExpanded;

  return (
    <div>
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-2 text-left hover:bg-muted/50 rounded-lg px-2 transition-colors"
      >
        <span className="font-sans text-sm font-medium">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isExpanded && <div className="mt-2 pl-2">{children}</div>}
    </div>
  );
}
