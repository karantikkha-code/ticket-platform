import { NextResponse } from 'next/server';
import { StorageError } from '@/lib/db';

// Turns storage failures into a readable JSON error instead of a blank 500.
export const safe = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (e) {
    console.error(e);
    const msg = e instanceof StorageError ? e.message : 'Ticket storage is not responding. Please try again.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};
