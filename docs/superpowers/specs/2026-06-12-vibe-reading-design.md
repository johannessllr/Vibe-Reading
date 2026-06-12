# Vibe-Reading — Design

**Date:** 2026-06-12
**Status:** Approved by Johannes
**Scope:** Hackathon demo. Pragmatic hardcoding is allowed wherever it doesn't touch the live "wow" moments.

## What we're building

An AI reading buddy as a local web app. You read a book in Apple Books on your Mac; the app reads your live reading position and highlights straight from Apple Books' local databases and gives you:

1. **A buddy with persistent memory.** A markdown memory file accumulates across sessions and books (knows you've read Stoicism, knows how you like to talk). The file shapes the buddy's personality over time.
2. **Adaptive comprehension quizzes.** Questions start at a 12-year-old level and get harder as you answer well. Difficulty is tracked per book.
3. **Flashcards from your real highlights.** Whatever you highlight in Apple Books becomes study material.
4. **Spoiler awareness with two modes (per-book setting).**
   - **Strict** (fiction): the buddy only sees text up to your current position and playfully refuses to go beyond.
   - **Guide** (non-fiction, default for the demo book): the buddy sees the whole book but anchors discussion to your position — it may point ahead ("chapter 9 answers exactly that") and preview ideas without dumping later content in detail. Useful for tech books like *Vibe Coding*, where knowing that a question gets answered later is part of the value.
   - The quiz only ever tests text up to the current position, in both modes.

## Why this architecture

- **Local Next.js app, no deployment.** Apple Books data lives on the Mac, so the app runs there too. A localhost browser tab demos identically to a deployed app, and we skip databases, sync agents, and auth entirely.
- **Apple Books over Kindle.** Verified working: `BKLibrary…sqlite` has every book plus reading progress (0–1 fraction), `AEAnnotation…sqlite` has highlights with selected text. Kindle has no public API and only fragile scraping routes — not worth hackathon time.
- **Pre-extracted book text.** Apple-purchased books are DRM-protected; sideloaded EPUBs are plain zip files. We pick one DRM-free book from Johannes's library and extract its text once with a script into chunked JSON (chapter + position fraction per chunk). No live EPUB parsing in the demo. The repo is public, so the EPUB and the extracted `data/book.json` are **gitignored** (copyrighted text) — each teammate gets the EPUB from Johannes directly and runs the extraction locally, or develops against the stub in CLAUDE.md.

## Architecture

One Next.js app (App Router), running locally. Three data sources:

| Source | What | When read |
|---|---|---|
| Apple Books SQLite (read-only copy) | Current book, reading progress, highlights | Live, on page load |
| `data/book.json` | Pre-extracted book text, chunked with position fractions | At chat/quiz time |
| `data/buddy-memory.md` + `data/state.json` | Buddy memory; per-book quiz difficulty | Session start / after sessions |

AI calls go through the AI SDK (streaming) to the Claude API.

**Spoiler filter:** reading progress is a 0–1 fraction. In **strict** mode, only text chunks whose position fraction is below the current progress go into the prompt. In **guide** mode, all chunks go in, marked as read/unread relative to the position, with prompt instructions to anchor to the read part and only point ahead, never dump ahead. The mode lives in `data/state.json` and is toggleable in the chat UI.

**SQLite safety:** Apple Books uses WAL files; we copy the database before reading so an open Apple Books doesn't bite us.

## Screens & navigation

The buddy has a name: **Wormy** (a bookworm — future: animated mascot icon).

Bottom tab bar, always visible: **Books · Flashcards · Wormy**

- **Books (home)** — a curated shelf, not the whole Apple Books library: only books the reader has explicitly added, with live progress and a Wormy greeting at the top. Tap a book → its detail page. An "Add a book" flow lists the remaining Apple Books titles to pick from; books can be removed from the shelf on their detail page. The selection lives in `data/my-books.json`.
- **Book detail** — what you can do with this book: Chat and Quiz. Enabled only for books with extracted text (demo: Vibe Coding); other books show progress and highlights but no AI features.
- **Chat (per book)** — streaming conversation. System prompt = memory file + book context per the spoiler mode. After a session, one extra Claude call rewrites the memory file.
- **Quiz (per book)** — one question at a time, visible difficulty level (e.g., "Level 2/5"). Correct answers ramp the level up; state persists in `state.json`.
- **Flashcards (cross-book)** — one deck generated from highlights across ALL books in the library, labeled by book.
- **Wormy** — chat with Wormy independent of any book: reading recommendations from the library + memory, "how is my reading going", general talk. Settings live here too. Same memory file as book chats — one continuous companion.

Design direction: shadcn/ui with a warm, book-ish aesthetic (cream paper, ink text, serif headings) — not default dashboard gray.

## The memory loop

1. Session start: `buddy-memory.md` goes into the system prompt.
2. Session end (or a "remember this" action): one Claude call summarizes the conversation ("talked about discipline vs. freedom in Stoicism") and rewrites the file.
3. Demo moment: show the file before and after a chat — judges see the personality grow.

The memory file is pre-seeded with a plausible history so the buddy has personality from the first message.

## What's hardcoded vs. live

| Hardcoded | Live |
|---|---|
| Demo book text (extracted once, gitignored) | Reading position from Apple Books |
| Seeded initial memory file | Highlights from Apple Books |
| Single demo book (no book picker needed) | All AI conversations, quiz generation, memory updates |

## Team split (3 people, minimal merge conflicts)

- **Data layer** — Apple Books SQLite reader, EPUB extraction script, `data/` formats
- **AI layer** — chat route, memory loop, adaptive quiz logic, flashcard generation
- **UI/layout** — screens, shadcn components, visual design

## Demo-day prep checklist

- [ ] Pick the demo book (DRM-free EPUB from the library) and run the extraction script
- [ ] Make 5–10 highlights in it in Apple Books
- [ ] Read to ~30–50% so the spoiler filter visibly hides something
- [ ] Seed the memory file
- [ ] Claude API key in `.env.local`

## Out of scope

Deployment, multi-user, auth, Kindle, live EPUB parsing, book picker, mobile.
