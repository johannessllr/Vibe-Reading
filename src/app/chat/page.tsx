'use client';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Demo: the chat opens mid-conversation. These ride along in the request,
// so live replies stay consistent with them.
const SEEDED_MESSAGES: UIMessage[] = [
  {
    id: 'seed-1',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: "Okay, the FAAFO chapter. Fast, fun — fine. But “optionality” sounds like consultant-speak. Is it a real benefit?",
      },
    ],
  },
  {
    id: 'seed-2',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: "Fair challenge — but of the five it's the most economist-friendly one, so you of all people should like it. When attempts are nearly free, you can run three approaches in parallel and throw two away. That's option value, in exactly your textbook sense. Gene and Steve call it “turning one-way doors into reversible experiments.”",
      },
    ],
  },
  {
    id: 'seed-3',
    role: 'user',
    parts: [
      {
        type: 'text',
        text: 'Fine, that lands. Does the book ever admit when vibe coding goes wrong?',
      },
    ],
  },
  {
    id: 'seed-4',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: "It does — there's a whole stretch ahead on failure modes and keeping your AI on a leash. No spoilers, but your skepticism is about to feel very validated. Keep reading. 🐛",
      },
    ],
  },
];

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    messages: SEEDED_MESSAGES,
  });
  const [input, setInput] = useState('');
  const [memorySaved, setMemorySaved] = useState(false);
  const [mode, setMode] = useState<'strict' | 'guide'>('guide');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setMode(d.spoilerMode))
      .catch(() => {});
  }, []);

  const toggleMode = async () => {
    const next = mode === 'guide' ? 'strict' : 'guide';
    setMode(next);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ spoilerMode: next }),
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const endSession = async () => {
    const transcript = messages
      .map(
        (m) =>
          `${m.role}: ${m.parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('')}`,
      )
      .join('\n');
    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    setMemorySaved(true);
  };

  return (
    <div className="flex h-[85vh] flex-col space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl">
          <Link href="/">←</Link> Chat
        </h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={toggleMode}
            title="Strict: never look ahead. Guide: may point ahead to later chapters."
          >
            {mode === 'guide' ? 'Guide mode' : 'Strict mode'}
          </Button>
          <Button
            variant="outline"
            onClick={endSession}
            disabled={messages.length === 0 || memorySaved}
          >
            {memorySaved ? 'Remembered ✓' : 'End session & remember'}
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-[#e5dac5] bg-white/70 p-4">
        {messages.length === 0 && (
          <p className="text-sm italic text-[#8a7a64]">
            Ask Wormy anything about the book — he knows where you are.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-[#2b2118] text-[#faf6ee]'
                : 'bg-[#f0e8d8]'
            }`}
          >
            {m.parts.map((p, i) =>
              p.type === 'text' ? <span key={i}>{p.text}</span> : null,
            )}
          </div>
        ))}
        {status === 'submitted' && (
          <p className="text-sm italic text-[#8a7a64]">…</p>
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What did you think about…"
        />
        <Button type="submit" disabled={status !== 'ready'}>
          Send
        </Button>
      </form>
    </div>
  );
}
