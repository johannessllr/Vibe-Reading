# Book covers — Goodreads-style book display

**Date:** 2026-06-12
**Status:** Approved
**Relates to:** `2026-06-12-vibe-reading-design.md` (extends the `[ui]` book display; new scope beyond the original plan)

## Goal

Books in Vibe-Reading should look like books, not text cards. Wherever a book
appears, show its cover — like Goodreads. Chosen layout: keep the existing
card layouts and add a cover image to each (minimal-change option).

## Cover source

Covers come from the user's own EPUB files on disk (approach A — local only,
no network):

- Apple Books' library DB already gives us each book's `path`
  (`LibraryBook.path` from `getBooks()`).
- Sideloaded EPUBs are **unpacked folders**. The standard
  `META-INF/container.xml` points to the OPF manifest; the cover image is the
  manifest item with `properties="cover-image"` (EPUB 3) or the item
  referenced by `<meta name="cover" content="...id..."/>` (EPUB 2). Support
  both; real files often carry both.
- Books with no usable file — Apple-purchased (DRM, empty `path`), PDFs,
  malformed EPUBs — get a **generated placeholder**: a gradient tile with the
  book title, colors picked deterministically from the title out of 3–4
  palettes that match the cream theme. The placeholder is a designed state,
  not an error state.

Explicitly rejected: online cover lookup (iTunes Search API). Network
dependence during a demo plus mismatch risk for hash-named/worksheet files
outweighs covers for off-shelf DRM'd books.

## Components

### 1. `src/lib/cover.ts` (new)

`findCoverPath(bookPath: string | null): { path: string; mime: string } | null`

Pure function. Returns the absolute path + MIME type of the cover image
inside an unpacked EPUB folder, or `null` for: null path, non-directories,
PDFs, folders without container.xml/OPF, manifests without a cover entry.
Never throws. XML is read with lightweight regex/string matching consistent
with the repo's existing parsing style (no new dependencies).

### 2. `src/app/api/cover/[assetId]/route.ts` (new)

`GET /api/cover/<assetId>` → find the book via `getBooks()`, call
`findCoverPath`, stream the file with correct `Content-Type` and
`Cache-Control: public, max-age=3600`. `404` when book or cover is missing —
the 404 triggers the client-side fallback.

### 3. `src/components/book-cover.tsx` (new, client component)

`<BookCover assetId title size>` with `size` ∈ `sm` (38×56, Add list),
`md` (56×84, library cards), `lg` (96×144, book detail).

Renders `<img src="/api/cover/<assetId>">`; `onError` swaps to the
placeholder tile. Fixed dimensions in both states — no layout shift, no
broken-image icon. Client component because the error swap needs the browser.

## Page changes

- **`src/app/page.tsx` (library):** cover `md` on the left of each card,
  title/author/progress to the right (mockup option C).
- **`src/app/book/[assetId]/page.tsx` (detail):** cover `lg` beside the
  title in the header.
- **`src/app/add/page.tsx` (add list):** cover `sm` at the start of each row.

No other layout changes; the existing cards, progress bars, and badges stay.

## Error handling

All failure paths (no path, DRM, PDF, bad EPUB, route 500/404) converge on
the placeholder. The page never shows a broken image and never crashes
because a cover is missing.

## Testing

- **Unit (vitest, `tests/cover.test.ts`):** build a minimal fixture EPUB
  folder in a temp dir; assert cover found via `properties="cover-image"`,
  via `<meta name="cover">`, and `null` for a coverless folder and a null
  path. Matches the repo's existing fixture-based test style.
- **Manual:** browser verification on the running dev server — real cover
  for the sideloaded demo book, placeholder for a DRM'd book, all three
  pages.

## Workflow

New GitHub issue ("Task 18: book covers"), branch `task-18-book-covers`,
PR, `npm test` before self-merge — per team convention. The API route is a
new file in the nominal `[ai]` area; no conflict risk with in-flight Wormy
work (Tasks 15/16) since those touch different files.
