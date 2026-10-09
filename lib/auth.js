import crypto from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE = 'ithd_admin';
const pw = () => process.env.ADMIN_PASSWORD || '';
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

export const adminConfigured = () => Boolean(pw());
export const sessionToken = () => crypto.createHmac('sha256', pw()).update('ithd-admin-v1').digest('hex');
export const checkPassword = (input) => adminConfigured() && safeEq(input, pw());

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  return Boolean(c) && safeEq(c, sessionToken());
}
