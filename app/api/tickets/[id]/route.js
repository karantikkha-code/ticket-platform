import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { PRIORITIES, STATUSES, idFromRef, refOf } from '@/lib/constants';
import { deleteTicket, getTicket, listComments, updateTicket } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const id = idFromRef((await params).id);
  const email = (new URL(req.url).searchParams.get('email') || '').trim().toLowerCase();
  const ticket = Number.isFinite(id) ? await getTicket(id) : null;
  const allowed = ticket && ((await isAdmin()) || (email && email === ticket.email));
  // Same message for "not found" and "wrong email" so ticket numbers can't be probed.
  if (!allowed) return NextResponse.json({ error: 'No ticket found for this ticket number and email.' }, { status: 404 });
  return NextResponse.json({ ticket: { ...ticket, ref: refOf(ticket.id) }, comments: await listComments(id) });
}

export async function PATCH(req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = idFromRef((await params).id);
  const b = await req.json().catch(() => ({}));
  const patch = {};
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    patch.status = b.status;
  }
  if (b.priority !== undefined) {
    if (!PRIORITIES.includes(b.priority)) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    patch.priority = b.priority;
  }
  if (b.assignee !== undefined) patch.assignee = String(b.assignee).trim().slice(0, 100);
  const row = await updateTicket(id, patch);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ticket: { ...row, ref: refOf(row.id) } });
}

export async function DELETE(_req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteTicket(idFromRef((await params).id));
  return NextResponse.json({ ok: true });
}
