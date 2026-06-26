#!/usr/bin/env node
import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const modelsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models');
const GLB_MAGIC = 0x46546c67;

function inspect(buf) {
  if (buf.length < 20 || buf.readUInt32LE(0) !== GLB_MAGIC) return null;
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
    meshNames,
    tris: Math.round(tris),
    anims: json.animations?.length ?? 0,
    cesium: meshNames.some((n) => /cesium/i.test(n)),
  };
}

const files = (await readdir(modelsDir)).filter((f) => f.endsWith('.glb'));
let bad = 0;

console.log('Cricket model validation\n');
for (const file of files.sort()) {
  const info = inspect(await readFile(join(modelsDir, file)));
  if (!info) {
    console.log(`✗ ${file} — not a valid GLB`);
    bad++;
    continue;
  }
  const status = info.cesium ? '✗ PLACEHOLDER (Cesium Man)' : '✓';
  console.log(`${status} ${file} — ${info.tris} tris, ${info.anims} anim(s), meshes: ${info.meshNames.join(', ')}`);
  if (info.cesium) bad++;
}

if (bad > 0) {
  console.log('\nFix: add SKETCHFAB_API_TOKEN to .env then run npm run install:models');
  console.log('Token: https://sketchfab.com/settings/password');
  process.exit(1);
}

console.log('\nAll models OK.');
