import { createAnthropic } from '@ai-sdk/anthropic';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// A shell-level ANTHROPIC_BASE_URL set without the /v1 suffix makes the SDK
// hit .../messages and 404. Normalize so the versioned endpoint is always used.
const rawBase = (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com/v1').replace(/\/+$/, '');
const baseURL = rawBase.endsWith('/v1') ? rawBase : `${rawBase}/v1`;

// A shell var that is set-but-empty stops Next.js from loading .env.local, so
// fall back to reading the key from the file directly.
function resolveApiKey(): string | undefined {
  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return undefined;
  const line = readFileSync(path, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('ANTHROPIC_API_KEY='));
  return line?.slice('ANTHROPIC_API_KEY='.length).trim() || undefined;
}

export const model = createAnthropic({ baseURL, apiKey: resolveApiKey() })('claude-sonnet-4-6');
