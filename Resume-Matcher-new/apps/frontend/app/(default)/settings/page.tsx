'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import Image from 'next/image';
import {
  fetchLlmConfig,
  updateLlmConfig,
  testLlmConnection,
  fetchFeatureConfig,
  updateFeatureConfig,
  fetchPromptConfig,
  updatePromptConfig,
  clearAllApiKeys,
  resetDatabase,
  PROVIDER_INFO,
  fetchFeaturePrompts,
  updateFeaturePrompts,
  FeaturePromptsError,
  type LLMConfigUpdate,
  type LLMProvider,
  type LLMHealthCheck,
  type PromptOption,
  type ReasoningEffort,
  type FeaturePromptsUpdate,
} from '@/lib/api/config';
import { API_URL } from '@/lib/api/client';
import { getVersionString } from '@/lib/config/version';
import { Switch } from '@/components/ui/switch';
import { useStatusCache } from '@/lib/context/status-cache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Key,
  Database,
  Activity,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  FileText,
  Briefcase,
  Sparkles,
  Clock,
  Settings2,
  Globe,
  Trash2,
  AlertTriangle,
  FileSearch,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import type { SupportedLanguage } from '@/lib/api/config';
import type { Locale } from '@/i18n/config';
import { t } from '@/lib/i18n/t-shim';

type Status = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'testing';

const PROVIDERS: LLMProvider[] = [
  'openai',
  'openai_compatible',
  'anthropic',
  'openrouter',
  'gemini',
  'deepseek',
  'groq',
  'ollama',
];

const SEGMENTED_BUTTON_BASE =
  'rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50';
const SEGMENTED_BUTTON_ACTIVE = 'bg-primary text-primary-foreground';
const SEGMENTED_BUTTON_INACTIVE = 'bg-card text-foreground';

