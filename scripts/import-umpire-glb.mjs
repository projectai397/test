#!/usr/bin/env node
/**
 * Import a manually downloaded GLB as the cricket umpire.
 * Use after purchasing from Sketchfab Store:
 * https://sketchfab.com/3d-models/cricket-umpire-85026f7cece84299bf4ddf90d3b0addc
 *
 * Usage: npm run import:umpire -- "C:/Downloads/CricketUmpire.glb"
 */
import { copyFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const dest = join(__dir, '..', 'public', 'models', 'cricket-umpire.glb');
const GLB_MAGIC = 0x46546c67;

const src = process.argv[2];
if (!src) {
  console.error('Usage: npm run import:umpire -- <path-to-umpire.glb>');
  console.error('\nPurchase & download GLB from:');
  console.error('https://sketchfab.com/3d-models/cricket-umpire-85026f7cece84299bf4ddf90d3b0addc');
  process.exit(1);
}

const abs = resolve(src);
if (!existsSync(abs)) {
  console.error(`File not found: ${abs}`);
  process.exit(1);
}

const buf = await readFile(abs);
if (buf.length < 4 || buf.readUInt32LE(0) !== GLB_MAGIC) {
  console.error('Not a valid GLB file.');
  process.exit(1);
}

const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
const meshNames = (json.meshes ?? []).map((m) => m.name ?? '');
if (meshNames.some((n) => /cesium/i.test(n))) {
  console.error('Refusing placeholder Cesium Man file.');
  process.exit(1);
}

await mkdir(dirname(dest), { recursive: true });
await copyFile(abs, dest);

let tris = 0;
for (const m of json.meshes ?? []) {
  for (const p of m.primitives ?? []) {
    const acc = json.accessors?.[p.indices];
    if (acc?.count) tris += acc.count / 3;
  }
}

console.log(`✓ cricket-umpire.glb ← ${abs}`);
console.log(`  ${Math.round(buf.length / 1024)} KB · ${Math.round(tris)} tris · ${json.animations?.length ?? 0} anim(s)`);
console.log('\nRefresh the browser to see the new umpire.');
