'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { WormyMascot, type WormyMood } from '@/components/wormy-mascot';

// Ambient nudges the pet murmurs while you read. Pure personality — Wormy's
// real, book-aware answers live in the chat the pet links to.
const NUDGES: { mood: WormyMood; text: string }[] = [
  { mood: 'read', text: 'Lost in a good chapter?' },
  { mood: 'happy', text: 'Every page counts — keep going!' },
  { mood: 'idea', text: 'Found a line worth keeping? Highlight it.' },
  { mood: 'think', text: 'Hmm… what do you think happens next?' },
  { mood: 'excited', text: 'Ooh, this is getting good.' },
  { mood: 'note', text: 'Got a thought? Tell me — I’ll remember it.' },
  { mood: 'surprised', text: 'Wait, did you see that coming?' },
];

// The pet is hidden where Wormy is already the whole screen.
const HIDDEN_ON = ['/chat', '/wormy'];

export function WormyPet() {
  const pathname = usePathname();
  const router = useRouter();
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);

  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (hidden) return;
    // Greet shortly after arriving, then cycle a nudge every so often.
    const greet = setTimeout(() => setOpen(true), 1500);
    const hideGreet = setTimeout(() => setOpen(false), 7500);
    const cycle = setInterval(() => {
      setI((n) => (n + 1) % NUDGES.length);
      setOpen(true);
      setTimeout(() => setOpen(false), 6000);
    }, 16000);
    return () => {
      clearTimeout(greet);
      clearTimeout(hideGreet);
      clearInterval(cycle);
    };
  }, [hidden, pathname]);

  if (hidden) return null;

  const nudge = NUDGES[i];

  return (
    <div className="fixed bottom-20 right-4 z-40 flex items-end gap-2 sm:right-6">
      {open && (
        <div className="mb-3 max-w-[12rem] rounded-2xl rounded-br-sm border border-[#e5dac5] bg-white px-3 py-2 text-xs leading-snug text-[#2b2118] shadow-md">
          {nudge.text}
        </div>
      )}
      <button
        type="button"
        aria-label="Open chat with Wormy"
        onClick={() => router.push('/chat')}
        onMouseEnter={() => setOpen(true)}
        className="drop-shadow-md transition-transform hover:scale-105 active:scale-95"
      >
        <WormyMascot mood={open ? nudge.mood : 'read'} size={72} />
      </button>
    </div>
  );
}
