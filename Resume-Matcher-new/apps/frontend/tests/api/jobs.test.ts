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

import { uploadJobDescriptions } from '@/lib/api/resume';

describe('POST /jobs/upload — 职位上传', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 上传JD返回job_id', async () => {
    mockFetch.mockResolvedValue(mockResponse({ job_id: ['jd_abc123'], message: 'ok' }));
    const jobId = await uploadJobDescriptions(['Python developer with 5 years experience'], 'res123');
    expect(jobId).toBe('jd_abc123');

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.job_descriptions).toEqual(['Python developer with 5 years experience']);
    expect(body.resume_id).toBe('res123');
  });

  it('400: 上传失败抛出错误', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 400));
    await expect(uploadJobDescriptions(['short'], 'res123')).rejects.toThrow('Upload failed with status 400');
  });

  it('网络错误: fetch拒绝', async () => {
    mockFetch.mockRejectedValue(new Error('Connection lost'));
    await expect(uploadJobDescriptions(['valid JD here'], 'res123')).rejects.toThrow('Connection lost');
  });
});
