// tests/cover.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { findCoverPath } from '../src/lib/cover';

const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });

/** Minimal unpacked-EPUB fixture: container.xml -> content/book.opf -> image. */
function makeEpub(opfItems: string, withImage = true): string {
  const dir = mkdtempSync(join(tmpdir(), 'epub-fixture-'));
  dirs.push(dir);
  mkdirSync(join(dir, 'META-INF'), { recursive: true });
  writeFileSync(
    join(dir, 'META-INF', 'container.xml'),
    '<?xml version="1.0"?><container><rootfiles>' +
      '<rootfile full-path="content/book.opf" media-type="application/oebps-package+xml"/>' +
      '</rootfiles></container>',
  );
  mkdirSync(join(dir, 'content', 'images'), { recursive: true });
  writeFileSync(
    join(dir, 'content', 'book.opf'),
    `<?xml version="1.0"?><package><manifest>${opfItems}</manifest></package>`,
  );
  if (withImage) writeFileSync(join(dir, 'content', 'images', 'cover.jpg'), 'fake-jpeg-bytes');
  return dir;
}

describe('findCoverPath', () => {
  it('finds the EPUB 3 cover via properties="cover-image"', () => {
    const dir = makeEpub(
      '<item id="c" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>',
    );
    const cover = findCoverPath(dir);
    expect(cover?.path).toBe(join(dir, 'content', 'images', 'cover.jpg'));
    expect(cover?.mime).toBe('image/jpeg');
  });

  it('finds the EPUB 2 cover via <meta name="cover"> indirection', () => {
    const dir = makeEpub(
      '<meta name="cover" content="cover-id"/>' +
        '<item id="cover-id" href="images/cover.jpg" media-type="image/jpeg"/>',
    );
    expect(findCoverPath(dir)?.path).toBe(join(dir, 'content', 'images', 'cover.jpg'));
  });

  it('returns null when the manifest has no cover entry', () => {
    const dir = makeEpub('<item id="x" href="ch1.xhtml" media-type="application/xhtml+xml"/>');
    expect(findCoverPath(dir)).toBeNull();
  });

  it('returns null when the declared image file is missing', () => {
    const dir = makeEpub(
      '<item id="c" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>',
      false,
    );
    expect(findCoverPath(dir)).toBeNull();
  });

  it('returns null for null paths, missing dirs, and non-EPUB files', () => {
    expect(findCoverPath(null)).toBeNull();
    expect(findCoverPath('/nonexistent/place.epub')).toBeNull();
    expect(findCoverPath(tmpdir())).toBeNull(); // dir without container.xml
  });

  it('does not follow a cover href outside the book folder', () => {
    const outside = mkdtempSync(join(tmpdir(), 'outside-'));
    dirs.push(outside);
    writeFileSync(join(outside, 'leak.png'), 'outside-bytes');
    const rel = relative(join(mkdtempSync(join(tmpdir(), 'epub-fixture-')), 'content'), join(outside, 'leak.png'));
    dirs.push(mkdtempSync(join(tmpdir(), 'epub-fixture-')));
    const dir = mkdtempSync(join(tmpdir(), 'epub-fixture-'));
    dirs.push(dir);
    mkdirSync(join(dir, 'META-INF'), { recursive: true });
    writeFileSync(
      join(dir, 'META-INF', 'container.xml'),
      '<?xml version="1.0"?><container><rootfiles>' +
        '<rootfile full-path="content/book.opf" media-type="application/oebps-package+xml"/>' +
        '</rootfiles></container>',
    );
    mkdirSync(join(dir, 'content'), { recursive: true });
    const relPath = relative(join(dir, 'content'), join(outside, 'leak.png'));
    writeFileSync(
      join(dir, 'content', 'book.opf'),
      `<?xml version="1.0"?><package><manifest><item id="c" href="${relPath}" media-type="image/png" properties="cover-image"/></manifest></package>`,
    );
    expect(findCoverPath(dir)).toBeNull();
  });

  it('requires cover-image as a whole token, not a substring', () => {
    const dir = makeEpub(
      '<item id="thumb" href="images/wrong.jpg" media-type="image/jpeg" properties="cover-image-thumb"/>' +
        '<item id="c" href="images/cover.jpg" media-type="image/jpeg" properties="svg cover-image"/>',
    );
    expect(findCoverPath(dir)?.path).toBe(join(dir, 'content', 'images', 'cover.jpg'));
  });
});
