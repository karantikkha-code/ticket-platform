/**
 * IT Helpdesk – Google Sheets connector.
 * Paste this whole file into Extensions > Apps Script of your Google Sheet,
 * change SECRET below, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone).
 */
const SECRET = 'CHANGE-THIS-TO-A-LONG-RANDOM-SECRET';

const T_HEAD = ['Ticket No', 'Raised On', 'Last Update', 'Status', 'Priority', 'Category', 'Subject', 'Description', 'Name', 'Email', 'Department', 'Location', 'Assigned To'];
const C_HEAD = ['Ticket No', 'Date', 'Author', 'Role', 'Message', 'Comment ID'];

function doGet() {
  return out({ ok: true, result: 'IT Helpdesk sheet connector is running.' });
}

function doPost(e) {
  let lock = null;
  try {
    const b = JSON.parse(e.postData.contents);
    if (SECRET.indexOf('CHANGE-THIS') === 0) throw new Error('Set SECRET in the Apps Script first.');
    if (b.secret !== SECRET) throw new Error('Unauthorized (secret does not match).');
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    return out({ ok: true, result: run(b) });
  } catch (err) {
    return out({ ok: false, error: String((err && err.message) || err) });
  } finally {
    if (lock) try { lock.releaseLock(); } catch (x) {}
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(head);
    sh.setFrozenRows(1);
  }
  return sh;
}
const tSheet = () => sheet('Tickets', T_HEAD);
const cSheet = () => sheet('Comments', C_HEAD);

const ref = (id) => (id > 9999 ? 'IT-' + id : 'IT-' + ('0000' + id).slice(-4));
const idOf = (v) => { const m = String(v).match(/(\d+)\s*$/); return m ? parseInt(m[1], 10) : NaN; };
const iso = (v) => (v instanceof Date ? v.toISOString() : String(v));
// Stop text such as "=IMPORTXML(...)" from being stored as a live formula.
const safe = (v) => { const s = String(v == null ? '' : v); return /^[=+\-@]/.test(s) ? "'" + s : s; };
const txt = (v) => String(v).replace(/^'(?=[=+\-@])/, '');

function nextId(key) {
  const p = PropertiesService.getScriptProperties();
  const n = (parseInt(p.getProperty(key), 10) || 0) + 1;
  p.setProperty(key, String(n));
  return n;
}

function ticketOf(r) {
  return {
    id: idOf(r[0]), created_at: iso(r[1]), updated_at: iso(r[2]), status: txt(r[3]), priority: txt(r[4]),
    category: txt(r[5]), subject: txt(r[6]), description: txt(r[7]), name: txt(r[8]), email: txt(r[9]).toLowerCase(),
    department: txt(r[10]), location: txt(r[11]), assignee: txt(r[12]),
  };
}
function commentOf(r) {
  return { ticket_id: idOf(r[0]), created_at: iso(r[1]), author: txt(r[2]), role: txt(r[3]), body: txt(r[4]), id: Number(r[5]) };
}
function dataRows(sh) {
  return sh.getDataRange().getValues().slice(1);
}
// Returns the 1-based sheet row of a ticket, or 0.
function findRow(rows, id) {
  for (let i = 0; i < rows.length; i++) if (idOf(rows[i][0]) === id) return i + 2;
  return 0;
}

function run(b) {
  const id = Number(b.id);
  switch (b.action) {
    case 'list':
      return dataRows(tSheet()).filter((r) => r[0] !== '').map(ticketOf).sort((x, y) => y.id - x.id);

    case 'get': {
      const rows = dataRows(tSheet());
      const n = findRow(rows, id);
      return n ? ticketOf(rows[n - 2]) : null;
    }

    case 'create': {
      const t = b.ticket, now = new Date(), newId = nextId('ticketSeq');
      const row = [ref(newId), now, now, 'Open', safe(t.priority), safe(t.category), safe(t.subject), safe(t.description),
        safe(t.name), safe(t.email), safe(t.department), safe(t.location), ''];
      tSheet().appendRow(row);
      return ticketOf(row);
    }

    case 'update': {
      const sh = tSheet(), rows = dataRows(sh), n = findRow(rows, id);
      if (!n) return null;
      const r = rows[n - 2], p = b.patch || {};
      if (p.status != null) r[3] = safe(p.status);
      if (p.priority != null) r[4] = safe(p.priority);
      if (p.assignee != null) r[12] = safe(p.assignee);
      r[2] = new Date();
      sh.getRange(n, 3, 1, 3).setValues([[r[2], r[3], r[4]]]);
      sh.getRange(n, 13, 1, 1).setValues([[r[12]]]);
      return ticketOf(r);
    }

    case 'delete': {
      const sh = tSheet(), n = findRow(dataRows(sh), id);
      if (n) sh.deleteRow(n);
      const cs = cSheet(), crows = dataRows(cs);
      for (let i = crows.length - 1; i >= 0; i--) if (idOf(crows[i][0]) === id) cs.deleteRow(i + 2);
      return true;
    }

    case 'comments':
      return dataRows(cSheet()).filter((r) => idOf(r[0]) === id).map(commentOf);

    case 'comment': {
      const sh = tSheet(), n = findRow(dataRows(sh), id);
      if (!n) throw new Error('Ticket not found.');
      const now = new Date();
      const row = [ref(id), now, safe(b.author), safe(b.role), safe(b.body), nextId('commentSeq')];
      cSheet().appendRow(row);
      sh.getRange(n, 3, 1, 1).setValues([[now]]);
      return commentOf(row);
    }
  }
  throw new Error('Unknown action: ' + b.action);
}
