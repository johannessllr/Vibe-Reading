// tests/book.test.ts
import { describe, it, expect } from 'vitest';
import { textUpTo, textAfter, type BookData } from '../src/lib/book';

const book: BookData = {
  title: 'T', author: 'A', assetId: 'X',
  chunks: [
    { position: 0.0, text: 'beginning' },
    { position: 0.5, text: 'middle' },
    { position: 0.9, text: 'ending spoiler' },
  ],
};

describe('textUpTo', () => {
  it('includes only chunks at or before current progress', () => {
    const text = textUpTo(book, 0.6);
    expect(text).toContain('beginning');
    expect(text).toContain('middle');
    expect(text).not.toContain('spoiler');
  });

  it('keeps the most recent text when over the char budget', () => {
    const text = textUpTo(book, 0.6, 10); // tiny budget
    expect(text.length).toBeLessThanOrEqual(10);
    expect(text).toContain('dle'); // tail of "middle" survives, start is cut
  });

  it('textAfter returns only the unread remainder (guide mode)', () => {
    const text = textAfter(book, 0.6);
    expect(text).toContain('spoiler');
    expect(text).not.toContain('beginning');
  });
});
