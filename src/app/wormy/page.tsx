'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function WormyPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/wormy' }),
  });
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState<string | null>(null);
  const [showMemory, setShowMemory] = useState(false);

  useEffect(() => {
    fetch('/api/memory')
      .then((r) => r.json())
      .then((d) => setMemory(d.memory))
      .catch(() => {});
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex h-[85vh] flex-col space-y-4">
      <header className="flex items-center justify-between">
        {/* future: animated Wormy mascot instead of the emoji */}
        <h1 className="text-2xl">🪱 Wormy</h1>
        <Button variant="outline" onClick={() => setShowMemory(!showMemory)}>
          {showMemory ? 'Hide memory' : 'What Wormy remembers'}
        </Button>
      </header>

      {showMemory && (
        <pre className="max-h-48 overflow-y-auto rounded-lg border border-[#e5dac5] bg-white/70 p-3 text-xs whitespace-pre-wrap">
          {memory ?? 'No memories yet.'}
        </pre>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-[#e5dac5] bg-white/70 p-4">
        {messages.length === 0 && (
          <p className="text-sm italic text-[#8a7a64]">
            No book open — this is just you and Wormy. Ask for a recommendation,
            or how your reading is going.
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
            {m.parts.map((p, i) => (p.type === 'text' ? <span key={i}>{p.text}</span> : null))}
          </div>
        ))}
        {status === 'submitted' && <p className="text-sm italic text-[#8a7a64]">…</p>}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hey Wormy…"
        />
        <Button type="submit" disabled={status !== 'ready'}>Send</Button>
      </form>
    </div>
  );
}
