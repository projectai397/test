#!/usr/bin/env node
/**
 * Meshy API helper — https://docs.meshy.ai/en/api/authentication
 * Key: https://www.meshy.ai/settings/api
 *
 * Usage:
 *   node scripts/meshy-api.mjs balance
 *   node scripts/meshy-api.mjs search pitch
 *   node scripts/meshy-api.mjs rig [path/to/character.glb]
 *   node scripts/meshy-api.mjs animate <rig_task_id> <action_id>
 *   node scripts/meshy-api.mjs build-bowler [path/to/character.glb]
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const API = 'https://api.meshy.ai/openapi/v1';
const ANIM_CATALOG = 'https://api.meshy.ai/web/public/animations/resources';

/** Meshy preset IDs — see `node scripts/meshy-api.mjs search pitch` */
const MESHY_BOWLER_ACTIONS = {
  walking: -2,
  running: -1,
  idle: 0,
  baseballPitching: 393,
};

const DEFAULT_CHARACTER = join(
  process.env.USERPROFILE ?? process.env.HOME ?? '',
  'Downloads/Meshy_AI_A_highly_detailed_pho_biped/Meshy_AI_A_highly_detailed_pho_biped/Meshy_AI_A_highly_detailed_pho_biped_Character_output.glb',
);

async function loadApiKey() {
  if (process.env.MESHY_API_KEY) return process.env.MESHY_API_KEY.trim();
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return null;
  const text = await readFile(envPath, 'utf8');
  const match = text.match(/^MESHY_API_KEY=(.+)$/m);
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function meshyFetch(path, { method = 'GET', body } = {}) {
  const apiKey = await loadApiKey();
  if (!apiKey) {
    throw new Error('MESHY_API_KEY missing — add it to .env (https://www.meshy.ai/settings/api)');
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Meshy ${method} ${path} → HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}

async function pollTask(type, taskId, label = taskId) {
  const path = type === 'rigging' ? `/rigging/${taskId}` : `/animations/${taskId}`;
  for (let i = 0; i < 120; i++) {
    const task = await meshyFetch(path);
    const status = task.status;
    const progress = task.progress ?? 0;
    process.stdout.write(`\r[Meshy] ${label}: ${status} ${progress}%   `);
    if (status === 'SUCCEEDED') {
      console.log('');
      return task;
    }
    if (status === 'FAILED' || status === 'CANCELED') {
      console.log('');
      throw new Error(`${label} ${status}: ${task.task_error?.message ?? 'unknown error'}`);
    }
    await sleep(5000);
  }
  throw new Error(`${label} timed out`);
}

async function fileToDataUri(filePath) {
  const buf = await readFile(filePath);
  return `data:model/gltf-binary;base64,${buf.toString('base64')}`;
}

async function downloadFile(url, dest) {
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function fetchAnimationCatalog() {
  const res = await fetch(ANIM_CATALOG);
  const json = await res.json();
  return json.result?.list ?? [];
}

async function cmdBalance() {
  const json = await meshyFetch('/balance');
  console.log('Meshy balance (credits):', json.balance ?? json);
}

async function cmdSearch(needle) {
  const list = await fetchAnimationCatalog();
  const q = (needle ?? '').toLowerCase();
  const hits = list.filter((a) =>
    `${a.name} ${a.key} ${a.category}`.toLowerCase().includes(q),
  );
  console.log(`Found ${hits.length} animations matching "${needle}":\n`);
  for (const a of hits.slice(0, 40)) {
    console.log(`  id ${a.id}\t${a.name} (${a.key})`);
  }
  if (hits.length > 40) console.log(`  … and ${hits.length - 40} more`);
}

async function cmdRig(glbPath) {
  const path = glbPath ?? DEFAULT_CHARACTER;
  if (!existsSync(path)) {
    throw new Error(`GLB not found: ${path}`);
  }
  console.log(`Rigging ${path} …`);
  const model_url = await fileToDataUri(path);
  const created = await meshyFetch('/rigging', {
    method: 'POST',
    body: { model_url, height_meters: 1.78 },
  });
  const taskId = created.result;
  console.log('Rig task:', taskId);
  const task = await pollTask('rigging', taskId, 'rigging');
  console.log(JSON.stringify(task.result, null, 2));
  return task;
}

async function cmdAnimate(rigTaskId, actionId) {
  const created = await meshyFetch('/animations', {
    method: 'POST',
    body: { rig_task_id: rigTaskId, action_id: Number(actionId) },
  });
  const taskId = created.result;
  console.log('Animation task:', taskId, `(action ${actionId})`);
  const task = await pollTask('animation', taskId, `animate:${actionId}`);
  console.log('GLB:', task.result?.animation_glb_url);
  return task;
}

async function cmdBuildBowler(glbPath) {
  const rigTask = await cmdRig(glbPath);
  const rigId = rigTask.id;
  const basic = rigTask.result?.basic_animations ?? {};

  const outDir = join(root, 'public', 'models', 'meshy-generated');
  await mkdir(outDir, { recursive: true });

  if (basic.running_glb_url) {
    const dest = join(outDir, 'running.glb');
    console.log('Downloading basic running …');
    await downloadFile(basic.running_glb_url, dest);
    console.log('Saved', dest);
  }
  if (basic.walking_glb_url) {
    const dest = join(outDir, 'walking.glb');
    console.log('Downloading basic walking …');
    await downloadFile(basic.walking_glb_url, dest);
    console.log('Saved', dest);
  }

  const pitchTask = await cmdAnimate(rigId, MESHY_BOWLER_ACTIONS.baseballPitching);
  if (pitchTask.result?.animation_glb_url) {
    const dest = join(root, 'public', 'models', 'meshy-bowler-pitch.glb');
    await downloadFile(pitchTask.result.animation_glb_url, dest);
    console.log('Saved pitch clip →', dest);
  }

  const manifest = {
    rigTaskId: rigId,
    actions: MESHY_BOWLER_ACTIONS,
    generatedAt: new Date().toISOString(),
    basicAnimations: basic,
    pitchUrl: pitchTask.result?.animation_glb_url ?? null,
  };
  const manifestPath = join(outDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('\nDone. Manifest:', manifestPath);
  console.log('Use public/models/meshy-bowler.glb (merged) or wire separate clips in config.');
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case 'balance':
      await cmdBalance();
      break;
    case 'search':
      await cmdSearch(args.join(' ') || 'pitch');
      break;
    case 'rig':
      await cmdRig(args[0]);
      break;
    case 'animate':
      if (!args[0] || !args[1]) {
        console.error('Usage: meshy-api animate <rig_task_id> <action_id>');
        process.exit(1);
      }
      await cmdAnimate(args[0], args[1]);
      break;
    case 'build-bowler':
      await cmdBuildBowler(args[0]);
      break;
    default:
      console.log(`Meshy API helper

Commands:
  balance              Show credit balance
  search [query]       Search animation library (default: pitch)
  rig [glb]            Rig a character GLB (data URI upload)
  animate <rig> <id>   Apply animation to rigged character
  build-bowler [glb]   Rig + download run/walk/pitch GLBs

Preset action IDs:
  Running: ${MESHY_BOWLER_ACTIONS.running}
  Walking: ${MESHY_BOWLER_ACTIONS.walking}
  Baseball Pitching: ${MESHY_BOWLER_ACTIONS.baseballPitching}

Docs: https://docs.meshy.ai/en/api/authentication
`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
