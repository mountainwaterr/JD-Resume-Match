import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRange(
  startStr: string | null | undefined,
  endStr?: string | null,
  locale?: string
): string {
  const fmt = (s: string) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    const l = locale === 'zh' ? 'zh-CN' : 'en-US';
    return d.toLocaleDateString(l, { year: 'numeric', month: 'short' });
  };
  // Single argument: just format the date (used by resume templates)
  if (startStr && !endStr) return fmt(startStr);
  const start = startStr ? fmt(startStr) : '';
  const end = endStr ? fmt(endStr) : 'Present';
  return start ? `${start} — ${end}` : end;
}
