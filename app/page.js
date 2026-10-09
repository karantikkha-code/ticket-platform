'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CATEGORIES, PRIORITIES } from '@/lib/constants';
import { api } from './ui';

const blank = { name: '', email: '', department: '', location: '', category: '', priority: 'Medium', subject: '', description: '' };

export default function Home() {
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api('/api/tickets', 'POST', f);
      setDone({ ref: r.ref, email: f.email });
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="ok narrow">
        <h1>Ticket raised</h1>
        <div>Your ticket number is</div>
        <div className="ref">{done.ref}</div>
        <p>Note this number. Use it with your email address to check the status or reply to the IT team.</p>
        <div className="row">
          <Link className="btn" href={`/track?id=${done.ref}&email=${encodeURIComponent(done.email)}`}>Track this ticket</Link>
          <button className="ghost" onClick={() => { setDone(null); setF({ ...blank, name: f.name, email: f.email, department: f.department, location: f.location }); }}>Raise another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="narrow">
      <h1>Raise an IT ticket</h1>
      <p className="sub">Laptop, software, network, email or access problem? Tell the IT team here.</p>
      <form className="card" onSubmit={submit}>
        <div className="grid">
          <div><label htmlFor="name">Your name *</label><input id="name" required maxLength={100} value={f.name} onChange={set('name')} /></div>
          <div><label htmlFor="email">Work email *</label><input id="email" type="email" required maxLength={150} value={f.email} onChange={set('email')} /></div>
          <div><label htmlFor="dept">Department</label><input id="dept" maxLength={100} value={f.department} onChange={set('department')} /></div>
          <div><label htmlFor="loc">Location / desk / asset tag</label><input id="loc" maxLength={150} value={f.location} onChange={set('location')} /></div>
          <div>
            <label htmlFor="cat">Category *</label>
            <select id="cat" required value={f.category} onChange={set('category')}>
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pri">Priority *</label>
            <select id="pri" required value={f.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="full"><label htmlFor="subj">Subject *</label><input id="subj" required maxLength={150} placeholder="Short summary of the issue" value={f.subject} onChange={set('subject')} /></div>
          <div className="full"><label htmlFor="desc">Describe the issue *</label><textarea id="desc" required maxLength={5000} placeholder="What happened, any error message, since when…" value={f.description} onChange={set('description')} /></div>
        </div>
        {err && <p className="err">{err}</p>}
        <div className="row" style={{ marginTop: 16 }}>
          <button disabled={busy}>{busy ? 'Submitting…' : 'Submit ticket'}</button>
        </div>
      </form>
    </div>
  );
}
