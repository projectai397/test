#!/usr/bin/env node
/** Quick GLB inspector — bones, animations, mesh names. */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/inspect-glb.mjs public/models/cricketer-walk.glb');
  process.exit(1);
}

const buf = readFileSync(file);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());

const nodes = json.nodes ?? [];
const skins = json.skins ?? [];
const anims = json.animations ?? [];

console.log(`\n${file}`);
console.log(`nodes: ${nodes.length}, skins: ${skins.length}, animations: ${anims.length}`);

console.log('\nAnimations:');
for (const anim of anims) {
  console.log(`  - ${anim.name || '(unnamed)'} (${anim.duration?.toFixed(3) ?? '?'}s)`);
}

const jointNames = new Set();
for (const skin of skins) {
  for (const j of skin.joints ?? []) {
    if (nodes[j]?.name) jointNames.add(nodes[j].name);
  }
}

console.log('\nSkeleton bones:');
[...jointNames].sort().forEach((n) => console.log(`  ${n}`));

console.log('\nMeshes:');
nodes.filter((n) => n.mesh !== undefined).forEach((n) => console.log(`  ${n.name || '(unnamed)'}`));
