'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface NextStepLink {
  label: string;
  href: string;
  variant?: 'default' | 'outline';
}

interface NextStepsProps {
  message?: string;
  links: NextStepLink[];
}

export function NextSteps({ message = '下一步：', links }: NextStepsProps) {
  return (
    <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
      <span className="text-sm font-medium text-primary">{message}</span>
      {links.map((link, i) => (
        <Link key={i} href={link.href}>
          <Button size="sm" variant={link.variant || 'default'} className="gap-1.5">
            {link.variant === 'outline' ? (
              link.label
            ) : (
              <>
                {link.label}
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </Link>
      ))}
    </div>
  );
}
