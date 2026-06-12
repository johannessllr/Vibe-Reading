import { readSpoilerMode, writeSpoilerMode, type SpoilerMode } from '@/lib/memory';

export async function GET() {
  return Response.json({ spoilerMode: readSpoilerMode() });
}

export async function POST(req: Request) {
  const { spoilerMode }: { spoilerMode: SpoilerMode } = await req.json();
  if (spoilerMode !== 'strict' && spoilerMode !== 'guide') {
    return Response.json({ error: 'spoilerMode must be strict|guide' }, { status: 400 });
  }
  writeSpoilerMode(spoilerMode);
  return Response.json({ spoilerMode });
}
