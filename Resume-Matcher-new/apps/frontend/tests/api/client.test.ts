import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn<typeof fetch>();
global.fetch = mockFetch;

function mockResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    blob: async () => new Blob([JSON.stringify(body)]),
    headers: new Headers(),
    redirected: false,
    statusText: status === 200 ? 'OK' : 'Bad Request',
    type: 'basic',
    url: '',
    clone: () => mockResponse(body, ok, status),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
  } as Response;
}

import { apiFetch, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client';

describe('apiFetch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('200: 正常GET请求返回Response', async () => {
    const data = { status: 'healthy' };
    mockFetch.mockResolvedValue(mockResponse(data, true, 200));

    const res = await apiFetch('/health');
    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual(data);
  });

  it('200: api路径自动加/api/v1前缀', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, true, 200));
    await apiFetch('/health');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/api/v1/health');
  });

  it('200: 绝对URL原样传递', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, true, 200));
    await apiFetch('http://example.com/test');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('http://example.com/test');
  });

  it('200: 自定义timeout传递signal', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, true, 200));
    await apiFetch('/health', {}, 5_000);
    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.signal).toBeDefined();
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('网络错误: fetch拒绝时抛出', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));
    await expect(apiFetch('/health')).rejects.toThrow('Connection refused');
  });

  it('400: 非ok响应仍返回Response(不抛异常)', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'bad request' }, false, 400));
    const res = await apiFetch('/health');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
  });

  it('超时: AbortError转为中文超时提示', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);
    await expect(apiFetch('/health')).rejects.toThrow('Request timed out');
  });

  it('外部取消: AbortError保留取消提示', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    await expect(apiFetch('/health', { signal: controller.signal })).rejects.toThrow(
      'Request cancelled.'
    );
  });
});

describe('apiPost', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('200: POST JSON返回Response', async () => {
    const data = { total_score: 78, grade: 'B' };
    mockFetch.mockResolvedValue(mockResponse(data, true, 200));

    const res = await apiPost('/resume-match/analyze', {
      resume_text: 'test',
      job_description: 'test JD here',
      language: 'zh',
    });

    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual(data);

    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    const body = JSON.parse(options.body as string);
    expect(body.resume_text).toBe('test');
    expect(body.language).toBe('zh');
  });

  it('400: 不抛异常,由调用方处理', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'validation error' }, false, 400));
    const res = await apiPost('/test', {});
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
  });
});

describe('apiPatch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('200: PATCH JSON发送正确', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'ok' }, true, 200));
    const res = await apiPatch('/resumes/id123', { title: 'new title' });
    expect(res.ok).toBe(true);
    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('PATCH');
  });
});

describe('apiPut', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('200: PUT JSON发送正确', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, true, 200));
    const res = await apiPut('/config/llm-api-key', { model: 'gpt-4' });
    expect(res.ok).toBe(true);
    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('PUT');
  });
});

describe('apiDelete', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('200: DELETE请求发送正确', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'deleted' }, true, 200));
    const res = await apiDelete('/resumes/id123');
    expect(res.ok).toBe(true);
    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('DELETE');
  });
});
