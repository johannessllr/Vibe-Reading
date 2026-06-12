import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBooks } from '@/lib/apple-books';
import { BookCover } from '@/components/book-cover';
import { readMyBooks, addMyBook } from '@/lib/my-books';

export const dynamic = 'force-dynamic';

export default function AddBooks() {
  const shelf = new Set(readMyBooks());
  const candidates = getBooks().filter((b) => !shelf.has(b.assetId));

  async function add(formData: FormData) {
    'use server';
    addMyBook(String(formData.get('assetId')));
    revalidatePath('/');
    revalidatePath('/add');
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm">
          <Link href="/" className="text-[#8a7a64]">← Your books</Link>
        </p>
        <h1 className="text-3xl">Add a book</h1>
        <p className="text-sm text-[#5a4a38]">From your Apple Books library</p>
      </header>

      <div className="space-y-3">
        {candidates.map((b) => (
          <Card key={b.assetId} className="bg-white/70 border-[#e5dac5]">
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <div className="flex min-w-0 items-center gap-3">
                <BookCover assetId={b.assetId} title={b.title} size="sm" />
                <div className="min-w-0">
                  <p className="line-clamp-1">{b.title}</p>
                  <p className="text-xs text-[#8a7a64]">
                    by {b.author ?? 'Unknown'} · {Math.round(b.progress * 100)}% read
                  </p>
                </div>
              </div>
              <form action={add}>
                <input type="hidden" name="assetId" value={b.assetId} />
                <Button type="submit" variant="outline">Add</Button>
              </form>
            </CardContent>
          </Card>
        ))}
        {candidates.length === 0 && (
          <p className="text-sm text-[#8a7a64]">Everything is already on your shelf.</p>
        )}
      </div>
    </div>
  );
}
