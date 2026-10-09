'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CATEGORIES, PRIORITIES, STATUSES } from '@/lib/constants';
import { Pill, Thread, api, fmt } from '../ui';

export default function Admin() {
  const [me, setMe] = useState(null);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [tickets, setTickets] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Active');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [openId, setOpenId] = useState(null);

  const refresh = useCallback(async () => {
    try { setTickets((await api('/api/tickets')).tickets); } catch (x) { setErr(x.message); }
  }, []);

  useEffect(() => {
    api('/api/admin').then((m) => { setMe(m); if (m.admin) refresh(); });
  }, [refresh]);

  async function login(e) {
    e.preventDefault(); setErr('');
    try { await api('/api/admin', 'POST', { password: pw }); setPw(''); setMe({ ...me, admin: true }); refresh(); }
    catch (x) { setErr(x.message); }
  }
  async function logout() { await api('/api/admin', 'DELETE'); setMe({ ...me, admin: false }); setTickets([]); }

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    tickets.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, [tickets]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (status === 'Active' ? ['Resolved', 'Closed'].includes(t.status) : status && t.status !== status) return false;
      if (category && t.category !== category) return false;
      if (priority && t.priority !== priority) return false;
      if (needle && ![t.ref, t.subject, t.name, t.email, t.department, t.assignee, t.description].join(' ').toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [tickets, q, status, category, priority]);

  function exportCsv() {
    const cols = ['ref', 'created_at', 'status', 'priority', 'category', 'subject', 'name', 'email', 'department', 'location', 'assignee', 'updated_at', 'description'];
    const esc = (v) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const csv = [cols.join(','), ...shown.map((t) => cols.map((c) => esc(t[c])).join(','))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = `it-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (!me) return <p className="small">Loading…</p>;

  if (!me.admin) {
    return (
      <div className="narrow">
        <h1>IT team sign in</h1>
        <p className="sub">This area is for the IT support team.</p>
        {!me.configured && <div className="note">Admin password is not set. Add an <b>ADMIN_PASSWORD</b> environment variable in Vercel and redeploy.</div>}
        <form className="card" onSubmit={login}>
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          {err && <p className="err">{err}</p>}
          <div className="row" style={{ marginTop: 14 }}><button>Sign in</button></div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Ticket dashboard</h1>
        <div className="row">
          <button className="ghost sm" onClick={refresh}>Refresh</button>
          <button className="ghost sm" onClick={exportCsv}>Export CSV</button>
          <button className="ghost sm" onClick={logout}>Sign out</button>
        </div>
      </div>
      {!me.hasDb && <div className="note"><b>Demo mode:</b> no database is connected, so tickets are kept in memory and will be lost. Connect a Postgres database (DATABASE_URL) before real use.</div>}
      {err && <p className="err">{err}</p>}

      <div className="stats">
        <button className={`stat ${status === '' ? 'on' : ''}`} onClick={() => setStatus('')}><b>{tickets.length}</b><span>All tickets</span></button>
        {STATUSES.map((s) => (
          <button key={s} className={`stat ${status === s ? 'on' : ''}`} onClick={() => setStatus(s)}><b>{counts[s]}</b><span>{s}</span></button>
        ))}
      </div>

      <div className="card">
        <div className="filters">
          <input aria-label="Search" placeholder="Search ticket no., subject, person…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Active">Active (not resolved)</option>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Ticket</th><th>Subject</th><th>Raised by</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Raised</th></tr></thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id} onClick={() => setOpenId(t.id)}>
                  <td><b>{t.ref}</b></td>
                  <td>{t.subject}<div className="small">{t.category}</div></td>
                  <td>{t.name}<div className="small">{t.department}</div></td>
                  <td><Pill kind="p" value={t.priority} /></td>
                  <td><Pill kind="s" value={t.status} /></td>
                  <td>{t.assignee || <span className="small">—</span>}</td>
                  <td className="small" style={{ whiteSpace: 'nowrap' }}>{fmt(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!shown.length && <p className="small" style={{ margin: '14px 0 0' }}>No tickets match these filters.</p>}
      </div>

      {openId && <Detail id={openId} onClose={() => setOpenId(null)} onChange={refresh} />}
    </>
  );
}

function Detail({ id, onClose, onChange }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ status: '', priority: '', assignee: '' });
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/tickets/${id}`);
      setData(d);
      setForm({ status: d.ticket.status, priority: d.ticket.priority, assignee: d.ticket.assignee });
    } catch (x) { setErr(x.message); }
  }, [id]);

  useEffect(() => {
    load();
    try { setAuthor(localStorage.getItem('ithd_name') || ''); } catch {}
  }, [load]);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  async function save() {
    setErr(''); setSaved(false);
    try { await api(`/api/tickets/${id}`, 'PATCH', form); setSaved(true); await load(); onChange(); }
    catch (x) { setErr(x.message); }
  }
  async function send(e) {
    e.preventDefault(); setErr('');
    try {
      try { localStorage.setItem('ithd_name', author); } catch {}
      await api(`/api/tickets/${id}/comments`, 'POST', { body: note, author });
      setNote(''); await load(); onChange();
    } catch (x) { setErr(x.message); }
  }
  async function remove() {
    if (!window.confirm('Delete this ticket permanently?')) return;
    try { await api(`/api/tickets/${id}`, 'DELETE'); onChange(); onClose(); } catch (x) { setErr(x.message); }
  }

  const t = data?.ticket;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{t ? `${t.ref} · ${t.subject}` : 'Loading…'}</h2>
          <button className="ghost sm" onClick={onClose}>Close</button>
        </div>
        {err && <p className="err">{err}</p>}
        {t && (
          <>
            <div className="card">
              <dl className="kv">
                <dt>Raised by</dt><dd>{t.name} · <a href={`mailto:${t.email}`}>{t.email}</a></dd>
                <dt>Department</dt><dd>{t.department || '—'}</dd>
                <dt>Location</dt><dd>{t.location || '—'}</dd>
                <dt>Category</dt><dd>{t.category}</dd>
                <dt>Raised</dt><dd>{fmt(t.created_at)}</dd>
                <dt>Last update</dt><dd>{fmt(t.updated_at)}</dd>
              </dl>
              <p className="desc" style={{ marginTop: 12 }}>{t.description}</p>
            </div>
            <div className="card">
              <div className="grid">
                <div><label htmlFor="d-st">Status</label>
                  <select id="d-st" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label htmlFor="d-pr">Priority</label>
                  <select id="d-pr" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></div>
                <div className="full"><label htmlFor="d-as">Assigned to</label>
                  <input id="d-as" maxLength={100} placeholder="IT engineer name" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></div>
              </div>
              <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
                <div className="row"><button onClick={save}>Save changes</button>{saved && <span className="small">Saved</span>}</div>
                <button className="danger sm" onClick={remove}>Delete ticket</button>
              </div>
            </div>
            <div className="card">
              <h2>Updates</h2>
              <Thread comments={data.comments} />
              <form onSubmit={send}>
                <label htmlFor="d-au">Your name</label>
                <input id="d-au" maxLength={100} placeholder="IT Support" value={author} onChange={(e) => setAuthor(e.target.value)} style={{ marginBottom: 10 }} />
                <label htmlFor="d-no">Update for the employee</label>
                <textarea id="d-no" required style={{ minHeight: 80 }} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="row" style={{ marginTop: 10 }}><button>Post update</button></div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
