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
  trustedOrigins: (origin: string) => {
    // Allow requests without Origin header (same-origin, direct API calls)
    if (!origin) return true;
    // Local dev
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return true;
    if (origin.startsWith('http://10.') || origin.startsWith('http://192.168.')) return true;
    // Explicit BETTER_AUTH_URL
    if (baseUrl && origin === baseUrl) return true;
    // Tunnel services
    if (
      origin.endsWith('.loca.lt') ||
      origin.endsWith('.trycloudflare.com') ||
      origin.includes('ngrok') ||
      origin.includes('bore.pub')
    ) return true;
    return false;
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    session: {
      sameSite: 'lax',
      secure: false,
    },
  },
});
