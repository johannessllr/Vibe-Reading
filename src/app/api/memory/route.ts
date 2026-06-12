import { generateText } from 'ai';
import { model } from '@/lib/ai';
import { readMemory, writeMemory } from '@/lib/memory';

export async function POST(req: Request) {
  const { transcript }: { transcript: string } = await req.json();

  const { text } = await generateText({
    model,
    prompt: `You maintain a reading buddy's memory file. Rewrite it to fold in
what happened in the latest session. Keep the same markdown structure
(Who Johannes is / How we talk / Past sessions). Add a dated entry under
"Past sessions" (today is ${new Date().toISOString().slice(0, 10)}), update
interests if new themes appeared, keep it under 60 lines. Output ONLY the
new file content, no fences.

CURRENT MEMORY FILE:
${readMemory()}

LATEST SESSION TRANSCRIPT:
${transcript}`,
  });

  writeMemory(text.trim());
  return Response.json({ memory: text.trim() });
}
