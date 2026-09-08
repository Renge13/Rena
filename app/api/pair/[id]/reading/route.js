import { servePairReading } from '@/lib/pair/serveReading.js';

export const runtime = 'nodejs';

// GET /api/pair/[id]/reading — the paid compat report: facts and prose.
//
// Thin wrapper; the handler lives in lib/ so the spec can exercise it without
// Next's `@/` alias. See lib/pair/serveReading.js.
export async function GET(request, { params }) {
  const { id } = await params;
  return servePairReading(request, id);
}
