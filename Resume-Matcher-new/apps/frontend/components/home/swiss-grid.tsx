'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
export const SwissGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    // 1. Outer Wrapper: Fixed height with grid background
    <div
      className="h-screen w-full flex justify-center items-start py-12 px-4 md:px-8 overflow-hidden bg-background"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* 2. The Main Container: Sharp black borders, creating the "Canvas" */}
      <div className="w-full max-w-[86rem] max-h-full border border-border-soft bg-white shadow-xl rounded-lg flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="border-b border-border-soft p-8 md:p-12 shrink-0 bg-white relative z-30">
          <h1 className="font-serif text-5xl md:text-7xl text-foreground tracking-tight leading-[0.95]">
            {'仪表板'}
          </h1>
          <p className="mt-6 text-sm font-sans text-muted-foreground max-w-md">{'选择模块'}</p>
        </div>

        {/* Content Grid - Scrollable area with NO padding.
            @container makes the card grid respond to the container's actual
            width, not the viewport. The Swiss frame is max-w-86rem so on
            ultra-wide screens the cards no longer over-stretch. */}
        <div className="@container flex-1 overflow-y-auto overflow-x-hidden relative z-10">
          <div className="p-[1.5px]">
            <div className="grid grid-cols-1 @2xl:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-5 bg-border-soft gap-[1px] border-b border-border-soft">
              {children}
            </div>
          </div>
        </div>

        {/* Footer - stays above hovered cards */}
        <div className="p-4 bg-white flex justify-between items-center font-sans text-sm text-muted-foreground border-t border-border-soft shrink-0 relative z-30">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Resume Matcher"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span className="font-medium text-foreground">Resume Matcher</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="bg-primary text-primary-foreground px-6 py-2 font-medium rounded-lg shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 min-w-[140px] text-center"
            >
              {'设置'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
