'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Books', icon: '📚' },
  { href: '/flashcards', label: 'Flashcards', icon: '🗂️' },
  { href: '/wormy', label: 'Wormy', icon: '🪱' }, // future: animated Wormy icon
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-[#e5dac5] bg-[#faf6ee]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl">
        {TABS.map((t) => {
          const active =
            t.href === '/'
              ? pathname === '/' || pathname.startsWith('/book') || pathname === '/add'
              : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${
                active ? 'text-[#2b2118] font-semibold' : 'text-[#8a7a64]'
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
