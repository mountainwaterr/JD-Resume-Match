'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Target,
  Palette,
  Settings,
  Search,
  FileSearch,
  LogOut,
  User,
} from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';

const NAV_ITEMS = [
  { href: '/dashboard', label: '总览', icon: LayoutDashboard },
  { href: '/resumes', label: '我的简历', icon: FileText },
  { href: '/tailor', label: '职位匹配', icon: Target },
  { href: '/resume-match', label: '匹配分析', icon: FileSearch },
  { href: '/jd-analysis', label: 'JD分析', icon: Search },
  { href: '/templates', label: '模板样式', icon: Palette },
  { href: '/settings', label: '设置', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight"
        >
          <span className="text-primary">Resume</span>
          <span className="text-sidebar-foreground">Matcher</span>
        </Link>
      </div>
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

      {/* User section at bottom */}
      <div className="border-t border-sidebar-border px-4 py-3">
        {session?.user ? (
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <User className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {session.user.name || '用户'}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="shrink-0 rounded-lg p-1.5 text-sidebar-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="登出"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <User className="size-4" />
            登录
          </Link>
        )}
      </div>
    </aside>
  );
}