const unwrapCodeBlock = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```\s*$/);
  if (fenced) {
    return fenced[1]?.trimEnd() || null;
  }
  return trimmed;
};

const getHealthCheckMessage = (
  t: (key: string, params?: Record<string, string | number>) => string,
  baseKey: string,
  code?: string,
  fallback?: string
): string | null => {
  if (code) {
    const key = `${baseKey}.${code}`;
    const localized = t(key);
    return localized !== key ? localized : (fallback ?? code);
  }
  return fallback ?? null;
};

export default function SettingsPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  // LLM Config state
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiBase, setApiBase] = useState('');
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
  // 'auto' is the UI sentinel for "do not send reasoning_effort". Maps to
  // empty string when persisted to the backend (so gpt-5 auto-migration
  // won't re-fire on next load). Typed tightly so invalid values can't leak
  // through the save path.
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort | 'auto'>('auto');

  // Use cached system status (loaded on app start, refreshes every 30 min)
  const {
    status: systemStatus,
    isLoading: statusLoading,
    lastFetched,
    refreshStatus,
  } = useStatusCache();

  // Health check result from manual test
  const [healthCheck, setHealthCheck] = useState<LLMHealthCheck | null>(null);

  // Feature config state
  const [enableCoverLetter, setEnableCoverLetter] = useState(false);
  const [enableOutreach, setEnableOutreach] = useState(false);
  const [featureConfigLoading, setFeatureConfigLoading] = useState(false);
  const [promptConfigLoading, setPromptConfigLoading] = useState(false);
  const [promptOptions, setPromptOptions] = useState<PromptOption[]>([]);
  const [defaultPromptId, setDefaultPromptId] = useState('keywords');

  // Custom feature prompts (cover letter, cold outreach). Empty string
  // means "use default"; the backend's *_default fields give us the
  // actual default text for placeholder display.
  const [coverLetterPrompt, setCoverLetterPrompt] = useState('');
  const [outreachPrompt, setOutreachPrompt] = useState('');
  const [coverLetterDefault, setCoverLetterDefault] = useState('');
  const [outreachDefault, setOutreachDefault] = useState('');
  const [featurePromptSaving, setFeaturePromptSaving] = useState<string | null>(null);
  const [featurePromptError, setFeaturePromptError] = useState<{
    field: string;
    missing: string[];
  } | null>(null);

  // Danger Zone state
  const [showClearApiKeysDialog, setShowClearApiKeysDialog] = useState(false);
  const [showResetDatabaseDialog, setShowResetDatabaseDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessDialogMessage] = useState({ title: '', description: '' });
  const [isResetting, setIsResetting] = useState(false);

  // Language settings
  const {
    contentLanguage,
    uiLanguage,
    setContentLanguage,
    setUiLanguage,
    languageNames,
    supportedLanguages,
    isLoading: languageLoading,
  } = useLanguage();

  // Translations

  const providerInfo = PROVIDER_INFO[provider] ?? PROVIDER_INFO['openai'];
  const fallbackPromptOptions = useMemo<PromptOption[]>(
    () => [
      {
        id: 'nudge',
        label: '轻度调整',
        description: '最小化修改以更好匹配现有经验。',
      },
      {
        id: 'keywords',
        label: '关键词增强',
        description: '不改变角色或范围，融入相关关键词。',
      },
      {
        id: 'full',
        label: '完全定制',
        description: '基于职位描述进行全面定制。',
      },
    ],
    [t]
  );
  const promptOptionOverrides = useMemo<Record<string, { label: string; description: string }>>(
    () => ({
      nudge: {
        label: '轻度调整',
        description: '最小化修改以更好匹配现有经验。',
      },
      keywords: {
        label: '关键词增强',
        description: '不改变角色或范围，融入相关关键词。',
      },
      full: {
        label: '完全定制',
        description: '基于职位描述进行全面定制。',
      },
    }),
    [t]
  );
  const localizedPromptOptions = useMemo(() => {
    const options = promptOptions.length ? promptOptions : fallbackPromptOptions;
    return options.map((option) => {
      const override = promptOptionOverrides[option.id];
      return override ? { ...option, ...override } : option;
    });
  }, [promptOptions, fallbackPromptOptions, promptOptionOverrides]);
  const healthDetailItems = useMemo(() => {
    if (!healthCheck) return [];

    return [
      {
        key: 'testPrompt',
        label: '测试内容',
        value: unwrapCodeBlock(healthCheck.test_prompt),
      },
      {
        key: 'modelOutput',
        label: '模型输出',
        value: unwrapCodeBlock(healthCheck.model_output),
      },
      {
        key: 'reasoningContent',
        label: '模型思考过程',
        value: unwrapCodeBlock(healthCheck.reasoning_content),
      },
      {
        key: 'errorDetail',
        label: '错误详情',
        value: unwrapCodeBlock(healthCheck.error_detail),
      },
    ].filter((item) => item.value);
  }, [healthCheck, t]);
  const healthCheckError = useMemo(() => {
    if (!healthCheck) return null;
    return getHealthCheckMessage(
      t,
      'settings.llmConfiguration.healthErrors',
      healthCheck.error_code,
      healthCheck.error
    );
  }, [healthCheck, t]);
  const healthCheckWarning = useMemo(() => {
    if (!healthCheck) return null;
    return getHealthCheckMessage(
      t,
      'settings.llmConfiguration.healthWarnings',
      healthCheck.warning_code,
      healthCheck.warning
    );
  }, [healthCheck, t]);

  // Load LLM config and feature config on mount
  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const [llmConfig, featureConfig, promptConfig, featurePrompts] = await Promise.all([
          fetchLlmConfig().catch(() => null),
          fetchFeatureConfig().catch(() => null),
          fetchPromptConfig().catch(() => null),
          fetchFeaturePrompts().catch(() => null),
        ]);

        if (cancelled) return;

        if (llmConfig) {
          const providerFromBackend = llmConfig.provider || 'openai';
          const safeProvider = PROVIDERS.includes(providerFromBackend as LLMProvider)
            ? (providerFromBackend as LLMProvider)
            : 'openai';
          setProvider(safeProvider);
          setModel(llmConfig.model || PROVIDER_INFO[safeProvider].defaultModel);
          const isMaskedKey = Boolean(llmConfig.api_key) && llmConfig.api_key.includes('*');
          setHasStoredApiKey(Boolean(llmConfig.api_key));
          setApiKey(isMaskedKey ? '' : llmConfig.api_key || '');
          setApiBase(llmConfig.api_base || '');
          setReasoningEffort((llmConfig.reasoning_effort as ReasoningEffort | null) ?? 'auto');

          if (providerFromBackend !== safeProvider) {
            setError(t('settings.errors.unknownProvider', { provider: providerFromBackend }));
          }
        }

        if (featureConfig) {
          setEnableCoverLetter(featureConfig.enable_cover_letter);
          setEnableOutreach(featureConfig.enable_outreach_message);
        }

        if (promptConfig) {
          setPromptOptions(promptConfig.prompt_options || []);
          setDefaultPromptId(promptConfig.default_prompt_id || 'keywords');
        }

        if (featurePrompts) {
          setCoverLetterPrompt(featurePrompts.cover_letter_prompt);
          setOutreachPrompt(featurePrompts.outreach_message_prompt);
          setCoverLetterDefault(featurePrompts.cover_letter_default);
          setOutreachDefault(featurePrompts.outreach_message_default);
        }

        setStatus('idle');
      } catch (err) {
        console.error('Failed to load settings', err);
        if (!cancelled) {
          setError('无法连接到服务器。请确认服务器正在运行。');
          setStatus('error');
        }
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // Handle provider change
  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setModel(PROVIDER_INFO[newProvider].defaultModel);

    if (newProvider === 'ollama' && !apiBase.trim()) {
      setApiBase('http://localhost:11434');
    }
    if (newProvider === 'openai_compatible' && !apiBase.trim()) {
      // llama.cpp default; user can override for vLLM / LM Studio / etc.
      setApiBase('http://localhost:8080/v1');
    }

    // Clear API key input when switching providers to avoid accidental cross-provider usage.
    setApiKey('');
    setHasStoredApiKey(false);
  };

  // Save configuration
  const handleSave = async () => {
    setStatus('saving');
    setError(null);
    setHealthCheck(null);

    try {
      if (requiresApiKey && !apiKey.trim() && !hasStoredApiKey) {
        setError('所选提供商需要 API 密钥。');
        setStatus('error');
        return;
      }

      const trimmedKey = apiKey.trim();
      const update: LLMConfigUpdate = {
        provider,
        model: model.trim(),
        api_base: apiBase.trim() || null,
        // Map UI sentinel 'auto' → '' so the server persists an empty string
        // and the gpt-5 auto-migration won't re-fire.
        reasoning_effort: reasoningEffort === 'auto' ? '' : (reasoningEffort as ReasoningEffort),
      };
      // Key-send policy (applies to BOTH requiresKey=true and false):
      //   - User typed a new key → send it (overwrite stored).
      //   - User cleared the field AND has a stored key → omit so stored
      //     key is preserved (matches existing UX; users rotate explicitly).
      //   - No new key, no stored key → send '' so the backend clears the
      //     field (mainly the required path; same shape for consistency).
      if (trimmedKey) {
        update.api_key = trimmedKey;
      } else if (!hasStoredApiKey) {
        update.api_key = '';
      }

      await updateLlmConfig(update);

      // Refresh cached system status after save
      await refreshStatus();

      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save config', err);
      setError((err as Error).message || '无法保存配置');
      setStatus('error');
    }
  };

  // Test connection with current form values (pre-save testing)
  const handleTestConnection = async () => {
    setStatus('testing');
    setError(null);
    setHealthCheck(null);

    try {
      // Build config from current form values
      const testConfig: LLMConfigUpdate = {
        provider,
        model: model.trim() || providerInfo.defaultModel,
        api_base: apiBase.trim() || null,
        reasoning_effort: reasoningEffort === 'auto' ? '' : (reasoningEffort as ReasoningEffort),
      };

      // Send the user-typed key if present (for any provider, required or
      // optional). If blank, omit the field so the backend falls back to
      // the stored key for that provider.
      if (apiKey.trim()) {
        testConfig.api_key = apiKey.trim();
      }

      const result = await testLlmConnection(testConfig);
      setHealthCheck(result);
      setStatus('idle');
    } catch (err) {
      console.error('Failed to test connection', err);
      setHealthCheck({ healthy: false, provider, model, error: (err as Error).message });
      setStatus('idle');
    }
  };

  // Update feature config
  const handleFeatureConfigChange = async (
    key: 'enable_cover_letter' | 'enable_outreach_message',
    value: boolean
  ) => {
    setFeatureConfigLoading(true);
    try {
      const updated = await updateFeatureConfig({ [key]: value });
      setEnableCoverLetter(updated.enable_cover_letter);
      setEnableOutreach(updated.enable_outreach_message);
    } catch (err) {
      console.error('Failed to update feature config', err);
      // Revert on error
      if (key === 'enable_cover_letter') {
        setEnableCoverLetter(!value);
      } else {
        setEnableOutreach(!value);
      }
    } finally {
      setFeatureConfigLoading(false);
    }
  };

  const handleFeaturePromptSave = async (
    field: 'cover_letter_prompt' | 'outreach_message_prompt',
    value: string
  ) => {
    setFeaturePromptSaving(field);
    // Only clear the error for the field being saved; keep errors on the
    // other field visible until the user addresses them.
    setFeaturePromptError((prev) => (prev?.field === field ? null : prev));
    try {
      const update: FeaturePromptsUpdate = { [field]: value };
      const fresh = await updateFeaturePrompts(update);
      setCoverLetterPrompt(fresh.cover_letter_prompt);
      setOutreachPrompt(fresh.outreach_message_prompt);
    } catch (err) {
      if (err instanceof FeaturePromptsError) {
        setFeaturePromptError({ field: err.detail.field, missing: err.detail.missing });
      } else {
        setError((err as Error).message);
      }
    } finally {
      setFeaturePromptSaving(null);
    }
  };

  const handlePromptConfigChange = async (value: string) => {
    setPromptConfigLoading(true);
    setError(null);
    try {
      const updated = await updatePromptConfig({ default_prompt_id: value });
      setDefaultPromptId(updated.default_prompt_id);
      if (updated.prompt_options?.length) {
        setPromptOptions(updated.prompt_options);
      }
    } catch (err) {
      console.error('Failed to update prompt config', err);
      setError((err as Error).message || '无法保存配置');
    } finally {
      setPromptConfigLoading(false);
    }
  };

  // Handle Clear API Keys
  const handleClearApiKeys = async () => {
    setIsResetting(true);
    try {
      await clearAllApiKeys();

      // Refetch full LLM config to ensure local state is synced with backend
      const llmConfig = await fetchLlmConfig().catch(() => null);
      if (llmConfig) {
        setProvider(llmConfig.provider || 'openai');
        setModel(llmConfig.model || PROVIDER_INFO['openai'].defaultModel);
        const isMaskedKey = Boolean(llmConfig.api_key) && llmConfig.api_key.includes('*');
        setHasStoredApiKey(Boolean(llmConfig.api_key));
        setApiKey(isMaskedKey ? '' : llmConfig.api_key || '');
        setApiBase(llmConfig.api_base || '');
        setReasoningEffort(llmConfig.reasoning_effort ?? 'auto');
      } else {
        // Fallback if refetch fails
        setApiKey('');
        setHasStoredApiKey(false);
      }

      setHealthCheck(null);
      // Refresh status
      await refreshStatus();
      setError(null);
      setSuccessDialogMessage({
        title: '成功',
        description: 'API密钥已成功清除',
      });
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Failed to clear API keys', err);
      setError('清除 API 密钥失败，请重试。');
    } finally {
      setIsResetting(false);
      setShowClearApiKeysDialog(false);
    }
  };

  // Handle Reset Database
  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      await resetDatabase();

      // Clear all related localStorage keys
      localStorage.removeItem('master_resume_id');
      localStorage.removeItem('resume_builder_draft');
      localStorage.removeItem('resume_builder_settings');
      localStorage.removeItem('resume_matcher_content_language');
      localStorage.removeItem('resume_matcher_ui_language');

      // Refresh status to show empty counts
      await refreshStatus();
      // Clear health check as context is lost
      setHealthCheck(null);
      setError(null);
      setSuccessDialogMessage({
        title: '成功',
        description: '数据库已成功重置',
      });
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Failed to reset database', err);
      setError('重置数据库失败，请重试。');
    } finally {
      setIsResetting(false);
      setShowResetDatabaseDialog(false);
    }
  };

  // Format last fetched time for display
  const formatLastFetched = () => {
    if (!lastFetched) return '从未';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastFetched.getTime()) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600)
      return t('settings.systemStatus.lastFetched.minutesAgo', { minutes: Math.floor(diff / 60) });
    return t('settings.systemStatus.lastFetched.hoursAgo', { hours: Math.floor(diff / 3600) });
  };

  const requiresApiKey = providerInfo.requiresKey ?? true;

  return (
    <AppLayout>
      <div className="p-6 md:p-12">
        <div className="w-full max-w-4xl rounded-xl border border-border bg-card shadow-md">
          {/* Header */}
          <div className="border-b border-border p-8 bg-white flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{'设置'}</h1>
              <p className="font-mono text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                {'// '}
                {'配置您的偏好'}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
                {'返回'}
              </Button>
            </Link>
          </div>

          <div className="p-8 space-y-10">
            {/* API Key Info Banner */}
            {!statusLoading && systemStatus && !systemStatus.llm_configured && (
              <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileSearch className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">
                      默认使用 DeepSeek 免费模型，开箱即用
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      如需更好效果或使用其他模型（如 GPT-4、Claude），可在下方配置自己的 API Key。
                      <a
                        href="https://platform.deepseek.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline ml-1"
                      >
                        免费注册 DeepSeek 即送500万tokens
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* System Status Panel */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/10 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <h2 className="text-base font-semibold">{'系统状态'}</h2>
                  </div>
                  {lastFetched && (
                    <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLastFetched()}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshStatus}
                  disabled={statusLoading}
                  className="gap-1 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${statusLoading ? 'animate-spin' : ''}`} />
                  {'刷新'}
                </Button>
              </div>

              {statusLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !systemStatus ? (
                <div className="flex flex-col items-center justify-center p-8 gap-3 border border-dashed border-red-300 bg-red-50">
                  <p className="font-mono text-xs text-red-600 uppercase">{'无法连接到服务器'}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {t('settings.systemStatus.expectedAt', { apiUrl: API_URL })}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshStatus}
                    className="gap-1 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {'重试'}
                  </Button>
                </div>
              ) : (
                // @container so the status cards adapt to the section width
                // rather than the viewport — useful when the settings page is
                // shown alongside a sidebar or in a split view.
                <div className="@container">
                  <div className="grid grid-cols-2 @3xl:grid-cols-4 gap-4">
                    {/* LLM Status */}
                    <div className="border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-xs uppercase text-muted-foreground">
                          {'LLM'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {systemStatus.llm_healthy ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-mono text-sm font-bold">
                          {systemStatus.llm_healthy ? '健康' : '离线'}
                        </span>
                      </div>
                    </div>

                    {/* Database Status */}
                    <div className="border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-xs uppercase text-muted-foreground">
                          {'数据库'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-mono text-sm font-bold">{'已连接'}</span>
                      </div>
                    </div>

                    {/* Resumes Count */}
                    <div className="border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-xs uppercase text-muted-foreground">
                          {'简历'}
                        </span>
                      </div>
                      <span className="font-mono text-2xl font-bold">
                        {systemStatus.database_stats.total_resumes}
                      </span>
                    </div>

                    {/* Jobs Count */}
                    <div className="border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-xs uppercase text-muted-foreground">
                          {'职位'}
                        </span>
                      </div>
                      <span className="font-mono text-2xl font-bold">
                        {systemStatus.database_stats.total_jobs}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Stats Row */}
              {systemStatus && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-xs uppercase text-muted-foreground">
                        {'优化'}
                      </span>
                    </div>
                    <span className="font-mono text-2xl font-bold">
                      {systemStatus.database_stats.total_improvements}
                    </span>
                  </div>
                  <div className="border border-border bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-xs uppercase text-muted-foreground">
                        {'主简历'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {systemStatus.has_master_resume ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-mono text-sm font-bold">{'已配置'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-amber-500" />
                          <span className="font-mono text-sm font-bold">{'未设置'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* LLM Configuration */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border/10 pb-2">
                <Key className="w-4 h-4" />
                <h2 className="text-base font-semibold">{'LLM 配置'}</h2>
              </div>

              <div className="grid gap-6">
                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label>{'提供商'}</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleProviderChange(p)}
                        className={`px-3 py-2 text-xs uppercase ${SEGMENTED_BUTTON_BASE} ${
                          provider === p ? SEGMENTED_BUTTON_ACTIVE : SEGMENTED_BUTTON_INACTIVE
                        }`}
                      >
                        {PROVIDER_INFO[p].name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {t('settings.llmConfiguration.selectedProvider', {
                      provider: providerInfo.name,
                    })}
                  </p>
                </div>

                {/* Model Input */}
                <div className="space-y-2">
                  <Label htmlFor="model">{'模型'}</Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={providerInfo.defaultModel}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    {t('settings.llmConfiguration.defaultModel', {
                      model: providerInfo.defaultModel,
                    })}
                  </p>
                </div>

                {/* API Key Input — always enabled. For providers that don't
                  require a key (Ollama, OpenAI-Compatible local servers), the
                  field is marked optional so users can STILL enter a key if
                  their deployment needs auth (e.g., a secured LM Studio or a
                  hosted OpenAI-compatible proxy). Save-time validation only
                  fails when `requiresApiKey` is true. */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey">
                    {'API 密钥'}{' '}
                    {!requiresApiKey && <span className="text-muted-foreground">{'（可选）'}</span>}
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={requiresApiKey ? 'sk-...' : '如果你的服务器不需要认证，留空即可'}
                    className="font-mono"
                  />
                  {hasStoredApiKey && !apiKey && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {'留空以保留现有密钥'}
                    </p>
                  )}
                </div>

                {/* API Base URL (optional, for proxies/aggregators/custom endpoints) */}
                <div className="space-y-2">
                  <Label htmlFor="apiBase">{'Base URL（可选）'}</Label>
                  <Input
                    id="apiBase"
                    value={apiBase}
                    onChange={(e) => setApiBase(e.target.value)}
                    placeholder={'例如 https://api.openai.com/v1'}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    {'可用于中转站/聚合站等自定义接口地址。不填写则使用提供商默认地址。'}
                  </p>
                </div>

                {/* Reasoning Effort (optional, only applies to reasoning-capable models) */}
                <div className="space-y-2">
                  <Label>{'推理深度'}</Label>
                  <Select
                    value={reasoningEffort}
                    onValueChange={(value) =>
                      value && setReasoningEffort(value as ReasoningEffort | 'auto')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { id: 'auto', label: '自动' },
                        {
                          id: 'minimal',
                          label: '极低',
                        },
                        { id: 'low', label: '低' },
                        {
                          id: 'medium',
                          label: '中',
                        },
                        { id: 'high', label: '高' },
                      ].map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {
                      '仅影响具备推理能力的模型（gpt-5 系列、Claude 3.7+、DeepSeek R1、OpenAI o1/o3）。不支持的提供商会自动忽略该参数。'
                    }
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={status === 'saving' || status === 'loading'}
                    className="flex-1"
                  >
                    {status === 'saving' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : status === 'saved' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {'成功'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {'保存'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={status === 'testing' || status === 'saving'}
                  >
                    {status === 'testing' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        {'测试连接'}
                      </>
                    )}
                  </Button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="border border-red-300 bg-red-50 p-3">
                    <p className="text-xs text-red-600 font-mono break-words">
                      {t('settings.llmConfiguration.errorPrefix', { error })}
                    </p>
                  </div>
                )}

                {/* Health Check Result */}
                {healthCheck && (
                  <div
                    className={`border p-4 break-words ${
                      healthCheck.healthy
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {healthCheck.healthy ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-mono text-sm font-bold">
                        {healthCheck.healthy ? '连接成功' : '连接失败'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {t('settings.llmConfiguration.connectionDetails', {
                        provider: healthCheck.provider,
                        model: healthCheck.model,
                      })}
                    </p>
                    {healthCheckError && (
                      <p className="font-mono text-xs text-red-600 mt-1 break-words">
                        {healthCheckError}
                      </p>
                    )}
                    {healthCheckWarning && (
                      <p className="font-mono text-xs text-amber-700 mt-1 break-words">
                        {healthCheckWarning}
                      </p>
                    )}
                    {healthDetailItems.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {healthDetailItems.map((item) =>
                          item.key === 'reasoningContent' ? (
                            <details key={item.key} className="group">
                              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-black">
                                {item.label}
                              </summary>
                              <pre className="mt-1 whitespace-pre-wrap break-words  border border-border bg-white p-3 text-xs text-muted-foreground shadow-sm">
                                {item.value}
                              </pre>
                            </details>
                          ) : (
                            <div key={item.key}>
                              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                {item.label}
                              </p>
                              <pre className="mt-1 whitespace-pre-wrap break-words  border border-border bg-white p-3 text-xs text-muted-foreground shadow-sm">
                                {item.value}
                              </pre>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Content Generation Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border/10 pb-2">
                <Settings2 className="w-4 h-4" />
                <h2 className="text-base font-semibold">{'内容生成'}</h2>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  {'在简历定制过程中启用额外的内容生成。启用后，这些文档将与定制简历一起自动生成。'}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-4">
                    <div>
                      <Label className="font-medium">{'求职信'}</Label>
                      <p className="text-xs text-muted-foreground">{'与简历一起生成定制求职信'}</p>
                    </div>
                    <Switch
                      checked={enableCoverLetter}
                      onCheckedChange={(checked) => {
                        setEnableCoverLetter(checked);
                        handleFeatureConfigChange('enable_cover_letter', checked);
                      }}
                      disabled={featureConfigLoading}
                    />
                  </div>
                  {enableCoverLetter && (
                    <div className="pl-6 space-y-2">
                      <Label htmlFor="coverLetterPrompt">{'自定义提示词（可选）'}</Label>
                      <textarea
                        id="coverLetterPrompt"
                        rows={8}
                        value={coverLetterPrompt}
                        onChange={(e) => setCoverLetterPrompt(e.target.value)}
                        placeholder={coverLetterDefault}
                        className="w-full  border border-border bg-white p-3 font-mono text-xs break-words focus:outline-none focus:shadow-[4px_4px_0_0_#000]"
                      />
                      <p className="text-xs text-muted-foreground font-mono">
                        {
                          '必须包含以下占位符（各自使用大括号括起来）：job_description、resume_data、output_language。留空则使用默认提示词。'
                        }
                      </p>
                      {featurePromptError?.field === 'cover_letter_prompt' && (
                        <p className="text-xs text-red-600 font-mono break-words">
                          {t('settings.contentGeneration.customPromptErrorMissing', {
                            missing: featurePromptError.missing.join(', '),
                          })}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleFeaturePromptSave('cover_letter_prompt', coverLetterPrompt)
                          }
                          disabled={featurePromptSaving === 'cover_letter_prompt'}
                        >
                          {featurePromptSaving === 'cover_letter_prompt' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            '保存'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleFeaturePromptSave('cover_letter_prompt', '')}
                          disabled={featurePromptSaving === 'cover_letter_prompt'}
                        >
                          {'恢复默认'}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-4">
                    <div>
                      <Label className="font-medium">{'冷启动外联消息'}</Label>
                      <p className="text-xs text-muted-foreground">
                        {'生成用于 LinkedIn 或邮件的社交/外联消息'}
                      </p>
                    </div>
                    <Switch
                      checked={enableOutreach}
                      onCheckedChange={(checked) => {
                        setEnableOutreach(checked);
                        handleFeatureConfigChange('enable_outreach_message', checked);
                      }}
                      disabled={featureConfigLoading}
                    />
                  </div>
                  {enableOutreach && (
                    <div className="pl-6 space-y-2">
                      <Label htmlFor="outreachPrompt">{'自定义提示词（可选）'}</Label>
                      <textarea
                        id="outreachPrompt"
                        rows={8}
                        value={outreachPrompt}
                        onChange={(e) => setOutreachPrompt(e.target.value)}
                        placeholder={outreachDefault}
                        className="w-full  border border-border bg-white p-3 font-mono text-xs break-words focus:outline-none focus:shadow-[4px_4px_0_0_#000]"
                      />
                      <p className="text-xs text-muted-foreground font-mono">
                        {
                          '必须包含以下占位符（各自使用大括号括起来）：job_description、resume_data、output_language。留空则使用默认提示词。'
                        }
                      </p>
                      {featurePromptError?.field === 'outreach_message_prompt' && (
                        <p className="text-xs text-red-600 font-mono break-words">
                          {t('settings.contentGeneration.customPromptErrorMissing', {
                            missing: featurePromptError.missing.join(', '),
                          })}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleFeaturePromptSave('outreach_message_prompt', outreachPrompt)
                          }
                          disabled={featurePromptSaving === 'outreach_message_prompt'}
                        >
                          {featurePromptSaving === 'outreach_message_prompt' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            '保存'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleFeaturePromptSave('outreach_message_prompt', '')}
                          disabled={featurePromptSaving === 'outreach_message_prompt'}
                        >
                          {'恢复默认'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/50">
                  <Label>{'提示词设置'}</Label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {'选择用于简历定制的默认提示词。'}
                  </p>
                  <Select
                    value={defaultPromptId}
                    onValueChange={(v) => v && handlePromptConfigChange(v)}
                    disabled={promptConfigLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {localizedPromptOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Language Settings Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border/10 pb-2">
                <Globe className="w-4 h-4" />
                <h2 className="text-base font-semibold">
                  {'界面语言'} & {'内容语言'}
                </h2>
              </div>

              {/* UI Language */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{'界面语言'}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{'用户界面的语言'}</p>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {supportedLanguages.map((lang) => (
                      <button
                        key={`ui-${lang}`}
                        onClick={() => setUiLanguage(lang as Locale)}
                        disabled={languageLoading}
                        className={`px-4 py-3 text-sm ${SEGMENTED_BUTTON_BASE} ${uiLanguage === lang ? SEGMENTED_BUTTON_ACTIVE : SEGMENTED_BUTTON_INACTIVE}`}
                      >
                        {languageNames[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Language */}
              <div className="space-y-4 pt-4 border-t border-paper-tint">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{'内容语言'}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {'生成内容的语言（简历、求职信）'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {supportedLanguages.map((lang) => (
                      <button
                        key={`content-${lang}`}
                        onClick={() => setContentLanguage(lang as SupportedLanguage)}
                        disabled={languageLoading}
                        className={`px-4 py-3 text-sm ${SEGMENTED_BUTTON_BASE} ${contentLanguage === lang ? SEGMENTED_BUTTON_ACTIVE : SEGMENTED_BUTTON_INACTIVE}`}
                      >
                        {languageNames[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-red-200 pb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h2 className="text-base font-semibold text-red-600">{'危险区域'}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Clear API Keys */}
                <div className="border border-red-200 bg-red-50/50 p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-red-900 mb-1">{'清除 API 密钥'}</h3>
                    <p className="text-xs text-red-700">
                      {'从配置中删除所有存储的 API 密钥。此操作无法撤销。'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                    onClick={() => setShowClearApiKeysDialog(true)}
                    disabled={isResetting}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {'清除 API 密钥'}
                  </Button>
                </div>

                {/* Reset Database */}
                <div className="border border-red-200 bg-red-50/50 p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-red-900 mb-1">{'重置数据库'}</h3>
                    <p className="text-xs text-red-700">
                      {'删除所有数据，包括简历、职位和生成的内容。此操作无法撤销。'}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowResetDatabaseDialog(true)}
                    disabled={isResetting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {'重置数据库'}
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-secondary p-4 border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Resume Matcher"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="font-mono text-xs text-muted-foreground">
                {getVersionString().toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {statusLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="font-mono text-xs text-muted-foreground">{'检查中...'}</span>
                </>
              ) : systemStatus ? (
                <>
                  <div
                    className={`w-3 h-3 ${systemStatus.status === 'ready' ? 'bg-green-700' : 'bg-amber-500'}`}
                  ></div>
                  <span
                    className={`font-mono text-xs font-bold ${systemStatus.status === 'ready' ? 'text-green-700' : 'text-amber-600'}`}
                  >
                    {systemStatus.status === 'ready' ? '状态：就绪' : '状态：需要配置'}
                  </span>
                </>
              ) : (
                <span className="font-mono text-xs text-muted-foreground">{'状态：离线'}</span>
              )}
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={showClearApiKeysDialog}
          onOpenChange={setShowClearApiKeysDialog}
          title={'清除所有 API 密钥？'}
          description={'下次使用 AI 功能前，您需要重新输入它们。'}
          confirmLabel={'删除'}
          variant="warning"
          onConfirm={handleClearApiKeys}
        />

        <ConfirmDialog
          open={showResetDatabaseDialog}
          onOpenChange={setShowResetDatabaseDialog}
          title={'重置所有内容并重新开始？'}
          description={'这将永久删除每一份简历、职位描述和生成的文档。'}
          confirmLabel={'重置'}
          variant="danger"
          onConfirm={handleResetDatabase}
        />

        <ConfirmDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          title={successMessage.title}
          description={successMessage.description}
          confirmLabel={'关闭'}
          showCancelButton={false}
          variant="success"
          onConfirm={() => setShowSuccessDialog(false)}
        />
      </div>
    </AppLayout>
  );
}
