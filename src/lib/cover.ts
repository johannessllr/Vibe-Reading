// src/lib/cover.ts
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export interface CoverFile {
  path: string;
  mime: string;
}

/**
 * Find the cover image inside an unpacked EPUB folder (Apple Books stores
 * sideloaded EPUBs unzipped). Follows the standard chain:
 * META-INF/container.xml -> OPF manifest -> cover item (EPUB 3
 * properties="cover-image", or EPUB 2 <meta name="cover"> indirection).
 * Returns null for anything that can't yield a cover (DRM'd books with no
 * path, PDFs, malformed EPUBs) — callers fall back to a placeholder.
 */
export function findCoverPath(bookPath: string | null): CoverFile | null {
  try {
    if (!bookPath || !existsSync(bookPath) || !statSync(bookPath).isDirectory()) {
      return null;
    }
    const container = readFileSync(join(bookPath, 'META-INF', 'container.xml'), 'utf8');
    const opfRel = container.match(/full-path="([^"]+)"/)?.[1];
    if (!opfRel) return null;
    const opfPath = join(bookPath, opfRel);
    const opf = readFileSync(opfPath, 'utf8');

    let href = opf
      .match(/<item[^>]*properties="[^"]*cover-image[^"]*"[^>]*>/i)?.[0]
      ?.match(/href="([^"]+)"/)?.[1];

    if (!href) {
      const coverId =
        opf.match(/<meta[^>]*name="cover"[^>]*content="([^"]+)"/i)?.[1] ??
        opf.match(/<meta[^>]*content="([^"]+)"[^>]*name="cover"/i)?.[1];
      if (coverId) {
        const escaped = coverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        href = opf
          .match(new RegExp(`<item[^>]*id="${escaped}"[^>]*>`, 'i'))?.[0]
          ?.match(/href="([^"]+)"/)?.[1];
      }
    }
    if (!href) return null;

    const imgPath = join(dirname(opfPath), decodeURIComponent(href));
    const mime = MIME[extname(imgPath).toLowerCase()];
    if (!mime || !existsSync(imgPath)) return null;
    return { path: imgPath, mime };
  } catch {
    return null;
  }
}
