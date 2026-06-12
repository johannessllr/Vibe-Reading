import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateObject } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai';
import { getAllHighlights, type Highlight } from '@/lib/apple-books';

const cardsSchema = z.object({
  cards: z.array(
    z.object({ front: z.string(), back: z.string(), book: z.string() }),
  ),
});

type Card = z.infer<typeof cardsSchema>['cards'][number];

// Hand-curated starter deck so the page is never empty (e.g. demo machines
// without highlights). Highlight-generated cards are appended after these.
function seedCards(): Card[] {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), 'data/seed-flashcards.json'), 'utf8'),
    ).cards;
  } catch {
    return [];
  }
}

// Cross-book deck. Selective by design: only hard, learnable facts — not a
// card per highlight. ?count= raises the cap ("Generate more" in the UI).
export async function GET(req: Request) {
  const count = Math.min(
    Number(new URL(req.url).searchParams.get('count')) || 8,
    30,
  );
  const seeds = seedCards();
  // Apple Books may be absent on a dev machine — fall back to the seed deck.
  let highlights: (Highlight & { bookTitle: string })[];
  try {
    highlights = getAllHighlights();
  } catch {
    highlights = [];
  }
  if (highlights.length === 0) {
    return Response.json({
      cards: seeds,
      note: seeds.length === 0 ? 'No highlights in Apple Books yet.' : undefined,
    });
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

${
  seeds.length > 0
    ? `These cards are ALREADY in the deck — do not create near-duplicates of them:
${seeds.map((c) => `- ${c.front}`).join('\n')}

`
    : ''
}HIGHLIGHTS:
${highlights
  .map(
    (h) =>
      `- [${h.bookTitle}] "${h.text}"${h.note ? ` (reader note: ${h.note})` : ''}`,
  )
  .join('\n')}`,
  });
  return Response.json({ cards: [...seeds, ...object.cards] });
}
