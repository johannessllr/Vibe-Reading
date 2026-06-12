'use client';
import Image from 'next/image';

export type WormyMood =
  | 'wave'
  | 'read'
  | 'happy'
  | 'think'
  | 'surprised'
  | 'note'
  | 'idea'
  | 'sleep'
  | 'excited';

export function WormyMascot({
  mood = 'wave',
  size = 64,
  className = '',
}: {
  mood?: WormyMood;
  size?: number;
  className?: string;
}) {
  return (
    <>
      <style>{`@keyframes wormy-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7%)}}`}</style>
      <Image
        src={`/mascot/${mood}.png`}
        alt="Wormy the bookworm"
        width={size}
        height={size}
        priority
        draggable={false}
        className={`select-none [animation:wormy-bob_3.2s_ease-in-out_infinite] ${className}`}
      />
    </>
  );
}
