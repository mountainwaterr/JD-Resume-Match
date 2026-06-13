'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Mail, Lock, User, Loader2, AlertTriangle } from 'lucide-react';
import { signUp } from '@/lib/auth-client';
import { validateEmail, validatePassword, validateName } from '@/lib/validation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateField = useCallback((field: string, value: string) => {
    let result;
    switch (field) {
      case 'email':
        result = validateEmail(value);
        break;
      case 'password':
        result = validatePassword(value);
        break;
      case 'name':
        result = validateName(value);
        break;
      default:
        return;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (result.valid) {
        delete next[field];
      } else {
        next[field] = result.message!;
      }
      return next;
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate all fields
    const nameResult = validateName(name);
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);

    const errors: Record<string, string> = {};
    if (!nameResult.valid) errors.name = nameResult.message!;
    if (!emailResult.valid) errors.email = emailResult.message!;
    if (!passwordResult.valid) errors.password = passwordResult.message!;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message || '注册失败，请稍后重试');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError('网络连接失败，请检查网络后重试');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" /> 返回首页
        </Link>

        <Card className="border-border/50">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">注册</CardTitle>
            <p className="text-sm text-muted-foreground">创建账号开始使用</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle className="size-4 shrink-0" /> {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">昵称</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="你的昵称（至少2个字符）"
                    className={`pl-10 ${fieldErrors.name ? 'border-red-400' : ''}`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) validateField('name', e.target.value);
                    }}
                    onBlur={() => validateField('name', name)}
                    required
                  />
                </div>
                {fieldErrors.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className={`pl-10 ${fieldErrors.email ? 'border-red-400' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) validateField('email', e.target.value);
                    }}
                    onBlur={() => validateField('email', email)}
                    required
                  />
                </div>
                {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="至少 8 个字符"
                    className={`pl-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) validateField('password', e.target.value);
                    }}
                    onBlur={() => validateField('password', password)}
                    required
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {loading ? '注册中...' : '注册'}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              已有账号？{' '}
              <Link href="/login" className="text-primary hover:underline">
                登录
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
