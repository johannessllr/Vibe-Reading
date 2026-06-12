import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { model } from '@/lib/ai';
import { readMemory } from '@/lib/memory';
import { getBooks, type LibraryBook } from '@/lib/apple-books';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Apple Books may be absent on a dev machine — fall back to an empty shelf.
  let books: LibraryBook[];
  try {
    books = getBooks();
  } catch {
    books = [];
  }
  const library =
    books
      .map((b) => `- "${b.title}" by ${b.author ?? 'Unknown'} — ${(b.progress * 100).toFixed(0)}% read`)
      .join('\n') || '(no books on the shelf yet)';

  const system = `You are Wormy, Johannes's reading buddy — a bookworm and a
single continuous companion across all his books and sessions. This is your
own tab: no specific book is open. Talk about reading in general — recommend
what to read next (from his library or beyond, based on what you know about
him), reflect on his reading habits, or just chat. Your personality and shared
history live in your memory file.

YOUR MEMORY:
${readMemory()}

HIS LIBRARY RIGHT NOW (live from Apple Books):
${library}`;

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
