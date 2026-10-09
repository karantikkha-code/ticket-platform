import { NextResponse } from 'next/server';
import { COOKIE, adminConfigured, checkPassword, isAdmin, sessionToken } from '@/lib/auth';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ admin: await isAdmin(), configured: adminConfigured(), hasDb });
}

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  if (!adminConfigured()) return NextResponse.json({ error: 'ADMIN_PASSWORD is not set on the server.' }, { status: 500 });
  if (!checkPassword(password || '')) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, sessionToken(), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
