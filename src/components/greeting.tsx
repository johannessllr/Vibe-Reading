'use client';
import { useEffect, useState } from 'react';

export function Greeting() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/greeting')
      .then((r) => r.json())
      .then((d) => setText(d.greeting))
      .catch(() => setText('Good to see you again.'));
  }, []);
  return (
    <p className="text-lg italic text-[#5a4a38] min-h-7">
      {text ?? 'thinking of you…'}
    </p>
  );
}
