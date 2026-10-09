export const CATEGORIES = [
  'Hardware (Laptop / Desktop)',
  'Software / Application',
  'Network / Wi-Fi / VPN',
  'Email / Account',
  'Password / Access',
  'Printer / Scanner',
  'New Asset Request',
  'Other',
];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];

export const refOf = (id) => 'IT-' + String(id).padStart(4, '0');
export const idFromRef = (ref) => {
  const m = String(ref || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : NaN;
};
