#!/usr/bin/env node
/**
 * Downloads free rigged 3D human models for the cricket scene.
 *
 * Default: soldier.glb — Mixamo human from Three.js examples (Idle / Walk / Run)
 *
 * Optional cricket-specific player (CC Attribution, manual download):
 * 1. https://sketchfab.com/3d-models/indian-cricket-player-rigged-9f6f99e3359d452481a7102c1aa17558
 * 2. Download as GLB → public/models/cricket-player-custom.glb
 * 3. <Cricket3DLiveScene playerModelUrl="/models/cricket-player-custom.glb" />
 */
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const modelsDir = join(__dir, '..', 'public', 'models');

const ASSETS = [
  {
    name: 'soldier.glb',
    url: 'https://threejs.org/examples/models/gltf/Soldier.glb',
    desc: 'Mixamo Soldier — Idle, Walk, Run (default player)',
  },
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`✓ ${dest} (${(buf.length / 1024).toFixed(0)} KB)`);
}

await mkdir(modelsDir, { recursive: true });

for (const asset of ASSETS) {
  const dest = join(modelsDir, asset.name);
  if (existsSync(dest)) {
    console.log(`• ${asset.name} already exists — skip`);
    continue;
  }
  console.log(`Downloading ${asset.desc}...`);
  await download(asset.url, dest);
}

console.log('\nOptional — Indian Cricket Player (Sketchfab, CC Attribution):');
console.log('  Save GLB as public/models/cricket-player-custom.glb');
console.log('  Then pass playerModelUrl="/models/cricket-player-custom.glb"\n');
