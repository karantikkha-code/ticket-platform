'use client';

export const fmt = (d) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const Pill = ({ kind, value }) => <span className={`pill ${kind}-${String(value).replace(/\s+/g, '-')}`}>{value}</span>;

export async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export function Thread({ comments }) {
  if (!comments.length) return <p className="small">No updates yet.</p>;
  return comments.map((c) => (
    <div key={c.id} className={`msg ${c.role}`}>
      <div className="small"><b>{c.author}</b>{c.role === 'it' ? ' (IT team)' : ''} · {fmt(c.created_at)}</div>
      <p>{c.body}</p>
    </div>
  ));
}
