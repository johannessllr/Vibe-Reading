import { readFileSync } from 'node:fs';
import { getBooks } from '@/lib/apple-books';
import { findCoverPath } from '@/lib/cover';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params;
  // Apple Books may be absent on a dev machine — treat as "no cover".
  let book;
  try {
    book = getBooks().find((b) => b.assetId === assetId);
  } catch {
    book = undefined;
  }
  const cover = book ? findCoverPath(book.path) : null;
  if (!cover) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(readFileSync(cover.path)), {
    headers: {
      'content-type': cover.mime,
      'cache-control': 'public, max-age=3600',
    },
  });
}
