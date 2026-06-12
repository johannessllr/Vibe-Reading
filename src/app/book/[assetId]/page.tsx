import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getBooks, getHighlights } from '@/lib/apple-books';

export const dynamic = 'force-dynamic';

// TODO(#4): detect via loadBook().assetId once the book loader is merged.
const isDemoBook = (title: string) => title.toLowerCase().includes('vibe coding');

export default async function BookDetail({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const book = getBooks().find((b) => b.assetId === assetId);
  if (!book) notFound();

  const pct = Math.round(book.progress * 100);
  const highlightCount = getHighlights(assetId).length;
  const hasText = isDemoBook(book.title);

  const actions = [
    { href: '/chat', title: 'Chat with Wormy', desc: 'Talk about the book — Wormy knows where you are' },
    { href: '/quiz', title: 'Quiz', desc: 'Adaptive questions that grow with you' },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm">
          <Link href="/" className="text-[#8a7a64]">← Your books</Link>
        </p>
        <h1 className="text-3xl">{book.title}</h1>
        <p className="text-sm text-[#5a4a38]">by {book.author ?? 'Unknown'}</p>
      </header>

      <Card className="bg-white/70 border-[#e5dac5]">
        <CardContent className="space-y-2 pt-6">
          <Progress value={pct} />
          <p className="text-xs text-[#8a7a64]">
            {pct}% read · {highlightCount} highlights · synced from Apple Books
          </p>
        </CardContent>
      </Card>

      {hasText ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {actions.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="h-full bg-white/70 border-[#e5dac5] transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle>{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#5a4a38]">{a.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="bg-white/40 border-dashed border-[#e5dac5]">
          <CardContent className="pt-6">
            <p className="text-sm text-[#8a7a64]">
              Wormy hasn&rsquo;t read this one yet — chat and quiz need the book
              text (run the extraction script for DRM-free books). Your
              highlights still feed the shared flashcard deck.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
