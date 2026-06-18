type EmailRule = { pattern: RegExp; description: string };

const EMAIL_RULES: Record<string, EmailRule> = {
  '163.com': {
    pattern: /^(\d{11}|[a-z][a-z0-9_]{5,17})@163\.com$/i,
    description: '11位手机号 或 6-18位字母开头用户名 + @163.com',
  },
  '126.com': {
    pattern: /^[a-z][a-z0-9_]{5,17}@126\.com$/i,
    description: '6-18位字母开头用户名 + @126.com',
  },
  'qq.com': {
    pattern: /^[1-9]\d{4,10}@qq\.com$/i,
    description: '5-11位QQ号 + @qq.com',
  },
  'gmail.com': {
    pattern: /^[a-z0-9._%+-]{6,30}@gmail\.com$/i,
    description: '6-30位标准 Gmail 格式',
  },
  'outlook.com': {
    pattern: /^[a-z0-9._%+-]{1,64}@outlook\.com$/i,
    description: '标准 Outlook 格式',
  },
  'hotmail.com': {
    pattern: /^[a-z0-9._%+-]{1,64}@hotmail\.com$/i,
    description: '标准 Hotmail 格式',
  },
  'foxmail.com': {
    pattern: /^[a-z0-9_]{4,18}@foxmail\.com$/i,
    description: '4-18位字母/数字/下划线 + @foxmail.com',
  },
  'sina.com': {
    pattern: /^[a-z0-9_]{4,16}@sina\.com$/i,
    description: '4-16位字母/数字/下划线 + @sina.com',
  },
  'sohu.com': {
    pattern: /^[a-z0-9_]{4,16}@sohu\.com$/i,
    description: '4-16位字母/数字/下划线 + @sohu.com',
  },
  'yeah.net': {
    pattern: /^[a-z][a-z0-9_]{5,17}@yeah\.net$/i,
    description: '6-18位字母开头用户名 + @yeah.net',
  },
  'icloud.com': {
    pattern: /^[a-z0-9._%+-]+@icloud\.com$/i,
    description: '标准 iCloud 格式',
  },
};

const DEFAULT_RULE: EmailRule = {
  pattern: /^[^\s@]{3,64}@[^\s@]{2,}\.[^\s@]{2,}$/,
  description: '标准邮箱格式（用户名@域名.后缀）',
};

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, message: '请输入邮箱地址' };
  }

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) {
    return { valid: false, message: '邮箱格式错误：缺少 @ 符号' };
  }

  const domain = trimmed.slice(atIndex + 1).toLowerCase();
  if (!domain.includes('.')) {
    return { valid: false, message: '邮箱格式错误：域名缺少后缀（如 .com）' };
  }

  const rule = EMAIL_RULES[domain] || null;
  if (rule) {
    if (!rule.pattern.test(trimmed)) {
      return { valid: false, message: `${domain} 邮箱格式：${rule.description}` };
    }
    return { valid: true };
  }

  // Unknown domain — use generic validation
  if (!DEFAULT_RULE.pattern.test(trimmed)) {
    return { valid: false, message: DEFAULT_RULE.description };
  }

  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return { valid: false, message: '密码至少 8 个字符' };
  }
  if (password.length > 128) {
    return { valid: false, message: '密码不能超过 128 个字符' };
  }
  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, message: '请输入昵称' };
  }
  if (trimmed.length < 2) {
    return { valid: false, message: '昵称至少 2 个字符' };
  }
  if (trimmed.length > 30) {
    return { valid: false, message: '昵称不能超过 30 个字符' };
  }
  return { valid: true };
}
