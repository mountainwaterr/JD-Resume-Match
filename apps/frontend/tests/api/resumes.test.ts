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

import {
  fetchResume, fetchResumeList, updateResume, deleteResume,
  updateCoverLetter, updateOutreachMessage, renameResume,
  generateCoverLetter, generateOutreachMessage, retryProcessing,
  fetchJobDescription, getResumePdfUrl, getCoverLetterPdfUrl, downloadResumePdf,
  downloadCoverLetterPdf,
  improveResume, previewImproveResume, confirmImproveResume,
} from '@/lib/api/resume';

const resumeData = {
  request_id: 'req1',
  data: {
    resume_id: 'res123',
    raw_resume: { id: 1, content: '# Resume', content_type: 'md', created_at: '2026-01-01', processing_status: 'ready' as const },
    processed_resume: { personalInfo: { name: 'Test' }, summary: 'Experienced dev', workExperience: [], education: [], personalProjects: [], additional: { technicalSkills: ['Python'] } },
    cover_letter: null, outreach_message: null, parent_id: null, title: 'My Resume',
  },
};

describe('GET /resumes?resume_id= — 获取简历详情', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 返回简历完整数据', async () => {
    mockFetch.mockResolvedValue(mockResponse(resumeData));
    const result = await fetchResume('res123');
    expect(result.resume_id).toBe('res123');
    expect(result.raw_resume.processing_status).toBe('ready');
  });

  it('400: 简历不存在', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'Not found' }, false, 404));
    await expect(fetchResume('bad')).rejects.toThrow('Failed to load resume');
  });

  it('网络错误', async () => {
    mockFetch.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(fetchResume('res123')).rejects.toThrow('ENOTFOUND');
  });
});

describe('GET /resumes/list — 简历列表', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const listData = {
    data: [
      { resume_id: 'res1', filename: 'cv.pdf', is_master: true, parent_id: null, processing_status: 'ready' as const, created_at: '2026-01-01', updated_at: '2026-06-01' },
      { resume_id: 'res2', filename: 'cv2.pdf', is_master: false, parent_id: 'res1', processing_status: 'ready' as const, created_at: '2026-02-01', updated_at: '2026-06-01' },
    ],
  };

  it('200: 返回简历列表', async () => {
    mockFetch.mockResolvedValue(mockResponse(listData));
    const result = await fetchResumeList();
    expect(result).toHaveLength(2);
  });

  it('200: includeMaster=true包含母版', async () => {
    mockFetch.mockResolvedValue(mockResponse(listData));
    await fetchResumeList(true);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('include_master=true');
  });

  it('400: 列表加载失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 500));
    await expect(fetchResumeList()).rejects.toThrow('Failed to load resumes list');
  });
});

describe('PATCH /resumes/:id — 更新简历', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 更新成功', async () => {
    mockFetch.mockResolvedValue(mockResponse(resumeData));
    const result = await updateResume('res123', { personalInfo: { name: 'Updated' } });
    expect(result.resume_id).toBe('res123');
    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('PATCH');
  });

  it('400: 更新失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(updateResume('bad', {})).rejects.toThrow('Failed to update resume');
  });
});

describe('DELETE /resumes/:id — 删除简历', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 删除成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'deleted' }));
    await deleteResume('res123');
    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('DELETE');
  });

  it('400: 删除失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 404));
    await expect(deleteResume('bad')).rejects.toThrow('Failed to delete resume');
  });
});

describe('PATCH /resumes/:id/cover-letter — 更新Cover Letter', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 更新成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'ok' }));
    await updateCoverLetter('res123', 'Dear Hiring Manager...');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.content).toBe('Dear Hiring Manager...');
  });

  it('400: 更新失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(updateCoverLetter('bad', '')).rejects.toThrow('Failed to update cover letter');
  });
});

describe('PATCH /resumes/:id/outreach-message — 更新招呼语', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 更新成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'ok' }));
    await updateOutreachMessage('res123', 'Hello...');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.content).toBe('Hello...');
  });

  it('400: 更新失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(updateOutreachMessage('bad', '')).rejects.toThrow('Failed to update outreach message');
  });
});

