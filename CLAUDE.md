# Vibe-Reading — Instructions for Claude

You are working on a hackathon project: an AI reading buddy that reads live
position and highlights from Apple Books on macOS and offers spoiler-free chat,
adaptive quizzes, flashcards, and a persistent memory file.

## Read these first

1. `docs/superpowers/specs/2026-06-12-vibe-reading-design.md` — what we're building and why
2. `docs/superpowers/plans/2026-06-12-vibe-reading-demo.md` — **the implementation plan. It contains complete code, exact file paths, test steps, and commit messages for every task. Follow it task by task — don't improvise a different architecture.**

## Workflow

1. Pick an open GitHub issue (each issue = one plan task), assign your human to it so nobody doubles up: `gh issue list`, `gh issue edit <n> --add-assignee <user>`
2. Work on a branch: `git checkout -b task-<n>-short-name`
3. Follow the plan's steps for that task exactly, including tests and the commit at the end
4. Push and open a PR (`gh pr create`), merge it yourself once tests pass — no review gate, but pull `main` often
5. **Stay in your area's files.** Areas: `[data]` (src/lib/apple-books, extract, book + scripts), `[ai]` (src/lib/memory, ai + src/app/api), `[ui]` (src/app pages + components). Cross-area edits cause merge conflicts.

## Task order / dependencies

- Task 1 (scaffold) must be merged before everything else
- Within an area, do tasks in number order; across areas, work in parallel
- **`data/book.json` and `*.epub` are gitignored** — the repo is public and the
  book text is copyrighted. To work with the real book: get the demo EPUB from
  Johannes (AirDrop/iCloud), drag it into Apple Books, open it once, then run
  `npm run extract-book -- --title "Vibe Coding"`.
- Alternatively, UI and AI tasks don't need real extraction: if `data/book.json`
  doesn't exist yet, create a local stub so you can work:

```json
{ "title": "Stub Book", "author": "Test", "assetId": "ASSET1",
  "chunks": [ { "position": 0, "text": "Once upon a time..." },
              { "position": 0.5, "text": "The middle part." } ] }
```

(It's gitignored either way — stubs and real extractions both stay local.)

## Environment facts (don't rediscover these)

- macOS only. Node 24. Use the built-in `node:sqlite`, NOT better-sqlite3.
- Apple Books library DB: `~/Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary/BKLibrary-*.sqlite` (table `ZBKLIBRARYASSET`: title, author, `ZREADINGPROGRESS` 0–1, `ZASSETID`, `ZPATH`)
- Highlights DB: same container, `AEAnnotation/AEAnnotation*.sqlite` (table `ZAEANNOTATION`, join on `ZANNOTATIONASSETID`, filter `ZANNOTATIONDELETED = 0`)
- Both DBs use WAL — always copy db + `-wal` + `-shm` to a temp dir and open the copy (the plan's Task 2 code does this)
- Sideloaded EPUBs are **unpacked folders** under `~/Library/Mobile Documents/iCloud~com~apple~iBooks/Documents/` — no unzipping needed. Apple-purchased books are DRM'd; their text can't be extracted.
- EPUB metadata can be garbage (hash titles) — trust the Apple Books DB title, not the OPF
- Tests (`npm test`, vitest) use fixture SQLite DBs and run on any machine; the real Apple Books reads only work on a Mac with books in it
- `ANTHROPIC_API_KEY` goes in `.env.local` (never commit it)

## Rules

- This is a demo. Hardcoding is fine for book text and seeded memory; the live
  parts (Apple Books position + highlights, all AI calls) must stay real.
- Don't add deployment, auth, databases, or a book picker — out of scope.
- Run `npm test` before every merge.
