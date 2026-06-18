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
  fetchLlmConfig, updateLlmConfig, fetchLlmApiKey, updateLlmApiKey,
  testLlmConnection, fetchFeatureConfig, updateFeatureConfig,
  fetchLanguageConfig, updateLanguageConfig,
  fetchPromptConfig, updatePromptConfig,
  fetchFeaturePrompts, updateFeaturePrompts, FeaturePromptsError,
  fetchApiKeyStatus, updateApiKeys, deleteApiKey, clearAllApiKeys,
  resetDatabase,
} from '@/lib/api/config';

describe('GET /config/llm-api-key — LLM配置', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const cfg = { provider: 'deepseek', model: 'deepseek-chat', api_key: 'sk-masked', api_base: null, reasoning_effort: null };

  it('200: 返回LLM配置', async () => {
    mockFetch.mockResolvedValue(mockResponse(cfg));
    const result = await fetchLlmConfig();
    expect(result.provider).toBe('deepseek');
    expect(result.model).toBe('deepseek-chat');
  });

  it('400: 加载失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 500));
    await expect(fetchLlmConfig()).rejects.toThrow('Failed to load LLM config');
  });

  it('fetchLlmApiKey: 返回masked key', async () => {
    mockFetch.mockResolvedValue(mockResponse(cfg));
    const key = await fetchLlmApiKey();
    expect(key).toBe('sk-masked');
  });
});

describe('PUT /config/llm-api-key — 更新LLM配置', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 更新成功', async () => {
    const updated = { provider: 'openai', model: 'gpt-4', api_key: 'sk-new', api_base: 'https://api.openai.com/v1', reasoning_effort: null };
    mockFetch.mockResolvedValue(mockResponse(updated));
    const result = await updateLlmConfig({ model: 'gpt-4' });
    expect(result.model).toBe('gpt-4');

    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('PUT');
  });

  it('400: 更新失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'invalid model' }, false, 400));
    await expect(updateLlmConfig({ model: '' })).rejects.toThrow('invalid model');
  });
});

describe('POST /config/llm-test — 测试LLM连接', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 连接成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ healthy: true, provider: 'deepseek', model: 'deepseek-chat' }));
    const result = await testLlmConnection();
    expect(result.healthy).toBe(true);
  });

  it('200: 带临时配置测试', async () => {
    mockFetch.mockResolvedValue(mockResponse({ healthy: false, provider: 'openai', model: 'gpt-4', error: '401 Unauthorized' }));
    const result = await testLlmConnection({ model: 'gpt-4', api_key: 'bad' });
    expect(result.healthy).toBe(false);
    expect(result.error).toBe('401 Unauthorized');
  });

  it('失败: 网络错误', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));
    await expect(testLlmConnection()).rejects.toThrow('timeout');
  });
});

describe('GET/PUT /config/features — 功能开关', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 获取功能配置', async () => {
    mockFetch.mockResolvedValue(mockResponse({ enable_cover_letter: true, enable_outreach_message: false }));
    const result = await fetchFeatureConfig();
    expect(result.enable_cover_letter).toBe(true);
  });

  it('200: 更新功能配置', async () => {
    mockFetch.mockResolvedValue(mockResponse({ enable_cover_letter: false, enable_outreach_message: true }));
    const result = await updateFeatureConfig({ enable_cover_letter: false });
    expect(result.enable_outreach_message).toBe(true);
  });

  it('400: 更新失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'invalid' }, false, 400));
    await expect(updateFeatureConfig({})).rejects.toThrow('invalid');
  });
});

describe('GET/PUT /config/language — 语言配置', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const langCfg = { ui_language: 'zh' as const, content_language: 'zh' as const, supported_languages: ['en', 'es', 'zh', 'ja', 'pt'] as const };

  it('200: 获取语言配置', async () => {
    mockFetch.mockResolvedValue(mockResponse(langCfg));
    const result = await fetchLanguageConfig();
    expect(result.ui_language).toBe('zh');
  });

  it('200: 更新语言配置', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ...langCfg, content_language: 'en' as const }));
    const result = await updateLanguageConfig({ content_language: 'en' });
    expect(result.content_language).toBe('en');
  });

  it('400: 不支持的語言', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'unsupported language' }, false, 400));
    await expect(updateLanguageConfig({ content_language: 'fr' as never })).rejects.toThrow('unsupported language');
  });
});

