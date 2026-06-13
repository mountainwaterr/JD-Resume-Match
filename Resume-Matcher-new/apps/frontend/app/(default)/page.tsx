'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/context/language-context';
import { ArrowRight, Sparkles, FileText, Download, Sun, Moon, Languages } from 'lucide-react';

export default function Home() {
  const { uiLanguage, setUiLanguage } = useLanguage();

  const toggleLang = useCallback(() => {
    setUiLanguage(uiLanguage === 'zh' ? 'en' : 'zh');
  }, [uiLanguage, setUiLanguage]);

  const t = (zh: string, en: string) => (uiLanguage === 'zh' ? zh : en);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-sm">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <span className="text-primary">Resume</span> Matcher
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="gap-1.5 text-muted-foreground"
          >
            <Languages className="size-4" />
            {uiLanguage === 'zh' ? 'EN' : '中'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            title={uiLanguage === 'zh' ? '主题切换 (即将推出)' : 'Theme (coming soon)'}
            disabled
          >
            <Sun className="size-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-5xl leading-tight tracking-tight md:text-6xl lg:text-7xl">
            {t('用 AI 打造完美简历', 'AI-Powered Resume That Gets You Hired')}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            {t(
              '几分钟内为每个职位量身定制简历，智能匹配、一键生成',
              'Tailor your resume to every job in minutes. Smart matching, one-click generation.'
            )}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 px-8 text-base" asChild>
              <Link href="/login">
                {t('开始使用', 'Get Started')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-8 text-base"
              onClick={scrollToFeatures}
            >
              {t('了解更多', 'Learn More')}
            </Button>
          </div>
        </div>

        {/* Flow Decoration */}
        <div className="mt-20 w-full max-w-4xl">
          <svg
            viewBox="0 0 1200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 60 C300 0, 400 120, 600 60 C800 0, 900 120, 1200 60"
              stroke="url(#flow-gradient)"
              strokeWidth="2"
              fill="none"
            />
            <defs>
              <linearGradient id="flow-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1E3A5F" />
                <stop offset="50%" stopColor="#4A90D9" />
                <stop offset="100%" stopColor="#E8C547" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-serif text-3xl tracking-tight md:text-4xl">
            {t('核心功能', 'Core Features')}
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            {t(
              '从简历管理到职位匹配，一站式解决',
              'From resume management to job matching, all in one place'
            )}
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                titleZh: 'AI 智能匹配',
                titleEn: 'AI Smart Matching',
                descZh: '分析职位描述，自动匹配关键技能和经验，优化简历关键词',
                descEn: 'Analyze job descriptions, auto-match key skills and experience',
              },
              {
                icon: FileText,
                titleZh: '多模板样式',
                titleEn: 'Multiple Templates',
                descZh: '多种专业简历模板，一键切换样式和格式',
                descEn: 'Professional templates with one-click style switching',
              },
              {
                icon: Download,
                titleZh: '一键导出 PDF',
                titleEn: 'One-Click PDF Export',
                descZh: '生成专业排版的 PDF 简历，随时下载使用',
                descEn: 'Generate professionally formatted PDF resumes instantly',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border/50 bg-card p-8 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{t(feature.titleZh, feature.titleEn)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(feature.descZh, feature.descEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-serif text-3xl text-white md:text-4xl">
            {t('用数据说话', 'Trusted by Job Seekers')}
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              { value: '10k+', labelZh: '已创建简历', labelEn: 'Resumes Created' },
              { value: '95%', labelZh: '匹配成功率', labelEn: 'Match Success Rate' },
              { value: '3min', labelZh: '平均生成时间', labelEn: 'Average Generation Time' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="font-mono text-5xl font-bold text-white">{stat.value}</div>
                <div className="mt-2 text-sm text-white/70">{t(stat.labelZh, stat.labelEn)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            <span className="text-primary">Resume</span> Matcher
          </Link>
          <p className="text-sm text-muted-foreground">
            {t('用 AI 打造你的完美简历', 'Build your perfect resume with AI')}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="https://github.com/srbhr/Resume-Matcher"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
