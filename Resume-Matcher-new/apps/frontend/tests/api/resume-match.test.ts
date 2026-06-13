import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn<typeof fetch>();
global.fetch = mockFetch;

function mockResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok, status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    blob: async () => new Blob([JSON.stringify(body)]),
    headers: new Headers(),
    redirected: false, statusText: status === 200 ? 'OK' : 'Error',
    type: 'basic', url: '', clone: () => mockResponse(body, ok, status),
    body: null, bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
  } as Response;
}

import { analyzeResumeMatch, fetchAnalysis, fetchAnalysisList } from '@/lib/api/analysis';

describe('POST /resume-match/analyze — 简历匹配分析', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const matchResult = {
    total_score: 78, grade: 'B',
    summary: '匹配度较好', jd_title: '高级数据分析师',
    dimensions: [{ dimension: '硬性技能', score: 80, matched: ['Python'], gaps: ['Docker'], suggestions: ['学习Docker'] }],
    top_suggestions: ['补充Docker经验'],
  };

  it('200: 粘贴模式返回匹配结果', async () => {
    mockFetch.mockResolvedValue(mockResponse(matchResult));
    const result = await analyzeResumeMatch('JD text here for testing...', undefined, 'resume text');
    expect(result.total_score).toBe(78);
    expect(result.grade).toBe('B');

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.resume_text).toBe('resume text');
    expect(body.resume_id).toBeNull();
    expect(body.job_description).toBe('JD text here for testing...');
    expect(body.language).toBe('zh');
  });

  it('200: resume_id模式发送null resume_text', async () => {
    mockFetch.mockResolvedValue(mockResponse(matchResult));
    await analyzeResumeMatch('JD text here for testing...', 'res123');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.resume_id).toBe('res123');
    expect(body.resume_text).toBeNull();
  });

  it('200: 可指定英文输出', async () => {
    mockFetch.mockResolvedValue(mockResponse(matchResult));
    await analyzeResumeMatch('JD text here for testing...', undefined, 'resume', 'en');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.language).toBe('en');
  });

  it('400: 后端返回错误消息', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'Resume has no structured data' }, false, 400));
    await expect(analyzeResumeMatch('JD text here for testing...', 'bad-id')).rejects.toThrow(
      'Resume has no structured data'
    );
  });

  it('400: 无detail时显示状态码', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(analyzeResumeMatch('JD text here for testing...', undefined, 'text')).rejects.toThrow(
      '分析失败 (status 400)'
    );
  });

  it('网络错误: fetch拒绝时抛出', async () => {
    mockFetch.mockRejectedValue(new Error('Network down'));
    await expect(analyzeResumeMatch('JD text here for testing...', undefined, 'text')).rejects.toThrow('Network down');
  });
});

describe('GET /jd-analysis — JD分析', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const analysisResult = {
    analysis_id: 'a1', title: '数据分析师',
    skills_analysis: { summary: '', skill_categories: [], experience_requirements: [], soft_skills: [], education_requirements: [], industry_insights: [], cross_jd_patterns: [] },
    learning_path: { target_role: '', role_type: 'technical' as const, current_gap_summary: '', stages: [], additional_tips: [] },
    job_descriptions: [], created_at: '2026-01-01',
  };

  it('200: fetchAnalysis返回分析详情', async () => {
    mockFetch.mockResolvedValue(mockResponse(analysisResult));
    const result = await fetchAnalysis('a1');
    expect(result.analysis_id).toBe('a1');
  });

  it('400: fetchAnalysis错误', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'Not found' }, false, 404));
    await expect(fetchAnalysis('bad')).rejects.toThrow('Not found');
  });

  it('网络错误: fetchAnalysis', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));
    await expect(fetchAnalysis('a1')).rejects.toThrow('timeout');
  });

  it('200: fetchAnalysisList返回列表', async () => {
    const list = [{ analysis_id: 'a1', title: 'Test', created_at: '2026-01-01', job_count: 2 }];
    mockFetch.mockResolvedValue(mockResponse(list));
    const result = await fetchAnalysisList();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test');
  });

  it('400: fetchAnalysisList错误', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 500));
    await expect(fetchAnalysisList()).rejects.toThrow('Failed to fetch analysis list');
  });
});
