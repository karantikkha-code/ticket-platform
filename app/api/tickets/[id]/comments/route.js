import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { idFromRef } from '@/lib/constants';
import { addComment, getTicket } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const id = idFromRef((await params).id);
  const b = await req.json().catch(() => ({}));
  const body = String(b.body ?? '').trim().slice(0, 5000);
  const email = String(b.email ?? '').trim().toLowerCase();
  const ticket = Number.isFinite(id) ? await getTicket(id) : null;
  const admin = await isAdmin();
  if (!ticket || !(admin || (email && email === ticket.email))) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  if (!body) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 });
  const author = admin ? String(b.author ?? '').trim().slice(0, 100) || 'IT Support' : ticket.name;
  const comment = await addComment(id, author, admin ? 'it' : 'user', body);
  return NextResponse.json({ comment }, { status: 201 });
}
