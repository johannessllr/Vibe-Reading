/**
 * Usage:
 *   npm run extract-book -- --title "Vibe Coding"
 * Looks up the book by (partial) title in the Apple Books library, reads its
 * unpacked EPUB folder, writes data/book.json.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { stripHtml, buildChunks, spineHrefs } from '../src/lib/extract';
import { getBooks } from '../src/lib/apple-books';

const titleArg = process.argv[process.argv.indexOf('--title') + 1];
if (!titleArg) throw new Error('Pass --title "<Apple Books title (partial ok)>"');

const book = getBooks().find((b) =>
  b.title.toLowerCase().includes(titleArg.toLowerCase()),
);
if (!book) throw new Error(`No book matching "${titleArg}" in Apple Books`);
if (!book.path) throw new Error(`Book has no local path (still in iCloud? open it once)`);
if (!statSync(book.path).isDirectory())
  throw new Error(`${book.path} is not an unpacked EPUB folder (DRM or PDF?)`);

function findOpf(dir: string): string {
  for (const f of readdirSync(dir, { recursive: true }) as string[]) {
    if (f.endsWith('.opf')) return join(dir, f);
  }
  throw new Error(`No .opf in ${dir}`);
}

const opfPath = findOpf(book.path);
const opfDir = dirname(opfPath);
const hrefs = spineHrefs(readFileSync(opfPath, 'utf8'));
if (hrefs.length === 0) throw new Error('Empty spine — check the OPF manually');

const fullText = hrefs
  .map((h) => stripHtml(readFileSync(join(opfDir, h), 'utf8')))
  .join(' ');

const out = {
  title: book.title,
  author: book.author ?? 'Unknown',
  assetId: book.assetId,
  chunks: buildChunks(fullText),
};

mkdirSync('data', { recursive: true });
writeFileSync('data/book.json', JSON.stringify(out, null, 1));
console.log(
  `Wrote data/book.json: "${out.title}", ${out.chunks.length} chunks, ` +
  `${fullText.split(' ').length} words`,
);
