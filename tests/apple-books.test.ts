// tests/apple-books.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getBooks, getHighlights } from '../src/lib/apple-books';

let libDb: string;
let annDb: string;

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), 'vibe-fixture-'));
  libDb = join(dir, 'BKLibrary-test.sqlite');
  const lib = new DatabaseSync(libDb);
  lib.exec(`CREATE TABLE ZBKLIBRARYASSET (
    ZTITLE TEXT, ZAUTHOR TEXT, ZREADINGPROGRESS REAL,
    ZASSETID TEXT, ZPATH TEXT, ZLASTOPENDATE REAL)`);
  lib.prepare(`INSERT INTO ZBKLIBRARYASSET VALUES (?,?,?,?,?,?)`)
    .run('Vibe Coding', 'Gene Kim', 0.42, 'ASSET1', '/tmp/x.epub', 700000000);
  lib.prepare(`INSERT INTO ZBKLIBRARYASSET VALUES (?,?,?,?,?,?)`)
    .run(null, null, 0, 'GHOST', null, null); // titleless rows must be filtered out
  lib.close();

  annDb = join(dir, 'AEAnnotation-test.sqlite');
  const ann = new DatabaseSync(annDb);
  ann.exec(`CREATE TABLE ZAEANNOTATION (
    ZANNOTATIONASSETID TEXT, ZANNOTATIONSELECTEDTEXT TEXT,
    ZANNOTATIONNOTE TEXT, ZFUTUREPROOFING5 TEXT,
    ZANNOTATIONCREATIONDATE REAL, ZANNOTATIONDELETED INTEGER)`);
  ann.prepare(`INSERT INTO ZAEANNOTATION VALUES (?,?,?,?,?,?)`)
    .run('ASSET1', 'highlighted sentence', 'my note', 'Chapter 3', 700000001, 0);
  ann.prepare(`INSERT INTO ZAEANNOTATION VALUES (?,?,?,?,?,?)`)
    .run('ASSET1', 'deleted one', null, null, 700000002, 1); // deleted → excluded
  ann.close();
});

describe('getBooks', () => {
  it('returns titled books with progress, newest first', () => {
    const books = getBooks(libDb);
    expect(books).toHaveLength(1);
    expect(books[0]).toMatchObject({
      title: 'Vibe Coding', author: 'Gene Kim', progress: 0.42, assetId: 'ASSET1',
    });
  });
});

describe('getHighlights', () => {
  it('returns non-deleted highlights for an asset', () => {
    const hs = getHighlights('ASSET1', annDb);
    expect(hs).toHaveLength(1);
    expect(hs[0].text).toBe('highlighted sentence');
    expect(hs[0].note).toBe('my note');
    expect(hs[0].chapter).toBe('Chapter 3');
  });
});