describe('GET/PUT /config/prompts — 提示词配置', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 获取prompt配置', async () => {
    mockFetch.mockResolvedValue(mockResponse({ default_prompt_id: 'keywords', prompt_options: [{ id: 'keywords', label: 'Keywords', description: 'focus on keywords' }] }));
    const result = await fetchPromptConfig();
    expect(result.default_prompt_id).toBe('keywords');
  });

  it('200: 更新prompt配置', async () => {
    mockFetch.mockResolvedValue(mockResponse({ default_prompt_id: 'full', prompt_options: [] }));
    const result = await updatePromptConfig({ default_prompt_id: 'full' });
    expect(result.default_prompt_id).toBe('full');
  });
});

describe('GET/PUT /config/feature-prompts — 自定义Prompt模板', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  const prompts = {
    cover_letter_prompt: 'Write cover letter for {job_description} {resume_data} in {output_language}',
    outreach_message_prompt: 'Write outreach for {job_description} {resume_data} in {output_language}',
    cover_letter_default: 'default CL', outreach_message_default: 'default OM',
  };

  it('200: 获取模板', async () => {
    mockFetch.mockResolvedValue(mockResponse(prompts));
    const result = await fetchFeaturePrompts();
    expect(result.cover_letter_prompt).toContain('{job_description}');
  });

  it('200: 更新模板', async () => {
    mockFetch.mockResolvedValue(mockResponse(prompts));
    const result = await updateFeaturePrompts({ cover_letter_prompt: 'new prompt' });
    expect(result.cover_letter_prompt).toContain('{job_description}');
  });

  it('422: 缺少占位符返回FeaturePromptsError', async () => {
    const errorDetail = { code: 'missing_placeholders' as const, field: 'cover_letter_prompt' as const, missing: ['{job_description}'] };
    mockFetch.mockResolvedValue(mockResponse({ detail: errorDetail }, false, 422));
    try {
      await updateFeaturePrompts({ cover_letter_prompt: 'bad prompt' });
      expect.fail('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(FeaturePromptsError);
      expect((e as FeaturePromptsError).detail.code).toBe('missing_placeholders');
    }
  });
});

describe('API Keys管理', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 获取API key状态', async () => {
    mockFetch.mockResolvedValue(mockResponse({ providers: [{ provider: 'deepseek', configured: true, masked_key: 'sk-***' }] }));
    const result = await fetchApiKeyStatus();
    expect(result.providers[0].configured).toBe(true);
  });

  it('200: 更新API keys', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'ok', updated_providers: ['deepseek'] }));
    const result = await updateApiKeys({ deepseek: 'sk-new' });
    expect(result.updated_providers).toEqual(['deepseek']);
  });

  it('200: 删除单个API key', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'deleted' }));
    await deleteApiKey('openai');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/config/api-keys/openai');
  });

  it('200: 清除所有API keys', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'cleared' }));
    await clearAllApiKeys();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('confirm=CLEAR_ALL_KEYS');
  });

  it('400: 删除失败', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'invalid provider' }, false, 400));
    await expect(deleteApiKey('unknown' as never)).rejects.toThrow('invalid provider');
  });
});

describe('POST /config/reset — 重置数据库', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('200: 重置成功', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'reset ok' }));
    await resetDatabase();
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.confirm).toBe('RESET_ALL_DATA');
  });

  it('400: 确认码错误', async () => {
    mockFetch.mockResolvedValue(mockResponse({ detail: 'invalid confirm' }, false, 400));
    await expect(resetDatabase()).rejects.toThrow('invalid confirm');
  });
});
