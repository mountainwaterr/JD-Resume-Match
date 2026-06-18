'use client';

import React from 'react';
import Link from 'next/link';
export default function Hero() {
  // Hover translates DOWN-RIGHT (+1, +1) for the press-in effect — matches
  // every other button in the codebase. The previous version translated
  // UP-LEFT (-1, -1) which was the inverse and looked broken next to the
  // rest of the design system.
  const buttonClass =
    'group relative border border-border-soft bg-white px-8 py-3 font-sans text-sm font-medium text-foreground rounded-lg shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-[1px] hover:bg-primary hover:text-primary-foreground hover:border-primary active:translate-y-0 cursor-pointer';

  return (
    <section
      className="h-screen w-full p-4 md:p-12 lg:p-24 bg-background"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center border border-border-soft bg-white shadow-xl rounded-lg">
        <h1 className="mb-12 text-center font-serif text-6xl font-bold leading-none tracking-tight md:text-8xl lg:text-9xl text-foreground selection:bg-primary selection:text-white">
          {'简历'}
          <br />
          {'匹配器'}
        </h1>

        <div className="flex flex-col gap-4 md:flex-row md:gap-12">
          <a
            href="https://github.com/srbhr/Resume-Matcher"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
          >
            GitHub
          </a>
          <a
            href="https://resumematcher.fyi"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
          >
            {'使用文档'}
          </a>
          <Link href="/dashboard" className={buttonClass}>
            {'启动应用'}
          </Link>
        </div>
      </div>
    </section>
  );
}
