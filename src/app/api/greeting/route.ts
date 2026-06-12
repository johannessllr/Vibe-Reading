import { generateText } from 'ai';
import { model } from '@/lib/ai';
import { readMemory } from '@/lib/memory';
import { loadBook } from '@/lib/book';
import { getBooks } from '@/lib/apple-books';

export async function GET() {
  const book = loadBook();
  // Apple Books may be absent on a dev machine — fall back to 0% rather than 500.
  let live;
  try {
    live = getBooks().find((b) => b.assetId === book.assetId);
  } catch {
    live = undefined;
  }
  const progress = ((live?.progress ?? 0) * 100).toFixed(0);

  const { text } = await generateText({
    model,
    system: `You are the reader's book buddy. Your memory:\n${readMemory()}`,
    prompt: `Write ONE short, warm greeting line (max 25 words) for Johannes
opening the app. Reference something from our past sessions and that he's at
${progress}% of "${book.title}". No quotation marks.`,
  });
  return Response.json({ greeting: text });
}
