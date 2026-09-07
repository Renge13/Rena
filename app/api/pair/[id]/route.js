import { servePairFacts } from '@/lib/pair/serve.js';

export const runtime = 'nodejs';

// GET /api/pair/[id] — the compat report's deterministic facts, gated on payment.
//
// Thin wrapper; the handler lives in lib/ so the spec can exercise it without
// Next's `@/` alias. See lib/pair/serve.js.
export async function GET(request, { params }) {
  const { id } = await params;
  return servePairFacts(id);
}
