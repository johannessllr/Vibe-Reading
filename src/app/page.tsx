import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Greeting } from '@/components/greeting';
import { getBooks } from '@/lib/apple-books';
import { readMyBooks } from '@/lib/my-books';

export const dynamic = 'force-dynamic'; // re-read Apple Books on every load

// TODO(#4): once the book loader is merged, detect the demo book via
// loadBook().assetId instead of this title match.
const isDemoBook = (title: string) => title.toLowerCase().includes('vibe coding');

export default function Library() {
  const shelf = new Set(readMyBooks());
  const books = getBooks().filter((b) => shelf.has(b.assetId));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl">Your books</h1>
        <Greeting />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {books.map((b) => {
          const pct = Math.round(b.progress * 100);
          return (
            <Link key={b.assetId} href={`/book/${b.assetId}`}>
              <Card className="h-full bg-white/70 border-[#e5dac5] transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between gap-2 text-lg">
                    <span className="line-clamp-2">{b.title}</span>
                    {isDemoBook(b.title) && <Badge>Wormy ready</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-[#5a4a38]">by {b.author ?? 'Unknown'}</p>
                  <Progress value={pct} />
                  <p className="text-xs text-[#8a7a64]">{pct}% read</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        <Link href="/add">
          <Card className="flex h-full min-h-36 items-center justify-center border-dashed bg-white/40 border-[#e5dac5] transition hover:bg-white/70">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl">+</p>
              <p className="text-sm text-[#8a7a64]">Add a book</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      <p className="text-xs text-[#8a7a64]">Synced live from Apple Books</p>
    </div>
  );
}
