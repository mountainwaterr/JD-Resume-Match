'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Mail, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { validateEmail } from '@/lib/validation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleEmailBlur = useCallback(() => {
    if (!email.trim()) return;
    const result = validateEmail(email);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (result.valid) {
        delete next.email;
      } else {
        next.email = result.message!;
      }
      return next;
    });
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate email
    if (email.trim()) {
      const emailResult = validateEmail(email);
      if (!emailResult.valid) {
        setFieldErrors({ email: emailResult.message! });
        return;
      }
    }

    if (!password) {
      setFieldErrors({ password: '请输入密码' });
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await signIn.email({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || '登录失败，请检查邮箱和密码');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
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
            <CardTitle className="text-2xl font-semibold tracking-tight">登录</CardTitle>
            <p className="text-sm text-muted-foreground">使用邮箱和密码登录</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle className="size-4 shrink-0" /> {error}
                </div>
              )}
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
                      if (fieldErrors.email) handleEmailBlur();
                    }}
                    onBlur={handleEmailBlur}
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
                    placeholder="输入密码"
                    className={`pl-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({});
                    }}
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
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              还没有账号？{' '}
              <Link href="/register" className="text-primary hover:underline">
                注册
              </Link>
            </p>
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href="/resume-match">
                  免登录体验，数据不留存
                </Link>
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                无需注册即可使用简历匹配分析功能
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
