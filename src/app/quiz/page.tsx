'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  level: number;
}

export default function QuizPage() {
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestion = async () => {
    setLoading(true);
    setPicked(null);
    setQ(await (await fetch('/api/quiz')).json());
    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;

    fetch('/api/quiz')
      .then((r) => r.json())
      .then((question: Question) => {
        if (!ignore) setQ(question);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const answer = async (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ wasCorrect: i === q.correctIndex }),
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl"><Link href="/">←</Link> Quiz</h1>
        {q && <Badge>Level {q.level}/5</Badge>}
      </header>

      {loading || !q ? (
        <p className="italic text-[#8a7a64]">Writing a question for you…</p>
      ) : (
        <Card className="bg-white/70 border-[#e5dac5]">
          <CardHeader><CardTitle>{q.question}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt, i) => {
              const isCorrect = picked !== null && i === q.correctIndex;
              const isWrongPick = picked === i && i !== q.correctIndex;
              return (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    isCorrect
                      ? 'border-green-600 bg-green-50'
                      : isWrongPick
                        ? 'border-red-500 bg-red-50'
                        : 'border-[#e5dac5] bg-white hover:bg-[#f0e8d8]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
            {picked !== null && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-[#5a4a38]">{q.explanation}</p>
                <Button onClick={fetchQuestion}>Next question</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
