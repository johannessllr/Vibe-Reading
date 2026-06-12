import { generateObject } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai';
import { loadBook, textUpTo } from '@/lib/book';
import { getBooks } from '@/lib/apple-books';
import { readQuizState, writeQuizState, applyAnswer } from '@/lib/memory';

const LEVEL_STYLE: Record<number, string> = {
  1: 'simple factual recall a 12-year-old could answer',
  2: 'comprehension — why things happened, what they mean',
  3: 'connections between ideas across different chapters',
  4: 'critical analysis and interpretation of the author’s argument',
  5: 'devil’s advocate — challenge a plausible-but-flawed reading of the text',
};

const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

// GET → next question at current level
export async function GET() {
  const state = readQuizState();
  const book = loadBook();
  // Apple Books may be absent on a dev machine — fall back to 0% rather than 500.
  let live;
  try {
    live = getBooks().find((b) => b.assetId === book.assetId);
  } catch {
    live = undefined;
  }
  const progress = live?.progress ?? 0;

  const { object } = await generateObject({
    model,
    schema: questionSchema,
    prompt: `Create ONE multiple-choice question about the book text below.
Difficulty level ${state.level}/5: ${LEVEL_STYLE[state.level]}.
Exactly 4 options, one correct. The explanation should teach, not just confirm.
Only use the text provided — the reader has read nothing beyond it.

BOOK TEXT:
${textUpTo(book, progress, 40_000)}`,
  });
  return Response.json({ ...object, level: state.level });
}

// POST {"wasCorrect": boolean} → record result, return new state
export async function POST(req: Request) {
  const { wasCorrect }: { wasCorrect: boolean } = await req.json();
  const next = applyAnswer(readQuizState(), wasCorrect);
  writeQuizState(next);
  return Response.json(next);
}
