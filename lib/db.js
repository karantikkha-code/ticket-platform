import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
export const hasDb = Boolean(url);
const sql = hasDb ? neon(url) : null;

// Without a database the app runs in demo mode: data lives in memory and is lost on restart.
const mem = (globalThis.__ithd ??= { tickets: [], comments: [], seq: 0, cseq: 0 });

let ready = null;
function init() {
  if (!hasDb) return Promise.resolve();
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        department TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        assignee TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS ticket_comments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        role TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export async function createTicket(t) {
  await init();
  if (!hasDb) {
    const now = new Date().toISOString();
    const row = { id: ++mem.seq, ...t, status: 'Open', assignee: '', created_at: now, updated_at: now };
    mem.tickets.push(row);
    return row;
  }
  const rows = await sql`INSERT INTO tickets (name, email, department, location, category, priority, subject, description)
    VALUES (${t.name}, ${t.email}, ${t.department}, ${t.location}, ${t.category}, ${t.priority}, ${t.subject}, ${t.description})
    RETURNING *`;
  return rows[0];
}

export async function listTickets() {
  await init();
  if (!hasDb) return [...mem.tickets].reverse();
  return sql`SELECT * FROM tickets ORDER BY id DESC LIMIT 5000`;
}

export async function getTicket(id) {
  await init();
  if (!hasDb) return mem.tickets.find((t) => t.id === id) || null;
  const rows = await sql`SELECT * FROM tickets WHERE id = ${id}`;
  return rows[0] || null;
}

export async function updateTicket(id, { status = null, assignee = null, priority = null }) {
  await init();
  if (!hasDb) {
    const t = mem.tickets.find((x) => x.id === id);
    if (!t) return null;
    if (status !== null) t.status = status;
    if (assignee !== null) t.assignee = assignee;
    if (priority !== null) t.priority = priority;
    t.updated_at = new Date().toISOString();
    return t;
  }
  const rows = await sql`UPDATE tickets SET
      status = COALESCE(${status}, status),
      assignee = COALESCE(${assignee}, assignee),
      priority = COALESCE(${priority}, priority),
      updated_at = now()
    WHERE id = ${id} RETURNING *`;
  return rows[0] || null;
}

export async function deleteTicket(id) {
  await init();
  if (!hasDb) {
    mem.tickets = mem.tickets.filter((t) => t.id !== id);
    mem.comments = mem.comments.filter((c) => c.ticket_id !== id);
    return;
  }
  await sql`DELETE FROM tickets WHERE id = ${id}`;
}

export async function listComments(ticketId) {
  await init();
  if (!hasDb) return mem.comments.filter((c) => c.ticket_id === ticketId);
  return sql`SELECT * FROM ticket_comments WHERE ticket_id = ${ticketId} ORDER BY id ASC`;
}

export async function addComment(ticketId, author, role, body) {
  await init();
  if (!hasDb) {
    const row = { id: ++mem.cseq, ticket_id: ticketId, author, role, body, created_at: new Date().toISOString() };
    mem.comments.push(row);
    const t = mem.tickets.find((x) => x.id === ticketId);
    if (t) t.updated_at = row.created_at;
    return row;
  }
  const rows = await sql`INSERT INTO ticket_comments (ticket_id, author, role, body)
    VALUES (${ticketId}, ${author}, ${role}, ${body}) RETURNING *`;
  await sql`UPDATE tickets SET updated_at = now() WHERE id = ${ticketId}`;
  return rows[0];
}
