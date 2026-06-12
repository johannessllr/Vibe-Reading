import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readMyBooks, addMyBook, removeMyBook } from '../src/lib/my-books';

describe('my-books shelf', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'shelf-')), 'my-books.json');

  it('starts empty, adds without duplicates, removes', () => {
    expect(readMyBooks(file)).toEqual([]);
    addMyBook('A', file);
    addMyBook('A', file);
    addMyBook('B', file);
    expect(readMyBooks(file)).toEqual(['A', 'B']);
    removeMyBook('A', file);
    expect(readMyBooks(file)).toEqual(['B']);
  });
});
