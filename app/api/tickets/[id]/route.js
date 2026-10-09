import { NextResponse } from 'next/server';
import { safe } from '@/lib/safe';
import { isAdmin } from '@/lib/auth';
import { PRIORITIES, STATUSES, idFromRef, refOf } from '@/lib/constants';
import { deleteTicket, getTicket, listComments, updateTicket } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function GET_(req, { params }) {
  const id = idFromRef((await params).id);
  const email = (new URL(req.url).searchParams.get('email') || '').trim().toLowerCase();
  const [ticket, comments] = Number.isFinite(id) ? await Promise.all([getTicket(id), listComments(id)]) : [null, []];
  const allowed = ticket && ((await isAdmin()) || (email && email === ticket.email));
  // Same message for "not found" and "wrong email" so ticket numbers can't be probed.
  if (!allowed) return NextResponse.json({ error: 'No ticket found for this ticket number and email.' }, { status: 404 });
  return NextResponse.json({ ticket: { ...ticket, ref: refOf(ticket.id) }, comments });
}

async function PATCH_(req, { params }) {
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

async function DELETE_(_req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteTicket(idFromRef((await params).id));
  return NextResponse.json({ ok: true });
}

export const GET = safe(GET_);
export const PATCH = safe(PATCH_);
export const DELETE = safe(DELETE_);
