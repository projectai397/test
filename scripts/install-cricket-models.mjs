#!/usr/bin/env node
/**
 * Download and install cricket-only GLB models (Sketchfab CC-BY, free).
 * Requires SKETCHFAB_API_TOKEN in .env or environment (free at sketchfab.com/settings/password).
 */
import { mkdir, readFile, copyFile, unlink } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { execSync } from 'child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const modelsDir = join(root, 'public', 'models');

/** Cricket-only models — all isDownloadable:true, CC-BY on Sketchfab. */
const CRICKET_MODELS = [
  {
    uid: '9f6f99e3359d452481a7102c1aa17558',
    file: 'cricket-player.glb',
    role: 'bowler / non-striker',
    name: 'Indian Cricket Player - Rigged',
  },
  {
    uid: 'a21f5e7ee14f4b6aa5cf6c94a1016932',
    file: 'cricket-batsman.glb',
    role: 'batter',
    name: 'Virat Kohli Batting Animation (Low Poly)',
  },
  {
    uid: '606d7d6dee2d4f20b18cf99ffd721219',
    file: 'cricket-keeper.glb',
    role: 'wicket keeper',
    name: 'Pose #5 Wicket Keeper Still',
  },
];

/** Paid store model — import manually after purchase (see npm run import:umpire). */
export const STORE_UMPIRE = {
  uid: '85026f7cece84299bf4ddf90d3b0addc',
  url: 'https://sketchfab.com/3d-models/cricket-umpire-85026f7cece84299bf4ddf90d3b0addc',
  file: 'cricket-umpire.glb',
};

const GLB_MAGIC = 0x46546c67;

async function loadEnvToken() {
  if (process.env.SKETCHFAB_API_TOKEN) return process.env.SKETCHFAB_API_TOKEN;
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return null;
  const text = await readFile(envPath, 'utf8');
  const match = text.match(/^SKETCHFAB_API_TOKEN=(.+)$/m);
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null;
}

function isGlbBuffer(buf) {
  return buf.length >= 4 && buf.readUInt32LE(0) === GLB_MAGIC;
}

async function downloadUrl(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
  return readFile(dest);
}

function findGlbInDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findGlbInDir(p);
      if (found) return found;
    } else if (entry.name.endsWith('.glb')) return p;
  }
  return null;
}

async function extractGlbFromZip(zipPath, dest) {
  const tmp = join(modelsDir, '_extract');
  await mkdir(tmp, { recursive: true });
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}' -Force"`,
        { stdio: 'pipe' },
      );
    } else {
      execSync(`unzip -o "${zipPath}" -d "${tmp}"`, { stdio: 'pipe' });
    }
    const glbPath = findGlbInDir(tmp);
    if (!glbPath) throw new Error('No .glb inside zip');
    await copyFile(glbPath, dest);
  } finally {
    try {
      execSync(process.platform === 'win32' ? `rmdir /s /q "${tmp}"` : `rm -rf "${tmp}"`, {
        stdio: 'pipe',
      });
    } catch {
      /* ignore */
    }
  }
}

async function sketchfabDownload(uid, dest, token) {
  const metaRes = await fetch(`https://api.sketchfab.com/v3/models/${uid}`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!metaRes.ok) throw new Error(`meta ${metaRes.status}`);
  const meta = await metaRes.json();
  if (!meta.isDownloadable) throw new Error('not downloadable');

  const dlRes = await fetch(`https://api.sketchfab.com/v3/models/${uid}/download`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!dlRes.ok) throw new Error(`download ${dlRes.status}`);

  const dl = await dlRes.json();
  const glbUrl = dl.glb?.url;
  const gltfUrl = dl.gltf?.url;

  if (glbUrl) {
    const buf = await downloadUrl(glbUrl, dest);
    if (!isGlbBuffer(buf)) throw new Error('not a valid GLB');
    return meta.name;
  }

  if (gltfUrl) {
    const zipPath = `${dest}.zip`;
    await downloadUrl(gltfUrl, zipPath);
    await extractGlbFromZip(zipPath, dest);
    await unlink(zipPath).catch(() => {});
    const buf = await readFile(dest);
    if (!isGlbBuffer(buf)) throw new Error('invalid GLB after zip extract');
    return meta.name;
  }

  throw new Error('no glb/gltf in download response');
}

function inspectGlbBuffer(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
  const meshNames = (json.meshes ?? []).map((m) => m.name ?? '');
  let tris = 0;
  for (const m of json.meshes ?? []) {
    for (const p of m.primitives ?? []) {
      const acc = json.accessors?.[p.indices];
      if (acc?.count) tris += acc.count / 3;
    }
  }
  return {
    anims: json.animations?.length ?? 0,
    skins: json.skins?.length ?? 0,
    kb: Math.round(buf.length / 1024),
    tris: Math.round(tris),
    meshNames,
    isCesium: meshNames.some((n) => /cesium/i.test(n)),
  };
}

async function inspectGlb(path) {
  return inspectGlbBuffer(await readFile(path));
}

function isValidCricketGlb(buf, role) {
  if (!isGlbBuffer(buf)) return false;
  const info = inspectGlbBuffer(buf);
  if (info.isCesium) return false;
  const minTris = role === 'batter' ? 3000 : 8000;
  return info.tris >= minTris;
}

await mkdir(modelsDir, { recursive: true });

const token = await loadEnvToken();
console.log('Cricket model installer\n');

if (!token) {
  console.error('Missing SKETCHFAB_API_TOKEN.');
  console.error('1. Create free account: https://sketchfab.com/signup');
  console.error('2. Get API token: https://sketchfab.com/settings/password');
  console.error('3. Add to .env: SKETCHFAB_API_TOKEN=your_token_here');
  console.error('4. Re-run: npm run install:models\n');

  const playerPath = join(modelsDir, 'cricket-player.glb');
  if (existsSync(playerPath)) {
    const info = inspectGlbBuffer(await readFile(playerPath));
    if (info.isCesium) {
      console.error('✗ cricket-player.glb is Cesium Man placeholder — NOT a cricket model.');
      console.error('  Delete it and run install:models with a Sketchfab token.\n');
    } else {
      console.log(`Existing cricket-player.glb looks valid (${info.tris} tris).\n`);
    }
  }
  process.exit(1);
}

console.log('Downloading cricket models from Sketchfab…\n');
let ok = 0;

for (const model of CRICKET_MODELS) {
  const dest = join(modelsDir, model.file);
  try {
    const name = await sketchfabDownload(model.uid, dest, token);
    const buf = await readFile(dest);
    if (!isValidCricketGlb(buf, model.role)) {
      throw new Error('downloaded file is not a valid cricket GLB (placeholder or too low-poly)');
    }
    const info = inspectGlbBuffer(buf);
    console.log(`✓ ${model.file}`);
    console.log(`    ${name}`);
    console.log(`    ${info.kb} KB · ${info.tris} tris · ${info.anims} anim(s) · ${model.role}\n`);
    ok++;
  } catch (err) {
    console.warn(`✗ ${model.file} — ${err.message}\n`);
  }
}

const player = join(modelsDir, 'cricket-player.glb');
if (existsSync(player)) {
  console.log(`\nBowler & non-striker use ${player}`);
}

console.log(`\nInstalled ${ok}/${CRICKET_MODELS.length} cricket models.`);
console.log('\nUmpire (free): uses cricket-player.glb + white hat & black coat in scene.');
console.log('Paid upgrade (optional):', STORE_UMPIRE.url);
console.log('  npm run install:umpire -- "path/to/purchased.glb"');
