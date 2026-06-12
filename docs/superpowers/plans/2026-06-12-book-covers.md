# Book Covers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each book's cover (real image from the local EPUB, or a generated placeholder) wherever books appear — library cards, book detail, add list.

**Architecture:** A pure lib function resolves the cover image path inside an unpacked EPUB folder (container.xml → OPF manifest → cover item). A streaming API route serves that image by assetId. A client `<BookCover>` component renders the image and swaps to a deterministic gradient placeholder on error. Three pages embed the component.

**Tech Stack:** Next.js 16 App Router route handlers, `node:fs`, vitest, Tailwind v4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-12-book-covers-design.md`

**Conventions:** Work on branch `task-18-book-covers`. The repo's Next.js may differ from your training data — bundled docs are at `node_modules/next/dist/docs/`. Route-handler `params` is a **Promise** and must be awaited.

---

### Task 1: Cover resolution lib `src/lib/cover.ts`

**Files:**
- Create: `src/lib/cover.ts`
- Test: `tests/cover.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/cover.test.ts`:

```ts
// tests/cover.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/cover.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/cover'` (or equivalent).

- [ ] **Step 3: Implement `src/lib/cover.ts`**

```ts
// src/lib/cover.ts
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export interface CoverFile {
  path: string;
  mime: string;
}

/**
 * Find the cover image inside an unpacked EPUB folder (Apple Books stores
 * sideloaded EPUBs unzipped). Follows the standard chain:
 * META-INF/container.xml -> OPF manifest -> cover item (EPUB 3
 * properties="cover-image", or EPUB 2 <meta name="cover"> indirection).
 * Returns null for anything that can't yield a cover (DRM'd books with no
 * path, PDFs, malformed EPUBs) — callers fall back to a placeholder.
 */
export function findCoverPath(bookPath: string | null): CoverFile | null {
  try {
    if (!bookPath || !existsSync(bookPath) || !statSync(bookPath).isDirectory()) {
      return null;
    }
    const container = readFileSync(join(bookPath, 'META-INF', 'container.xml'), 'utf8');
    const opfRel = container.match(/full-path="([^"]+)"/)?.[1];
    if (!opfRel) return null;
    const opfPath = join(bookPath, opfRel);
    const opf = readFileSync(opfPath, 'utf8');

    let href = opf
      .match(/<item[^>]*properties="[^"]*cover-image[^"]*"[^>]*>/i)?.[0]
      ?.match(/href="([^"]+)"/)?.[1];

    if (!href) {
      const coverId =
        opf.match(/<meta[^>]*name="cover"[^>]*content="([^"]+)"/i)?.[1] ??
        opf.match(/<meta[^>]*content="([^"]+)"[^>]*name="cover"/i)?.[1];
      if (coverId) {
        const escaped = coverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        href = opf
          .match(new RegExp(`<item[^>]*id="${escaped}"[^>]*>`, 'i'))?.[0]
          ?.match(/href="([^"]+)"/)?.[1];
      }
    }
    if (!href) return null;

    const imgPath = join(dirname(opfPath), decodeURIComponent(href));
    const mime = MIME[extname(imgPath).toLowerCase()];
    if (!mime || !existsSync(imgPath)) return null;
    return { path: imgPath, mime };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/cover.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Run the whole suite, then commit**

Run: `npm test`
Expected: all pass (17 = 12 existing + 5 new).

```bash
git add src/lib/cover.ts tests/cover.test.ts
git commit -m "feat(data): resolve cover images inside unpacked EPUBs"
```

---

### Task 2: Cover API route

**Files:**
- Create: `src/app/api/cover/[assetId]/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/cover/[assetId]/route.ts
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
```

- [ ] **Step 2: Verify against the running dev server**

The team dev server usually runs on port 3000. With at least one sideloaded
EPUB on the shelf (e.g. the demo book), grab its assetId and:

Run: `curl -s -o /tmp/cover.jpg -w "%{http_code} %{content_type}\n" "http://localhost:3000/api/cover/<assetId-of-sideloaded-book>"`
Expected: `200 image/jpeg` and `/tmp/cover.jpg` is a real image.

Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/cover/DOES-NOT-EXIST"`
Expected: `404`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cover
git commit -m "feat(ai): stream EPUB cover images by assetId"
```

---

### Task 3: `<BookCover>` component

**Files:**
- Create: `src/components/book-cover.tsx`

- [ ] **Step 1: Create the component**

A client component: the placeholder swap relies on the browser `onError`
event. Plain `<img>` (not `next/image`): the source is our own same-origin
API route streaming local files — optimization/CDN machinery buys nothing.

```tsx
// src/components/book-cover.tsx
'use client';
import { useState } from 'react';

const SIZE = {
  sm: 'w-[38px] h-[56px] text-[7px]',
  md: 'w-[56px] h-[84px] text-[9px]',
  lg: 'w-[96px] h-[144px] text-xs',
} as const;

// Gradient pairs tuned to the cream theme; picked deterministically from the
// title so a book keeps its placeholder color across pages and reloads.
const PALETTES: Array<[string, string]> = [
  ['#7a4a2b', '#3d2414'],
  ['#2b5a7a', '#142c3d'],
  ['#5a7a2b', '#2c3d14'],
  ['#7a2b5a', '#3d1430'],
];

