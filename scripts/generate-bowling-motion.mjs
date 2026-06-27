#!/usr/bin/env node
/**
 * Generate cricket bowling motion via Artificial Studio (Hunyuan Motion).
 * Requires ARTIFICIAL_STUDIO_API_KEY in .env — get key at app.artificialstudio.ai/account/api-keys
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const outPath = join(root, 'public', 'models', 'bowling-delivery.fbx');

const DEFAULT_PROMPT =
  'Cricket fast bowler side view: short run-up, jump at crease, high-arm ball release, follow-through. Athletic male cricketer in whites.';

async function loadApiKey() {
  if (process.env.ARTIFICIAL_STUDIO_API_KEY) return process.env.ARTIFICIAL_STUDIO_API_KEY.trim();
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return null;
  const text = await readFile(envPath, 'utf8');
  const match = text.match(/^ARTIFICIAL_STUDIO_API_KEY=(.+)$/m);
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function main() {
  const apiKey = await loadApiKey();
  if (!apiKey) {
    console.error('Missing ARTIFICIAL_STUDIO_API_KEY in .env');
    console.error('Get a key: https://app.artificialstudio.ai/account/api-keys');
    process.exit(1);
  }

  const prompt = process.argv.slice(2).join(' ').trim() || DEFAULT_PROMPT;
  const duration = Math.min(12, Math.max(0.5, Number(process.env.BOWLING_MOTION_DURATION) || 6));

  console.log('[bowling] Creating motion (duration', duration, 's)...');
  console.log('[bowling] Prompt:', prompt);

  const createRes = await fetch('https://api.artificialstudio.ai/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify({
      tool: 'motion-3d',
      input: { model: 'hunyuan-motion', prompt, duration },
    }),
  });

  const created = await createRes.json();
  if (!createRes.ok || !created.id) {
    console.error('[bowling] API error:', createRes.status, created);
    process.exit(1);
  }

  console.log('[bowling] Job id:', created.id);

  for (let i = 0; i < 90; i++) {
    await sleep(4000);
    const pollRes = await fetch(`https://api.artificialstudio.ai/api/generations/${created.id}`, {
      headers: { Authorization: apiKey },
    });
    const gen = await pollRes.json();
    process.stdout.write(`\r[bowling] Status: ${gen.status} (${i + 1}/90)`);

    if (gen.status === 'success') {
      if (!gen.output) {
        console.error('\n[bowling] Success but no output URL');
        process.exit(1);
      }
      await mkdir(dirname(outPath), { recursive: true });
      await downloadFile(gen.output, outPath);
      console.log('\n[bowling] Saved:', outPath);
      console.log('[bowling] Reload the app to use the new delivery animation.');
      return;
    }

    if (gen.status === 'error') {
      console.error('\n[bowling] Failed:', gen.error ?? gen);
      process.exit(1);
    }
  }

  console.error('\n[bowling] Timed out waiting for generation');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
