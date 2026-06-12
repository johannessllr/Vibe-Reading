import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BookChunk } from './extract';

export interface BookData {
  title: string;
  author: string;
  assetId: string;
  chunks: BookChunk[];
}

export function loadBook(): BookData {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'data/book.json'), 'utf8'),
  );
}

/**
 * Spoiler filter: only text the reader has already passed.
 * If over budget, keep the END (most recent reading) — that's what
 * conversations are usually about.
 */
export function textUpTo(
  book: BookData,
  progress: number,
  maxChars = 80_000,
): string {
  const visible = book.chunks
    .filter((c) => c.position <= progress)
    .map((c) => c.text)
    .join('\n\n');
  return visible.length > maxChars ? visible.slice(-maxChars) : visible;
}

/** Guide mode: the not-yet-read remainder. Truncated from the END — the part
 *  just ahead of the reader matters most for "this gets answered soon". */
export function textAfter(
  book: BookData,
  progress: number,
  maxChars = 40_000,
): string {
  const ahead = book.chunks
    .filter((c) => c.position > progress)
    .map((c) => c.text)
    .join('\n\n');
  return ahead.length > maxChars ? ahead.slice(0, maxChars) : ahead;
}
