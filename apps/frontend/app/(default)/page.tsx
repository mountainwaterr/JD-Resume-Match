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
            {t('测测你的简历匹配度，结果可能会扎心', 'How Well Does Your Resume Actually Match?')}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            {t(
              '上传简历 + 粘贴JD，AI给你一份毫不留情的匹配报告。不是帮你改简历，是让你看清自己几斤几两。',
              'Upload your resume + paste a JD. AI gives you an honest match report — no sugarcoating.'
            )}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 px-8 text-base" asChild>
              <Link href="/resume-match">
                {t('免费测一测', 'Test for Free')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-8 text-base"
              asChild
            >
              <Link href="/resume-match">
                {t('免登录体验，数据不留存', 'No login needed, data not stored')}
              </Link>
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
                titleZh: '匹配度体检',
                titleEn: 'Match Checkup',
                descZh: '6个维度打分，看看你是"天选之子"还是"重在参与"',
                descEn: 'Scored across 6 dimensions — find out if you\'re a perfect fit or just showing up',
              },
              {
                icon: FileText,
                titleZh: 'JD翻译官',
                titleEn: 'JD Translator',
                descZh: '把JD里那些不说人话的要求，翻译成你听得懂的技能清单',
                descEn: 'Translate corporate jargon into plain skills you actually understand',
              },
              {
                icon: Download,
                titleZh: '差距报告',
                titleEn: 'Gap Report',
                descZh: '诚实地告诉你缺什么、怎么补，而不是帮你假装什么都会',
                descEn: 'Honestly shows what you lack and how to improve — no pretending',
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

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            <span className="text-primary">Resume</span> Matcher
          </Link>
          <p className="text-sm text-muted-foreground">
            {t('诚实地了解自己，比美化简历更重要', 'Knowing yourself honestly matters more than a polished resume')}
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
