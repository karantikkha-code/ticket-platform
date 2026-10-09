'use client';
import { useEffect, useState } from 'react';
import { Pill, Thread, api, fmt } from '../ui';

export default function Track() {
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState('');

  async function load(i, e) {
    setBusy(true); setErr('');
    try { setData(await api(`/api/tickets/${encodeURIComponent(i.trim())}?email=${encodeURIComponent(e.trim())}`)); }
    catch (x) { setData(null); setErr(x.message); }
    setBusy(false);
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const i = q.get('id') || '', e = q.get('email') || '';
    setId(i); setEmail(e);
    if (i && e) load(i, e);
  }, []);

  async function send(ev) {
    ev.preventDefault();
    setErr('');
    try {
      await api(`/api/tickets/${data.ticket.id}/comments`, 'POST', { body: reply, email });
      setReply('');
      await load(id, email);
    } catch (x) { setErr(x.message); }
  }

  const t = data?.ticket;
  return (
    <div className="narrow">
      <h1>Track your ticket</h1>
      <p className="sub">Enter the ticket number and the email you used to raise it.</p>
      <form className="card" onSubmit={(e) => { e.preventDefault(); load(id, email); }}>
        <div className="grid">
          <div><label htmlFor="tid">Ticket number</label><input id="tid" required placeholder="IT-0001" value={id} onChange={(e) => setId(e.target.value)} /></div>
          <div><label htmlFor="tem">Email</label><input id="tem" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        <div className="row" style={{ marginTop: 14 }}><button disabled={busy}>{busy ? 'Checking…' : 'Check status'}</button></div>
        {err && <p className="err">{err}</p>}
      </form>

      {t && (
        <>
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{t.ref} · {t.subject}</h2>
              <Pill kind="s" value={t.status} />
            </div>
            <dl className="kv" style={{ marginTop: 12 }}>
              <dt>Category</dt><dd>{t.category}</dd>
              <dt>Priority</dt><dd><Pill kind="p" value={t.priority} /></dd>
              <dt>Assigned to</dt><dd>{t.assignee || 'Not assigned yet'}</dd>
              <dt>Raised</dt><dd>{fmt(t.created_at)}</dd>
              <dt>Last update</dt><dd>{fmt(t.updated_at)}</dd>
            </dl>
            <p className="desc" style={{ marginTop: 12 }}>{t.description}</p>
          </div>
          <div className="card">
            <h2>Updates</h2>
            <Thread comments={data.comments} />
            <form onSubmit={send}>
              <label htmlFor="rep">Reply to IT team</label>
              <textarea id="rep" required style={{ minHeight: 80 }} value={reply} onChange={(e) => setReply(e.target.value)} />
              <div className="row" style={{ marginTop: 10 }}><button>Send reply</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
