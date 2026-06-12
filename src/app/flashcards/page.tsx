'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Flashcard { front: string; back: string; book: string }

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [count, setCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = (n: number) => {
    setLoadingMore(true);
    fetch(`/api/flashcards?count=${n}`)
      .then((r) => r.json())
      .then((d) => {
        setCards(d.cards);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    let ignore = false;

    fetch('/api/flashcards?count=8')
      .then((r) => r.json())
      .then((d: { cards: Flashcard[] }) => {
        if (!ignore) setCards(d.cards);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const generateMore = () => {
    const next = count + 8;
    setCount(next);
    load(next);
  };

  if (cards === null)
    return <p className="italic text-[#8a7a64]">Reading your highlights…</p>;
  if (cards.length === 0)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl"><Link href="/">←</Link> Flashcards</h1>
        <p>No highlights yet — mark a few passages in Apple Books and reload.</p>
      </div>
    );

  const card = cards[idx];
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl"><Link href="/">←</Link> Flashcards</h1>
        <span className="text-sm text-[#8a7a64]">{idx + 1} / {cards.length}</span>
      </header>

      <Card
        onClick={() => setFlipped(!flipped)}
        className="flex min-h-56 cursor-pointer items-center justify-center bg-white/70 border-[#e5dac5] select-none"
      >
        <CardContent className="p-8 text-center">
          <p className="text-xs uppercase tracking-wide text-[#8a7a64]">
            {flipped ? 'Answer' : 'Question — tap to flip'}
          </p>
          <p className="mt-3 text-lg">{flipped ? card.back : card.front}</p>
          <p className="mt-4 text-xs text-[#8a7a64]">from “{card.book}”</p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={idx === 0}
          onClick={() => { setIdx(idx - 1); setFlipped(false); }}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          disabled={loadingMore}
          onClick={generateMore}
          title="The deck is deliberately small — only the most learnable facts. This asks for more."
        >
          {loadingMore ? 'Generating…' : 'Generate more'}
        </Button>
        <Button
          disabled={idx === cards.length - 1}
          onClick={() => { setIdx(idx + 1); setFlipped(false); }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
