'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, NAV_ITEMS } from './sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Mobile top bar + slide-out nav */}
      <header className="fixed top-0 inset-x-0 z-30 flex h-12 items-center border-b bg-background px-3 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="rounded-lg p-1.5 -ml-1 hover:bg-muted" aria-label="菜单">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0" showCloseButton={false}>
            {/* Brand */}
            <div className="flex h-14 items-center border-b px-5">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-semibold text-lg tracking-tight"
                onClick={() => setOpen(false)}
              >
                <span className="text-primary">Resume</span>
                <span>Matcher</span>
              </Link>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-auto px-3 py-4">
              <ul className="flex flex-col gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                            : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                        )}
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          href="/dashboard"
          className="ml-3 font-semibold text-sm tracking-tight"
        >
          <span className="text-primary">Resume</span>Matcher
        </Link>
      </header>

      <main className="min-h-screen flex-1 pl-0 md:pl-56 pt-12 md:pt-0">
        {children}
      </main>
    </div>
  );
}
