# Vibe-Reading

An AI reading buddy for people who read in Apple Books on macOS. Vibe-Reading reads your live Apple Books library, progress, highlights, and extracted book text, then gives you spoiler-aware chat, adaptive quizzes, highlight flashcards, and a persistent companion named Wormy.

## Current status

The hackathon demo is implemented and runnable locally:

- **Live Apple Books shelf**: reads titles, authors, progress, asset IDs, local EPUB paths, and highlights from Apple Books' local SQLite databases.
- **Curated shelf**: choose which Apple Books titles appear in the app.
- **Book detail pages**: show cover art when available, live progress, highlight counts, and actions.
- **Wormy reading buddy**: floating pet, standalone Wormy tab, book-aware chat, memory peek, and session memory updates.
- **Spoiler-aware chat**: uses the reader's current Apple Books progress and the extracted book text.
- **Adaptive quiz**: questions get harder or easier based on answers.
- **Flashcards**: combines a seeded demo deck with cards generated from real Apple Books highlights.
- **Book covers**: resolves cover images from unpacked sideloaded EPUB folders, with graceful fallback placeholders.

The app is a local macOS demo, not a deployed multi-user service.

## Requirements

- macOS with Apple Books installed
- Node.js **24** or newer, because the app uses the built-in `node:sqlite` module
- An Anthropic API key for AI routes
- A DRM-free EPUB if you want Wormy to read full book text for chat/quiz

## Quick start

```bash
git clone https://github.com/johannessllr/Vibe-Reading.git
cd Vibe-Reading
npm install
```

Create `.env.local`:

```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
```

Run the app:

```bash
npm run dev
```

Open <http://localhost:3000>.

## Connect your reading platform

### Supported now: Apple Books on macOS

Vibe-Reading currently connects directly to **Apple Books** by reading local Apple Books data on your Mac. No cloud account or export step is required for the library/progress/highlights layer.

1. Open Apple Books on the same Mac.
2. Add or download the books you want visible locally.
3. Open each book once so Apple Books writes local metadata and progress.
4. In Vibe-Reading, go to **Books → Add a book** and add titles from your Apple Books library.
5. Read or highlight in Apple Books, then refresh Vibe-Reading to see updated progress and highlights.

What is read live from Apple Books:

- book title and author
- reading progress
- Apple Books asset ID
- local EPUB path when available
- highlights and notes

### Full-text chat and quiz setup

Apple Books metadata and highlights are live, but book-aware chat and quiz need extracted text in `data/book.json`.

For a DRM-free EPUB:

1. Drag the EPUB into Apple Books.
2. Open it once in Apple Books so it is downloaded locally.
3. Run:

```bash
npm run extract-book -- --title "Your Book Title"
```

This creates a local `data/book.json`. That file is intentionally gitignored because it can contain copyrighted book text.

For the demo book:

```bash
npm run extract-book -- --title "Vibe Coding"
```

After extraction, the matching book gets the **Wormy ready** badge. Its book detail page enables:

- **Chat with Wormy**
- **Quiz**
- **Flashcards**

### Other reading platforms

Direct connectors for Kindle, Kobo, Goodreads, Libby, Readwise, or PDFs are not implemented in this demo.

Current workaround:

- export or obtain a DRM-free EPUB
- import it into Apple Books
- run the extraction command above

To add another platform later, build a connector that can provide the same shape of data Vibe-Reading expects today:

- stable book ID
- title and author
- reading progress from `0` to `1`
- optional local file path for cover/text extraction
- highlights with text, optional notes, chapter, and timestamp

## How to use the app

### Books

The home page shows your curated shelf, synced from Apple Books. Use **Add a book** to pull titles from your Apple Books library into the Vibe-Reading shelf.

### Book detail

Click a book to see progress, cover, highlight count, and available actions. Books with extracted text can use chat and quiz. Books without extracted text still contribute highlights to flashcards.

### Wormy pet

A floating Wormy pet appears around the app and nudges you while reading. Click Wormy to open the book-aware chat.

### Chat

Use **Chat with Wormy** to discuss the current demo book. Wormy uses:

- the extracted text up to your current progress
- spoiler mode settings
- `data/buddy-memory.md`
- the current conversation

Click **End session & remember** to fold the conversation back into Wormy's memory file.

### Wormy tab

The **Wormy** tab is book-independent. Use it for reading recommendations, memory inspection, and general reading conversation. It uses your memory file and a live overview of your Apple Books library.

### Quiz

The quiz starts easy and adapts based on your answers. Difficulty state lives in `data/state.json`.

### Flashcards

Flashcards combine:

- curated seed cards from `data/seed-flashcards.json`
- AI-generated cards from real Apple Books highlights

Highlight useful passages in Apple Books, then reload flashcards to generate cards from them.

## Important local files

- `data/buddy-memory.md`: Wormy's persistent memory and voice
- `data/state.json`: quiz difficulty and spoiler mode state
- `data/my-books.json`: curated shelf asset IDs
- `data/seed-flashcards.json`: starter flashcards for demo reliability
- `data/book.json`: extracted book text, local only and gitignored
- `.env.local`: local secrets, gitignored

## Privacy and data notes

- The app runs locally on macOS.
- Apple Books data is read from local SQLite database copies.
- The app copies Apple Books SQLite files to a temp directory before reading them because Apple Books uses WAL journaling.
- AI features send prompt context to Anthropic through the AI SDK.
- Do not commit `.env.local`, `*.epub`, PDFs, or `data/book.json`.

## Scripts

```bash
npm run dev           # start the local Next.js app
npm run build         # production build
npm run start         # run a built production app
npm run lint          # ESLint
npm test              # Vitest
npm run extract-book -- --title "Book Title"
```

## Verification

Before demoing or merging changes, run:

```bash
npm test
npm run lint
npm run build
```

## Project docs

- Design spec: `docs/superpowers/specs/2026-06-12-vibe-reading-design.md`
- Demo implementation plan: `docs/superpowers/plans/2026-06-12-vibe-reading-demo.md`
- Book covers plan: `docs/superpowers/plans/2026-06-12-book-covers.md`

## Team

- Johannes ([@johannessllr](https://github.com/johannessllr))
- _teammate 2_
- _teammate 3_
