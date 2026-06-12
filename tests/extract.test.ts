// tests/extract.test.ts
import { describe, it, expect } from 'vitest';
import { stripHtml, buildChunks } from '../src/lib/extract';

describe('stripHtml', () => {
  it('removes tags, scripts, and entities', () => {
    const html = '<p>Hello <b>world</b>&nbsp;&amp; more</p><style>p{}</style>';
    expect(stripHtml(html)).toBe('Hello world & more');
  });
});

describe('buildChunks', () => {
  it('chunks words and assigns increasing position fractions', () => {
    const words = Array.from({ length: 250 }, (_, i) => `w${i}`).join(' ');
    const chunks = buildChunks(words, 100); // 100 words per chunk → 3 chunks
    expect(chunks).toHaveLength(3);
    expect(chunks[0].position).toBe(0);
    expect(chunks[1].position).toBeCloseTo(100 / 250);
    expect(chunks[2].position).toBeCloseTo(200 / 250);
    expect(chunks[2].text.split(' ')).toHaveLength(50);
  });
});
