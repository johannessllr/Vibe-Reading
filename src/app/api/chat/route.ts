import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { model } from '@/lib/ai';
import { readMemory, readSpoilerMode } from '@/lib/memory';
import { loadBook, textUpTo, textAfter } from '@/lib/book';
import { getBooks } from '@/lib/apple-books';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const book = loadBook();
  // Apple Books may be absent on a dev machine — fall back to 0% rather than 500.
  let live;
  try {
    live = getBooks().find((b) => b.assetId === book.assetId);
  } catch {
    live = undefined;
  }
  const progress = live?.progress ?? 0;
  const mode = readSpoilerMode();

  const spoilerSection =
    mode === 'strict'
      ? `Below is ONLY the text he has read so far. HARD RULE: never reveal,
hint at, or ask about anything beyond this point — even if you know the book.
If asked about later parts, playfully refuse ("no spoilers from me").

BOOK TEXT READ SO FAR:
${textUpTo(book, progress)}`
      : `This book is in GUIDE mode (non-fiction): you see the whole text,
split into read and unread. Anchor the conversation to what he has read. You
MAY point ahead — "that exact question gets answered in a later chapter" — and
preview an idea in a sentence or two, but never lecture at length from the
unread part. Make him want to keep reading.

BOOK TEXT READ SO FAR (anchor here):
${textUpTo(book, progress)}

REMAINDER — NOT YET READ (point ahead, don't dump):
${textAfter(book, progress)}`;

  const system = `You are Johannes's reading buddy — a single continuous companion
across all his books and sessions. Your personality and shared history live in
your memory file below. Talk the way it describes.

YOUR MEMORY:
${readMemory()}

CURRENT BOOK: "${book.title}" by ${book.author}.
The reader is at ${(progress * 100).toFixed(0)}%.
${spoilerSection}`;

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
