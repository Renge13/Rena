import { createPairRow } from '@/lib/pair/handlers.js';

export const runtime = 'nodejs';

// POST /api/pair   body: { a: {...birth}, b: {...birth}, a_reading_id? }
//
// Thin wrapper, like every other route here: the handler lives in lib/ so the
// spec can exercise it without Next's `@/` alias. See lib/pair/handlers.js.
export async function POST(request) {
  return createPairRow(request);
}
