export interface BookChunk {
  position: number; // fraction 0..1 where this chunk starts
  text: string;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;|&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildChunks(fullText: string, wordsPerChunk = 1200): BookChunk[] {
  const words = fullText.split(' ').filter(Boolean);
  const chunks: BookChunk[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push({
      position: i / words.length,
      text: words.slice(i, i + wordsPerChunk).join(' '),
    });
  }
  return chunks;
}

/** Parse content.opf: manifest id→href map, then spine idrefs → ordered hrefs. */
export function spineHrefs(opfXml: string): string[] {
  const hrefById = new Map<string, string>();
  for (const m of opfXml.matchAll(/<item\s[^>]*>/g)) {
    const tag = m[0];
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    const href = tag.match(/\bhref="([^"]+)"/)?.[1];
    if (id && href && /x?html?/.test(href)) hrefById.set(id, href);
  }
  const refs: string[] = [];
  for (const m of opfXml.matchAll(/<itemref\s[^>]*idref="([^"]+)"/g)) {
    const href = hrefById.get(m[1]);
    if (href) refs.push(href);
  }
  return refs;
}