describe('PATCH /resumes/:id/title — 重命名简历', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 重命名成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'ok' }));
    await renameResume('res123', 'New Title');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.title).toBe('New Title');
  });

  it('400: 重命名失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(renameResume('bad', '')).rejects.toThrow('Failed to rename resume');
  });
});

describe('POST /resumes/:id/generate-cover-letter — 生成Cover Letter', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 生成成功返回内容', async () => {
    mockFetch.mockResolvedValue(mockResponse({ content: 'Generated cover letter text', message: 'ok' }));
    const result = await generateCoverLetter('res123');
    expect(result).toBe('Generated cover letter text');
  });

  it('400: 生成失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(generateCoverLetter('bad')).rejects.toThrow('Failed to generate cover letter');
  });

  it('网络错误', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));
    await expect(generateCoverLetter('res123')).rejects.toThrow('timeout');
  });
});

describe('POST /resumes/:id/generate-outreach — 生成招呼语', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 生成成功返回内容', async () => {
    mockFetch.mockResolvedValue(mockResponse({ content: 'Generated outreach text', message: 'ok' }));
    const result = await generateOutreachMessage('res123');
    expect(result).toBe('Generated outreach text');
  });

  it('400: 生成失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(generateOutreachMessage('bad')).rejects.toThrow('Failed to generate outreach message');
  });
});

describe('POST /resumes/:id/retry-processing — 重试处理', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 重试成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'ok', request_id: 'r1', resume_id: 'res123', processing_status: 'ready', is_master: false }));
    const result = await retryProcessing('res123');
    expect(result.processing_status).toBe('ready');
  });

  it('400: 重试失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'only failed resumes can retry' }, false, 400));
    await expect(retryProcessing('bad')).rejects.toThrow('only failed resumes can retry');
  });
});

describe('GET /resumes/:id/job-description — 获取关联JD', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 返回JD', async () => {
    mockFetch.mockResolvedValue(mockResponse({ job_id: 'jd1', content: 'Job description content here' }));
    const result = await fetchJobDescription('res123');
    expect(result.job_id).toBe('jd1');
    expect(result.content).toBe('Job description content here');
  });

  it('400: 获取失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 404));
    await expect(fetchJobDescription('bad')).rejects.toThrow('Failed to fetch job description');
  });
});

describe('getResumePdfUrl — PDF URL构建(纯函数)', () => {
  it('构建基础URL含resume_id和默认模板', () => {
    const url = getResumePdfUrl('res123');
    expect(url).toContain('res123/pdf');
    expect(url).toContain('template=swiss-single');
    expect(url).toContain('pageSize=A4');
  });

  it('自定义templateSettings传入URL参数', () => {
    const url = getResumePdfUrl('res123', {
      template: 'modern' as const, pageSize: 'LETTER' as const, showContactIcons: false, compactMode: true,
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
      spacing: { section: 2, item: 1, lineHeight: 1.5 },
      fontSize: { base: 3, headerScale: 3, headerFont: 'sans-serif' as const, bodyFont: 'sans-serif' as const },
      accentColor: 'blue' as const,
    });
    expect(url).toContain('template=modern');
    expect(url).toContain('pageSize=LETTER');
    expect(url).toContain('compactMode=true');
  });

  it('传入locale添加lang参数', () => {
    const url = getResumePdfUrl('res123', undefined, 'zh');
    expect(url).toContain('lang=zh');
  });

  it('空resume_id抛出错误', () => {
    expect(() => getResumePdfUrl('')).toThrow('Resume ID is required.');
    expect(() => getResumePdfUrl('  ')).toThrow('Resume ID is required.');
  });
});

describe('downloadResumePdf — 下载PDF', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 返回Blob', async () => {
    const blob = new Blob(['pdf content']);
    mockFetch.mockResolvedValue(mockResponse(blob));
    const result = await downloadResumePdf('res123');
    expect(result).toBeInstanceOf(Blob);
  });

  it('400: 下载失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(downloadResumePdf('bad')).rejects.toThrow('Failed to download resume');
  });
});

