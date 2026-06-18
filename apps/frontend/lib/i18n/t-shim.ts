// Shim t() function — reads from zh.json. Replacement for useTranslations().
import zh from '@/messages/zh.json';

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let val: unknown = zh;
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = (val as Record<string, unknown>)[k];
    } else {
      return applyParamsLocally(key, params);
    }
  }
  const result = typeof val === 'string' ? val : key;
  return applyParamsLocally(result, params);
}

function applyParamsLocally(value: string, params?: Record<string, string | number>): string {
  if (!params) return value;
  return value.replace(/\{([^{}]+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return `{${key}}`;
  });
}
