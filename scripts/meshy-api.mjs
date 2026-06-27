#!/usr/bin/env node
/**
 * Meshy API helper — https://docs.meshy.ai/en/api/authentication
 * Key: https://www.meshy.ai/settings/api
 *
 * Usage:
 *   node scripts/meshy-api.mjs balance
 *   node scripts/meshy-api.mjs search pitch
 *   node scripts/meshy-api.mjs retexture [glb] "<prompt>"
 *   node scripts/meshy-api.mjs rig [path/to/character.glb]
 *   node scripts/meshy-api.mjs animate <rig_task_id> <action_id>
 *   node scripts/meshy-api.mjs build-bowler [path/to/character.glb]
 *   node scripts/meshy-api.mjs kit-bowler [path/to/source.glb]
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { mergeMeshyGlbs } from './merge-meshy-glb.mjs';

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

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const HEX_TO_NAME = {
  '#dc2626': 'red',
  '#2563eb': 'blue',
  '#16a34a': 'green',
  '#eab308': 'yellow',
  '#9333ea': 'purple',
  '#ffffff': 'white',
  '#1a1a1a': 'black',
  '#f97316': 'orange',
};

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

function pollPathForType(type) {
  switch (type) {
    case 'rigging':
      return (id) => `/rigging/${id}`;
    case 'retexture':
      return (id) => `/retexture/${id}`;
    case 'animation':
    default:
      return (id) => `/animations/${id}`;
  }
}

async function pollTask(type, taskId, label = taskId) {
  const pathFn = pollPathForType(type);
  for (let i = 0; i < 120; i++) {
    const task = await meshyFetch(pathFn(taskId));
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
  return `data:application/octet-stream;base64,${buf.toString('base64')}`;
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

function resolveKitColor(teamKitColor, playerKitColor) {
  return playerKitColor ?? teamKitColor;
}

function trouserColorFromKit(kitHex) {
  const h = kitHex.replace('#', '');
  if (h.length !== 6) return '#1a1a1a';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum < 0.25) return '#1a1a1a';
  const f = 0.32;
  const to = (n) => Math.round(n * f).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function resolveTrouserColor(teamKitColor, teamTrouserColor, playerKitColor) {
  if (teamTrouserColor) return teamTrouserColor;
  return trouserColorFromKit(playerKitColor ?? teamKitColor);
}

function hexToPromptName(hex) {
  return HEX_TO_NAME[hex.toLowerCase()] ?? hex;
}

function kitHash(shirtHex, trouserHex) {
  return `${shirtHex.replace('#', '').toLowerCase()}-${trouserHex.replace('#', '').toLowerCase()}`;
}

function buildKitPrompt(shirtHex, trouserHex) {
  const shirt = hexToPromptName(shirtHex);
  const trousers = hexToPromptName(trouserHex);
  return (
    `realistic male cricket player, ${shirt} short-sleeve cricket jersey, ` +
    `${trousers} cricket trousers, white athletic shoes, natural skin tone and hair, ` +
    `photorealistic sports kit, no logos`
  );
}

async function loadMatchConfig() {
  const configPath = join(root, 'config.json');
  const raw = JSON.parse(await readFile(configPath, 'utf8'));
  const teamA = raw.teams?.teamA;
  if (!teamA) throw new Error('config.json: teams.teamA missing');
  const kitColor = teamA.kitColor;
  const trouserColor = teamA.trouserColor;
  const bowlerKit = teamA.bowler?.kitColor;
  if (!HEX_COLOR.test(kitColor)) throw new Error('config.json: teams.teamA.kitColor invalid');
  const shirt = resolveKitColor(kitColor, bowlerKit);
  const trousers = resolveTrouserColor(
    kitColor,
    typeof trouserColor === 'string' && HEX_COLOR.test(trouserColor) ? trouserColor : undefined,
    bowlerKit,
  );
  return { shirt, trousers, teamA };
}

async function cmdBalance() {
  const json = await meshyFetch('/balance');
  console.log('Meshy balance (credits):', json.balance ?? json);
  return json.balance ?? 0;
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

async function cmdRetexture(glbPath, prompt, { quiet = false } = {}) {
  const path = glbPath ?? DEFAULT_CHARACTER;
  if (!existsSync(path)) {
    throw new Error(`GLB not found: ${path}`);
  }
  if (!prompt?.trim()) {
    throw new Error('Retexture requires a text_style_prompt');
  }
  if (!quiet) console.log(`Retexturing ${path} …`);
  const model_url = await fileToDataUri(path);
  const created = await meshyFetch('/retexture', {
    method: 'POST',
    body: {
      model_url,
      text_style_prompt: prompt.trim(),
      ai_model: 'latest',
      enable_original_uv: true,
      remove_lighting: true,
      target_formats: ['glb'],
    },
  });
  const taskId = created.result;
  if (!quiet) console.log('Retexture task:', taskId);
  const task = await pollTask('retexture', taskId, 'retexture');
  const glbUrl = task.model_urls?.glb;
  if (!glbUrl) throw new Error('Retexture succeeded but no GLB URL in response');
  return { task, glbUrl, taskId };
}

async function cmdRig(glbPath, { quiet = false } = {}) {
  const path = glbPath ?? DEFAULT_CHARACTER;
  if (!existsSync(path)) {
    throw new Error(`GLB not found: ${path}`);
  }
  if (!quiet) console.log(`Rigging ${path} …`);
  const model_url = await fileToDataUri(path);
  const created = await meshyFetch('/rigging', {
    method: 'POST',
    body: { model_url, height_meters: 1.78 },
  });
  const taskId = created.result;
  if (!quiet) console.log('Rig task:', taskId);
  const task = await pollTask('rigging', taskId, 'rigging');
  if (!quiet) console.log(JSON.stringify(task.result, null, 2));
  return task;
}

async function cmdAnimate(rigTaskId, actionId, { quiet = false } = {}) {
  const created = await meshyFetch('/animations', {
    method: 'POST',
    body: { rig_task_id: rigTaskId, action_id: Number(actionId) },
  });
  const taskId = created.result;
  if (!quiet) console.log('Animation task:', taskId, `(action ${actionId})`);
  const task = await pollTask('animation', taskId, `animate:${actionId}`);
  if (!quiet) console.log('GLB:', task.result?.animation_glb_url);
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

async function cmdKitBowler(sourceGlbPath) {
  const sourcePath = sourceGlbPath ?? DEFAULT_CHARACTER;
  if (!existsSync(sourcePath)) {
    throw new Error(
      `Source GLB not found: ${sourcePath}\n` +
        'Pass a path: node scripts/meshy-api.mjs kit-bowler path/to/character.glb',
    );
  }

  const balance = await cmdBalance();
  if (balance < 24) {
    console.warn(`Warning: balance ${balance} may be insufficient (~24 credits per kit variant)`);
  }

  const { shirt, trousers } = await loadMatchConfig();
  const hash = kitHash(shirt, trousers);
  const prompt = buildKitPrompt(shirt, trousers);

  console.log('\nKit colours:', { shirt, trousers, hash });
  console.log('Prompt:', prompt);
  console.log('Source:', sourcePath);

  const outDir = join(root, 'public', 'models', 'meshy-generated');
  const modelsDir = join(root, 'public', 'models');
  await mkdir(outDir, { recursive: true });

  const retexturedPath = join(outDir, `retextured-${hash}.glb`);
  const runningPath = join(outDir, `running-${hash}.glb`);
  const walkingPath = join(outDir, `walking-${hash}.glb`);
  const pitchPath = join(outDir, `pitch-${hash}.glb`);
  const outputRel = `/models/meshy-bowler-${hash}.glb`;
  const outputPath = join(modelsDir, `meshy-bowler-${hash}.glb`);

  console.log('\n[1/5] Retexture (10 credits) …');
  const { glbUrl: retextureUrl } = await cmdRetexture(sourcePath, prompt, { quiet: true });
  await downloadFile(retextureUrl, retexturedPath);
  console.log('Saved', retexturedPath);

  console.log('\n[2/5] Rig (5 credits) …');
  const rigTask = await cmdRig(retexturedPath, { quiet: true });
  const rigId = rigTask.id;
  const basic = rigTask.result?.basic_animations ?? {};

  if (!basic.running_glb_url || !basic.walking_glb_url) {
    throw new Error('Rig task missing basic running/walking GLB URLs');
  }

  console.log('\n[3/5] Download run + walk …');
  await downloadFile(basic.running_glb_url, runningPath);
  await downloadFile(basic.walking_glb_url, walkingPath);
  console.log('Saved', runningPath, walkingPath);

  console.log('\n[4/5] Animate pitch (3 credits) …');
  const pitchTask = await cmdAnimate(rigId, MESHY_BOWLER_ACTIONS.baseballPitching, { quiet: true });
  const pitchUrl = pitchTask.result?.animation_glb_url;
  if (!pitchUrl) throw new Error('Pitch animation task missing GLB URL');
  await downloadFile(pitchUrl, pitchPath);
  console.log('Saved', pitchPath);

  console.log('\n[5/5] Merge clips …');
  await mergeMeshyGlbs(runningPath, walkingPath, pitchPath, outputPath);
  console.log('Saved', outputPath);

  const manifest = {
    sourceGlb: sourcePath,
    rigTaskId: rigId,
    kitColors: { shirt, trousers },
    kitHash: hash,
    outputUrl: outputRel,
    prompt,
    generatedAt: new Date().toISOString(),
    actions: MESHY_BOWLER_ACTIONS,
    files: {
      retextured: retexturedPath,
      running: runningPath,
      walking: walkingPath,
      pitch: pitchPath,
      merged: outputPath,
    },
  };
  const manifestPath = join(outDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  const kitManifestPath = join(modelsDir, 'meshy-kit-manifest.json');
  let kitManifest = { variants: [] };
  if (existsSync(kitManifestPath)) {
    try {
      kitManifest = JSON.parse(await readFile(kitManifestPath, 'utf8'));
    } catch {
      kitManifest = { variants: [] };
    }
  }
  const existing = kitManifest.variants.filter((v) => v.kitHash !== hash);
  existing.push({
    kitHash: hash,
    shirt,
    trousers,
    modelUrl: outputRel,
    generatedAt: manifest.generatedAt,
  });
  kitManifest.variants = existing;
  kitManifest.defaultBowlerUrl = outputRel;
  await writeFile(kitManifestPath, JSON.stringify(kitManifest, null, 2));

  console.log('\nDone.');
  console.log('  Merged GLB:', outputPath);
  console.log('  Manifest:', manifestPath);
  console.log('  Kit manifest:', kitManifestPath);
  console.log('  App URL:', outputRel);
  console.log('\nRefresh the app — bowler loads this GLB when kit colours match config.json.');
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
    case 'retexture': {
      const glb = args[0]?.endsWith('.glb') ? args.shift() : undefined;
      const prompt = args.join(' ');
      if (!prompt) {
        console.error('Usage: meshy-api retexture [glb] "<prompt>"');
        process.exit(1);
      }
      const { glbUrl } = await cmdRetexture(glb, prompt);
      console.log('GLB URL:', glbUrl);
      break;
    }
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
    case 'kit-bowler':
      await cmdKitBowler(args[0]);
      break;
    default:
      console.log(`Meshy API helper

Commands:
  balance              Show credit balance
  search [query]       Search animation library (default: pitch)
  retexture [glb] "<prompt>"  Retexture a GLB with AI (10 credits)
  rig [glb]            Rig a character GLB (data URI upload)
  animate <rig> <id>   Apply animation to rigged character
  build-bowler [glb]   Rig + download run/walk/pitch GLBs
  kit-bowler [glb]     Retexture + rig + animate + merge from config.json (~24 credits)

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