describe('getCoverLetterPdfUrl — Cover Letter PDF URL', () => {
  it('构建URL含默认参数', () => {
    const url = getCoverLetterPdfUrl('res123');
    expect(url).toContain('cover-letter/pdf');
    expect(url).toContain('pageSize=A4');
  });

  it('自定义pageSize和locale', () => {
    const url = getCoverLetterPdfUrl('res123', 'LETTER', 'en');
    expect(url).toContain('pageSize=LETTER');
    expect(url).toContain('lang=en');
  });
});

describe('downloadCoverLetterPdf — 下载Cover Letter PDF', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 返回Blob', async () => {
    mockFetch.mockResolvedValue(mockResponse(new Blob(['pdf'])));
    const result = await downloadCoverLetterPdf('res123');
    expect(result).toBeInstanceOf(Blob);
  });

  it('400: 下载失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(downloadCoverLetterPdf('bad')).rejects.toThrow('Failed to download cover letter');
  });
});

describe('POST /resumes/improve & /resumes/improve/preview — 简历优化', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const improveResult = {
    request_id: 'r1', data: {
      request_id: 'r1', resume_id: 'res123', job_id: 'jd1',
      resume_preview: { personalInfo: {}, summary: '', workExperience: [], education: [], personalProjects: [], additional: {}, sectionMeta: [], customSections: {} },
      improvements: [], cover_letter: null, outreach_message: null,
      diff_summary: null, detailed_changes: null, refinement_stats: null,
      warnings: [], refinement_attempted: false, refinement_successful: false,
    },
  };

  it('200: improveResume', async () => {
    mockFetch.mockResolvedValue(mockResponse(improveResult));
    const result = await improveResume('res123', 'jd1', 'keywords');
    expect(result.request_id).toBe('r1');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.resume_id).toBe('res123');
    expect(body.job_id).toBe('jd1');
    expect(body.prompt_id).toBe('keywords');
  });

  it('200: previewImproveResume', async () => {
    mockFetch.mockResolvedValue(mockResponse(improveResult));
    const result = await previewImproveResume('res123', 'jd1');
    expect(result.request_id).toBe('r1');
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.prompt_id).toBeNull();
  });

  it('400: improve失败抛出', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(improveResume('bad', 'jd1')).rejects.toThrow('Improve failed with status 400');
  });

  it('网络错误: improve', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(improveResume('res123', 'jd1')).rejects.toThrow('ECONNREFUSED');
  });
});

describe('POST /resumes/improve/confirm — 确认优化', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 确认成功', async () => {
    const confirmResult = {
      request_id: 'r1', data: {
        request_id: 'r1', resume_id: 'res_tailored', job_id: 'jd1',
        resume_preview: { personalInfo: {}, summary: '', workExperience: [], education: [], personalProjects: [], additional: {}, sectionMeta: [], customSections: {} },
        improvements: [{ suggestion: 'Add Python' }], cover_letter: null, outreach_message: null,
        diff_summary: null, detailed_changes: null, refinement_stats: null,
        warnings: [], refinement_attempted: true, refinement_successful: true,
      },
    };
    mockFetch.mockResolvedValue(mockResponse(confirmResult));
    const result = await confirmImproveResume({
      resume_id: 'res123', job_id: 'jd1',
      improved_data: { personalInfo: {}, summary: '', workExperience: [], education: [], personalProjects: [], additional: {}, sectionMeta: [], customSections: {} } as never,
      improvements: [{ suggestion: 'Add Python' }],
    });
    expect(result.data.refinement_successful).toBe(true);
  });

  it('400: 确认失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(confirmImproveResume({
      resume_id: 'bad', job_id: 'jd1',
      improved_data: {} as never, improvements: [],
    })).rejects.toThrow('Improve failed with status 400');
  });
});
