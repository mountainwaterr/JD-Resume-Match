'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Modern Minimalist Tabs Component
 *
 * Design Principles:
 * - Rounded top corners on active tab
 * - Soft warm borders
 * - Sans-serif text
 */

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface RetroTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const RetroTabs: React.FC<RetroTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn('flex gap-0 border-b border-border-soft', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className={cn(
              'px-4 py-2 font-sans text-sm font-medium transition-all duration-150',
              'border border-b-0 border-border-soft -mb-px rounded-t-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isActive && ['bg-white text-foreground', 'border-b-white'],
              !isActive &&
                !isDisabled && [
                  'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground',
                ],
              isDisabled && ['bg-paper-tint text-steel-grey cursor-not-allowed opacity-50']
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
