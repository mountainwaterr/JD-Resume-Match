/**
 * JD Analysis API Client
 *
 * Functions for analyzing job descriptions and generating staged learning paths.
 */

import { apiFetch, apiPost } from './client';

// --- Types ---

export interface SkillCategory {
  category: string;
  skills: string[];
  importance: 'required' | 'preferred' | 'nice-to-have';
}

export interface ExperienceRequirement {
  description: string;
  level: 'entry' | 'mid' | 'senior' | 'lead';
}

export interface IndustryInsight {
  topic: string;
  detail: string;
}

export interface SkillsAnalysisResult {
  summary: string;
  skill_categories: SkillCategory[];
  experience_requirements: ExperienceRequirement[];
  soft_skills: string[];
  education_requirements: string[];
  industry_insights: IndustryInsight[];
  cross_jd_patterns: string[];
}

// Phase 2: Learning Path

export interface Reading {
  title: string;
  url: string;
  description: string;
}

export interface GitHubRepo {
  full_name: string;
  html_url: string;
  description: string;
  stars: number;
  language: string;
  topics: string[];
  difficulty_stars: number;
  estimated_time: string;
  why_learn: string;
  covers_abilities: string[];
}

export interface LearningStage {
  order: number;
  topic: string;
  goal: string;
  prerequisites: string;
  difficulty: '入门' | '进阶' | '高级' | '';
  abilities_covered: string[];
  readings: Reading[];
  expected_output: string;
  projects: GitHubRepo[];
}

export interface LearningPath {
  target_role: string;
  role_type: 'technical' | 'non_technical' | 'hybrid';
  current_gap_summary: string;
  stages: LearningStage[];
  additional_tips: string[];
}

export interface JDAnalysisResult {
  analysis_id: string;
  skills_analysis: SkillsAnalysisResult;
  learning_path: LearningPath;
  job_descriptions: string[];
  created_at: string;
  title: string;
}

export interface AnalysisListItem {
  analysis_id: string;
  title: string;
  created_at: string;
  job_count: number;
}

// --- API Functions ---

export async function analyzeJDs(
  jobDescriptions: string[],
  language = 'zh'
): Promise<JDAnalysisResult> {
  const res = await apiPost(
    '/jd-analysis/analyze',
    { job_descriptions: jobDescriptions, language },
    180_000 // LLM call — needs longer timeout
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to analyze JDs (status ${res.status}).`);
  }

  return res.json();
}

export async function fetchAnalysis(analysisId: string): Promise<JDAnalysisResult> {
  const res = await apiFetch(`/jd-analysis/${analysisId}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to fetch analysis (status ${res.status}).`);
  }

  return res.json();
}

export async function fetchAnalysisList(): Promise<AnalysisListItem[]> {
  const res = await apiFetch('/jd-analysis/', { credentials: 'include' });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to fetch analysis list (status ${res.status}).`);
  }

  return res.json();
}

// --- Resume Match Analysis Types ---

export interface DimensionScore {
  dimension: string;
  score: number;
  matched: string[];
  gaps: string[];
  suggestions: string[];
}

export interface MatchAnalysisResult {
  total_score: number;
  grade: string;
  summary: string;
  jd_title: string;
  dimensions: DimensionScore[];
  top_suggestions: string[];
}

// --- Resume Match API ---

export async function analyzeResumeMatch(
  jobDescription: string,
  resumeId?: string,
  resumeText?: string,
  language = 'zh'
): Promise<MatchAnalysisResult> {
  const res = await apiPost(
    '/resume-match/analyze',
    {
      resume_id: resumeId ?? null,
      resume_text: resumeText ?? null,
      job_description: jobDescription,
      language,
    },
    150_000 // LLM call — needs longer timeout
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `分析失败 (status ${res.status})`);
  }

  return res.json();
}