export function BookCover({
  assetId,
  title,
  size = 'md',
}: {
  assetId: string;
  title: string;
  size?: keyof typeof SIZE;
}) {
  const [failed, setFailed] = useState(false);
  const base = `${SIZE[size]} shrink-0 rounded-[3px] shadow-sm`;

  if (failed) {
    const [from, to] =
      PALETTES[[...title].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTES.length];
    return (
      <div
        className={`${base} flex items-end overflow-hidden p-1 font-semibold text-white/90`}
        style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
        aria-label={`Cover of ${title}`}
      >
        <span className="line-clamp-3 leading-tight">{title}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- same-origin API stream, see above
    <img
      src={`/api/cover/${assetId}`}
      alt={`Cover of ${title}`}
      className={`${base} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
```

- [ ] **Step 2: Lint and commit**

Run: `npx eslint src/components/book-cover.tsx`
Expected: no errors.

```bash
git add src/components/book-cover.tsx
git commit -m "feat(ui): BookCover component with placeholder fallback"
```

---

### Task 4: Embed covers in the three pages

**Files:**
- Modify: `src/app/page.tsx` (library cards, lines ~33–52)
- Modify: `src/app/book/[assetId]/page.tsx` (header, lines ~40–46)
- Modify: `src/app/add/page.tsx` (rows, lines ~33–46)

- [ ] **Step 1: Library cards — cover left of the text (mockup option C)**

In `src/app/page.tsx`, add the import:

```tsx
import { BookCover } from '@/components/book-cover';
```

Replace the `books.map` card body (the `<Card>...</Card>` inside the Link)
with:

```tsx
<Card className="h-full bg-white/70 border-[#e5dac5] transition hover:-translate-y-0.5 hover:shadow-md">
  <CardContent className="flex gap-4 pt-6">
    <BookCover assetId={b.assetId} title={b.title} size="md" />
    <div className="min-w-0 flex-1 space-y-2">
      <CardTitle className="flex items-baseline justify-between gap-2 text-lg">
        <span className="line-clamp-2">{b.title}</span>
        {b.assetId === demoAssetId && <Badge>Wormy ready</Badge>}
      </CardTitle>
      <p className="text-sm text-[#5a4a38]">by {b.author ?? 'Unknown'}</p>
      <Progress value={pct} />
      <p className="text-xs text-[#8a7a64]">{pct}% read</p>
    </div>
  </CardContent>
</Card>
```

`CardHeader` is no longer used in this map — remove it from the import only
if nothing else on the page uses it (the "Add a book" card uses
`CardContent` only, so drop `CardHeader` from the import).

- [ ] **Step 2: Book detail — cover beside the title**

In `src/app/book/[assetId]/page.tsx`, add the import:

```tsx
import { BookCover } from '@/components/book-cover';
```

Replace the `<header>` block with:

```tsx
<header className="space-y-2">
  <p className="text-sm">
    <Link href="/" className="text-[#8a7a64]">← Your books</Link>
  </p>
  <div className="flex items-start gap-4">
    <BookCover assetId={book.assetId} title={book.title} size="lg" />
    <div className="min-w-0 space-y-1 pt-1">
      <h1 className="text-3xl">{book.title}</h1>
      <p className="text-sm text-[#5a4a38]">by {book.author ?? 'Unknown'}</p>
    </div>
  </div>
</header>
```

- [ ] **Step 3: Add list — small thumbnail per row**

In `src/app/add/page.tsx`, add the import:

```tsx
import { BookCover } from '@/components/book-cover';
```

Replace the row `<CardContent>` with:

```tsx
<CardContent className="flex items-center justify-between gap-3 pt-6">
  <div className="flex min-w-0 items-center gap-3">
    <BookCover assetId={b.assetId} title={b.title} size="sm" />
    <div className="min-w-0">
      <p className="line-clamp-1">{b.title}</p>
      <p className="text-xs text-[#8a7a64]">
        by {b.author ?? 'Unknown'} · {Math.round(b.progress * 100)}% read
      </p>
    </div>
  </div>
  <form action={add}>
    <input type="hidden" name="assetId" value={b.assetId} />
    <Button type="submit" variant="outline">Add</Button>
  </form>
</CardContent>
```

- [ ] **Step 4: Verify in the browser**

On the running dev server (port 3000): home shows the demo book with its
real cover; `/add` shows real covers for sideloaded EPUBs and gradient
placeholders for DRM'd/PDF entries (no broken-image icons, no layout shift);
the book detail page shows the large cover. Placeholder colors are stable
across reloads.

- [ ] **Step 5: Full suite, commit**

Run: `npm test`
Expected: all pass.

```bash
git add src/app/page.tsx "src/app/book/[assetId]/page.tsx" src/app/add/page.tsx
git commit -m "feat(ui): show book covers on library, detail, and add pages"
```

---

### Task 5: PR and merge

- [ ] **Step 1: Create the tracking issue (none exists for this — new scope)**

```bash
gh issue create --title "Task 18: Book covers (Goodreads-style)" \
  --body "Spec: docs/superpowers/specs/2026-06-12-book-covers-design.md. Local EPUB cover extraction, /api/cover route, BookCover component with placeholder, embedded on library/detail/add pages." \
  --label ui --assignee johannessllr
```

- [ ] **Step 2: Push, PR, merge**

```bash
git push -u origin task-18-book-covers
gh pr create --title "Task 18: book covers from local EPUBs" \
  --body "Implements docs/superpowers/specs/2026-06-12-book-covers-design.md — closes the issue created above."
npm test   # green before merge, per team rule
gh pr merge --merge --delete-branch
```
