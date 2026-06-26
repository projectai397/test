#!/usr/bin/env node
/**
 * Install the paid Cricket Umpire GLB (trish.j2109) after purchase.
 * https://sketchfab.com/3d-models/cricket-umpire-85026f7cece84299bf4ddf90d3b0addc
 *
 * Usage:
 *   npm run install:umpire -- "C:\Downloads\Cricket Umpire.glb"
 *   npm run install:umpire -- ./my-umpire.glb
 */
import { copyFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const STORE_UID = '85026f7cece84299bf4ddf90d3b0addc';
const STORE_URL =
  'https://sketchfab.com/3d-models/cricket-umpire-85026f7cece84299bf4ddf90d3b0addc';

const __dir = dirname(fileURLToPath(import.meta.url));
const dest = join(__dir, '..', 'public', 'models', 'cricket-umpire.glb');
const GLB_MAGIC = 0x46546c67;

function inspect(buf) {
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
    tris: Math.round(tris),
    anims: json.animations?.length ?? 0,
    meshNames,
    cesium: meshNames.some((n) => /cesium/i.test(n)),
  };
}

const srcArg = process.argv[2];
if (!srcArg) {
  console.error('Cricket Umpire (Fab Store) — manual install\n');
  console.error(`Model: ${STORE_URL}`);
  console.error(`UID:   ${STORE_UID}`);
  console.error('\nThis model is paid (~$50) and cannot be downloaded via API.');
  console.error('1. Purchase & download GLB from your Fab / Sketchfab account');
  console.error('2. Run: npm run install:umpire -- "path/to/your-umpire.glb"\n');
  process.exit(1);
}

const src = resolve(srcArg);
if (!existsSync(src)) {
  console.error(`File not found: ${src}`);
  process.exit(1);
}

const buf = await readFile(src);
if (buf.length < 4 || buf.readUInt32LE(0) !== GLB_MAGIC) {
  console.error('Not a valid GLB file.');
  process.exit(1);
}

const info = inspect(buf);
if (info.cesium) {
  console.error('Refusing Cesium Man placeholder.');
  process.exit(1);
}

await mkdir(dirname(dest), { recursive: true });
await copyFile(src, dest);

console.log('✓ cricket-umpire.glb installed');
console.log(`  ${Math.round(buf.length / 1024)} KB · ${info.tris} tris · ${info.anims} anim(s)`);
console.log(`  meshes: ${info.meshNames.slice(0, 5).join(', ')}${info.meshNames.length > 5 ? '…' : ''}`);
console.log('\nRefresh the browser to see the new umpire.');
