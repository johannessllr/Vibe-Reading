import { generateObject } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai';
import { getAllHighlights } from '@/lib/apple-books';

const cardsSchema = z.object({
  cards: z.array(
    z.object({ front: z.string(), back: z.string(), book: z.string() }),
  ),
});

// Cross-book deck. Selective by design: only hard, learnable facts — not a
// card per highlight. ?count= raises the cap ("Generate more" in the UI).
export async function GET(req: Request) {
  const count = Math.min(
    Number(new URL(req.url).searchParams.get('count')) || 8,
    30,
  );
  // Apple Books may be absent on a dev machine — fall back to an empty deck.
  let highlights;
  try {
    highlights = getAllHighlights();
  } catch {
    highlights = [];
  }
  if (highlights.length === 0) {
    return Response.json({ cards: [], note: 'No highlights in Apple Books yet.' });
  }

  const { object } = await generateObject({
    model,
    schema: cardsSchema,
    prompt: `From these reader highlights (from several books), create AT MOST
${count} flashcards — fewer is better than padded. Be selective: only hard,
genuinely learnable facts (names, numbers, definitions, concrete claims).
Skip highlights that don't contain one. Order by usefulness, best first.
Front: a question testing the fact. Back: the answer, grounded in the
highlight. Set "book" to the book title the highlight came from. Include the
reader's own note if there is one.

HIGHLIGHTS:
${highlights
  .map(
    (h) =>
      `- [${h.bookTitle}] "${h.text}"${h.note ? ` (reader note: ${h.note})` : ''}`,
  )
  .join('\n')}`,
  });
  return Response.json(object);
}
