import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';

const baseUrl = process.env.BETTER_AUTH_URL || '';

export const auth = betterAuth({
  basePath: '/auth/api',
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
  },
  // Trust localhost, LAN IPs, and tunnel domains (localtunnel, ngrok, cloudflared, etc.)
  trustedOrigins: (origin: unknown) => {
    const originStr = typeof origin === 'string' ? origin : '';
    if (!originStr) return [baseUrl || 'http://localhost:3000'];
    // Local dev
    if (originStr.startsWith('http://localhost') || originStr.startsWith('http://127.0.0.1')) return [originStr];
    if (originStr.startsWith('http://10.') || originStr.startsWith('http://192.168.')) return [originStr];
    // Explicit BETTER_AUTH_URL
    if (baseUrl && originStr === baseUrl) return [originStr];
    // Tunnel services
    if (
      originStr.endsWith('.loca.lt') ||
      originStr.endsWith('.trycloudflare.com') ||
      originStr.includes('ngrok') ||
      originStr.includes('bore.pub')
    ) return [originStr];
    return [];
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    session: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});
