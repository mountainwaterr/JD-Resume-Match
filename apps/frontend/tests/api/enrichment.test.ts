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
  analyzeResume, generateEnhancements, applyEnhancements,
  regenerateItems, applyRegeneratedItems,
  type EnrichmentItem, type EnhancedDescription,
  type RegenerateRequest, type RegeneratedItem,
} from '@/lib/api/enrichment';

describe('POST /enrichment/analyze/:id — 简历分析', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const analysisData = {
    items_to_enrich: [
      { item_id: '1', item_type: 'experience' as const, title: 'SDE', current_description: ['did stuff'], weakness_reason: 'vague' },
    ],
    questions: [{ question_id: 'q1', item_id: '1', question: 'What tech?', placeholder: 'e.g. Python' }],
    analysis_summary: 'needs work',
  };

  it('200: 返回待丰富项和问题', async () => {
    mockFetch.mockResolvedValue(mockResponse(analysisData));
    const result = await analyzeResume('res123');
    expect(result.items_to_enrich).toHaveLength(1);
    expect(result.questions).toHaveLength(1);
  });

  it('400: 简历不存在', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'Resume not found' }, false, 400));
    await expect(analyzeResume('bad')).rejects.toThrow('Resume not found');
  });

  it('网络错误: fetch拒绝', async () => {
    mockFetch.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(analyzeResume('res123')).rejects.toThrow('ENOTFOUND');
  });
});

describe('POST /enrichment/enhance — 生成增强描述', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const previewData = {
    enhancements: [
      { item_id: '1', item_type: 'experience' as const, title: 'SDE', original_description: ['did stuff'], enhanced_description: ['built APIs with Python'] },
    ],
  };

  it('200: 返回增强描述', async () => {
    mockFetch.mockResolvedValue(mockResponse(previewData));
    const result = await generateEnhancements('res123', [{ question_id: 'q1', answer: 'used Python' }]);
    expect(result.enhancements).toHaveLength(1);
    expect(result.enhancements[0].enhanced_description).toEqual(['built APIs with Python']);

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.resume_id).toBe('res123');
    expect(body.answers[0].answer).toBe('used Python');
  });

  it('400: 参数错误', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'Invalid answers' }, false, 400));
    await expect(generateEnhancements('res123', [])).rejects.toThrow('Invalid answers');
  });

  it('网络错误', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));
    await expect(generateEnhancements('res123', [{ question_id: 'q1', answer: 'x' }])).rejects.toThrow('timeout');
  });
});

describe('POST /enrichment/apply/:id — 应用增强', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 应用成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'ok', updated_items: 3 }));
    const result = await applyEnhancements('res123', [
      { item_id: '1', item_type: 'experience', title: 'SDE', original_description: [], enhanced_description: ['new'] },
    ]);
    expect(result.updated_items).toBe(3);
  });

  it('400: 应用失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'Resume not found' }, false, 400));
    await expect(applyEnhancements('bad', [])).rejects.toThrow('Resume not found');
  });

  it('网络错误', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    await expect(applyEnhancements('res123', [])).rejects.toThrow('offline');
  });
});

describe('POST /enrichment/regenerate — AI重新生成', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const regenerateResp = {
    regenerated_items: [
      { item_id: '1', item_type: 'experience' as const, title: 'SDE', original_content: ['old'], new_content: ['new desc'], diff_summary: 'improved' },
    ],
    errors: [],
  };

  it('200: 重新生成成功', async () => {
    mockFetch.mockResolvedValue(mockResponse(regenerateResp));
    const req: RegenerateRequest = {
      resume_id: 'res123',
      items: [{ item_id: '1', item_type: 'experience', title: 'SDE', current_content: ['old'] }],
      instruction: 'make it better',
    };
    const result = await regenerateItems(req);
    expect(result.regenerated_items).toHaveLength(1);
    expect(result.regenerated_items[0].new_content).toEqual(['new desc']);
  });

  it('400: 生成失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'Invalid items' }, false, 400));
    const req: RegenerateRequest = { resume_id: 'bad', items: [], instruction: 'test test' };
    await expect(regenerateItems(req)).rejects.toThrow('Invalid items');
  });

  it('网络错误', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));
    const req: RegenerateRequest = { resume_id: 'res123', items: [], instruction: 'test test' };
    await expect(regenerateItems(req)).rejects.toThrow('timeout');
  });
});

describe('POST /enrichment/apply-regenerated/:id — 应用重新生成', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 应用成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'ok', updated_items: 2 }));
    const items: RegeneratedItem[] = [
      { item_id: '1', item_type: 'experience', title: 'SDE', original_content: [], new_content: ['new'], diff_summary: 'ok' },
    ];
    const result = await applyRegeneratedItems('res123', items);
    expect(result.updated_items).toBe(2);
  });

  it('400: 应用失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'Not found' }, false, 400));
    await expect(applyRegeneratedItems('bad', [])).rejects.toThrow('Not found');
  });

  it('网络错误', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    await expect(applyRegeneratedItems('res123', [])).rejects.toThrow('offline');
  });
});
