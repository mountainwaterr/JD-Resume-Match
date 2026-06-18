import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextResponse } from 'next/server';

const handler = toNextJsHandler(auth);

function wrap(inner: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await inner(req);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const stack = e instanceof Error ? e.stack : '';
      console.error('[Auth Error]', msg, stack);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}

export const GET = wrap(handler.GET);
export const POST = wrap(handler.POST);
