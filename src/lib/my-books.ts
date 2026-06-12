import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const DEFAULT_PATH = join(process.cwd(), 'data/my-books.json');

export function readMyBooks(path = DEFAULT_PATH): string[] {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8')).assetIds ?? [];
}

function writeMyBooks(assetIds: string[], path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ assetIds }, null, 1));
}

export function addMyBook(assetId: string, path = DEFAULT_PATH): void {
  const ids = readMyBooks(path);
  if (!ids.includes(assetId)) writeMyBooks([...ids, assetId], path);
}

export function removeMyBook(assetId: string, path = DEFAULT_PATH): void {
  writeMyBooks(readMyBooks(path).filter((id) => id !== assetId), path);
}
