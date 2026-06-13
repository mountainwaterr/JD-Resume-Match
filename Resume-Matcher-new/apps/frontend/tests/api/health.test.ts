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

import { fetchSystemStatus } from '@/lib/api/config';

describe('GET /status — 系统状态', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 返回系统状态', async () => {
    const data = {
      status: 'ready', llm_configured: true, llm_healthy: true,
      has_master_resume: false,
      database_stats: { total_resumes: 0, total_jobs: 0, total_improvements: 0, has_master_resume: false },
    };
    mockFetch.mockResolvedValue(mockResponse(data));

    const result = await fetchSystemStatus();
    expect(result.status).toBe('ready');
    expect(result.llm_healthy).toBe(true);
  });

  it('失败: 非ok响应抛出错误', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'down' }, false, 500));
    await expect(fetchSystemStatus()).rejects.toThrow('Failed to fetch system status');
  });

  it('网络错误: fetch拒绝时抛出', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(fetchSystemStatus()).rejects.toThrow('ECONNREFUSED');
  });
});
