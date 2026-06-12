import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, basename } from 'node:path';

const CONTAINER = join(
  homedir(),
  'Library/Containers/com.apple.iBooksX/Data/Documents',
);

export interface LibraryBook {
  title: string;
  author: string | null;
  progress: number; // 0..1
  assetId: string;
  path: string | null;
}

export interface Highlight {
  text: string;
  note: string | null;
  chapter: string | null;
  createdAt: number | null;
}

/** Filename has a version suffix that varies per machine — find it by prefix. */
function findDb(dir: string, prefix: string): string {
  const file = readdirSync(dir).find(
    (f) => f.startsWith(prefix) && f.endsWith('.sqlite'),
  );
  if (!file) throw new Error(`No ${prefix}*.sqlite in ${dir}`);
  return join(dir, file);
}

/** Apple Books keeps these DBs open with WAL journaling — read a snapshot copy. */
function openSnapshot(dbPath: string): DatabaseSync {
  const tmp = mkdtempSync(join(tmpdir(), 'vibe-db-'));
  const dest = join(tmp, basename(dbPath));
  copyFileSync(dbPath, dest);
  for (const ext of ['-wal', '-shm']) {
    if (existsSync(dbPath + ext)) copyFileSync(dbPath + ext, dest + ext);
  }
  return new DatabaseSync(dest);
}

export function getBooks(
  dbPath = findDb(join(CONTAINER, 'BKLibrary'), 'BKLibrary'),
): LibraryBook[] {
  const db = openSnapshot(dbPath);
  try {
    return db
      .prepare(
        `SELECT ZTITLE title, ZAUTHOR author, ZREADINGPROGRESS progress,
                ZASSETID assetId, ZPATH path
         FROM ZBKLIBRARYASSET
         WHERE ZTITLE IS NOT NULL
         ORDER BY ZLASTOPENDATE DESC`,
      )
      .all() as unknown as LibraryBook[];
  } finally {
    db.close();
  }
}

export function getHighlights(
  assetId: string,
  dbPath = findDb(join(CONTAINER, 'AEAnnotation'), 'AEAnnotation'),
): Highlight[] {
  const db = openSnapshot(dbPath);
  try {
    return db
      .prepare(
        `SELECT ZANNOTATIONSELECTEDTEXT text, ZANNOTATIONNOTE note,
                ZFUTUREPROOFING5 chapter, ZANNOTATIONCREATIONDATE createdAt
         FROM ZAEANNOTATION
         WHERE ZANNOTATIONASSETID = ?
           AND ZANNOTATIONSELECTEDTEXT IS NOT NULL
           AND ZANNOTATIONDELETED = 0
         ORDER BY ZANNOTATIONCREATIONDATE ASC`,
      )
      .all(assetId) as unknown as Highlight[];
  } finally {
    db.close();
  }
}
