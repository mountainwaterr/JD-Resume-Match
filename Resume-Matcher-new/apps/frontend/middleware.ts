import { type NextRequest, NextResponse } from 'next/server';

const protectedPaths = [
  '/dashboard',
  '/builder',
  '/tailor',
  '/resume-match',
  '/resumes',
  '/settings',
];

const SESSION_TTL = 30_000;
const sessionCache = new Map<string, { user: unknown; ts: number }>();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!isProtected) return NextResponse.next();

  const cookie = request.headers.get('cookie') || '';

  // Fast path: cached session within TTL
  const cached = sessionCache.get(cookie);
  if (cached && Date.now() - cached.ts < SESSION_TTL) {
    return NextResponse.next();
  }

  // Slow path: validate with auth endpoint (5s timeout so backend down doesn't hang)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(`${request.nextUrl.origin}/auth/api/get-session`, {
      headers: { cookie },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return redirectToLogin(request, pathname);
    }

    const data = await res.json();
    if (!data || !data.user) {
      return redirectToLogin(request, pathname);
    }
    sessionCache.set(cookie, { user: data.user, ts: Date.now() });
  } catch {
    // Network error: allow if recent cache hit exists
    if (cached) return NextResponse.next();
    return redirectToLogin(request, pathname);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!auth|api|_next/static|_next/image|favicon.ico|login|register|$).*)'],
};
