#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
  globalThis.URL = globalThis.URL ?? {
    createObjectURL: () => 'blob:node',
    revokeObjectURL: () => {},
  };
  globalThis.Blob = globalThis.Blob ?? class Blob {
    constructor(parts) { this.parts = parts; }
  };
}

const __dir = dirname(fileURLToPath(import.meta.url));
const fbxPath = join(__dir, '..', 'public', 'models', 'bowling-delivery.fbx');

const loader = new FBXLoader();
const buffer = readFileSync(fbxPath);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const group = loader.parse(arrayBuffer, 'bowling-delivery.fbx');

const bones = [];
group.traverse((o) => {
  if (o.isBone) bones.push(o.name);
});
console.log('animations:', group.animations.map((a) => ({ name: a.name, duration: a.duration, tracks: a.tracks.length })));
console.log('bones sample:', bones.slice(0, 50));
console.log('bone count:', bones.length);
