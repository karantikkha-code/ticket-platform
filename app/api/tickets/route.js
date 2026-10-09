import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { CATEGORIES, PRIORITIES, refOf } from '@/lib/constants';
import { createTicket, listTickets } from '@/lib/db';

export const dynamic = 'force-dynamic';
const clean = (v, max) => String(v ?? '').trim().slice(0, max);

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await listTickets();
  return NextResponse.json({ tickets: rows.map((t) => ({ ...t, ref: refOf(t.id) })) });
}

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const t = {
    name: clean(b.name, 100),
    email: clean(b.email, 150).toLowerCase(),
    department: clean(b.department, 100),
    location: clean(b.location, 150),
    category: clean(b.category, 60),
    priority: clean(b.priority, 20),
    subject: clean(b.subject, 150),
    description: clean(b.description, 5000),
  };
  if (!t.name || !t.subject || !t.description) return NextResponse.json({ error: 'Name, subject and description are required.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!CATEGORIES.includes(t.category)) return NextResponse.json({ error: 'Choose a category.' }, { status: 400 });
  if (!PRIORITIES.includes(t.priority)) return NextResponse.json({ error: 'Choose a priority.' }, { status: 400 });
  const row = await createTicket(t);
  return NextResponse.json({ id: row.id, ref: refOf(row.id) }, { status: 201 });
}
