#!/usr/bin/env node
/**
 * Merge Meshy animation GLBs (running, walking, pitch) into one file.
 * Same rig/skeleton from one Meshy rig task — append animation clips only.
 * Usage: node scripts/merge-meshy-glb.mjs <running.glb> <walking.glb> <pitch.glb> <output.glb>
 */
import { readFile, writeFile } from 'fs/promises';

const CLIP_NAMES = ['Running', 'Walking', 'baseball_pitching'];

function parseGlbBuffer(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const jsonStart = 20;
  const json = JSON.parse(buf.slice(jsonStart, jsonStart + jsonLen).toString());
  const binStart = jsonStart + jsonLen;
  const binChunkLen = buf.readUInt32LE(binStart);
  const bin = Buffer.from(buf.slice(binStart + 8, binStart + 8 + binChunkLen));
  return { json, bin };
}

async function readGlb(filePath) {
  const buf = await readFile(filePath);
  return parseGlbBuffer(buf);
}

function align4(n) {
  return n + ((4 - (n % 4)) % 4);
}

function writeGlb(filePath, json, bin) {
  const jsonBuf = Buffer.from(JSON.stringify(json));
  const jsonChunkLen = align4(jsonBuf.length);
  const binChunkLen = align4(bin.length);
  const totalLen = 12 + 8 + jsonChunkLen + 8 + binChunkLen;
  const out = Buffer.alloc(totalLen);
  let o = 0;
  out.writeUInt32LE(0x46546c67, o);
  o += 4;
  out.writeUInt32LE(2, o);
  o += 4;
  out.writeUInt32LE(totalLen, o);
  o += 4;
  out.writeUInt32LE(jsonChunkLen, o);
  o += 4;
  out.write('JSON', o);
  o += 4;
  jsonBuf.copy(out, o);
  o += jsonBuf.length;
  out.fill(0x20, o, o + (jsonChunkLen - jsonBuf.length));
  o += jsonChunkLen - jsonBuf.length;
  out.writeUInt32LE(binChunkLen, o);
  o += 4;
  out.write('BIN\0', o);
  o += 4;
  bin.copy(out, o);
  return writeFile(filePath, out);
}

function appendAnimation(base, src, clipName) {
  const srcAnim = src.json.animations?.[0];
  if (!srcAnim) return;

  const viewMap = new Map();
  const accessorMap = new Map();

  function copyBufferView(oldViewIdx) {
    if (viewMap.has(oldViewIdx)) return viewMap.get(oldViewIdx);
    const oldView = src.json.bufferViews[oldViewIdx];
    const start = oldView.byteOffset ?? 0;
    const slice = src.bin.subarray(start, start + oldView.byteLength);
    const viewOffset = align4(base.bin.length);
    const pad = viewOffset - base.bin.length;
    if (pad > 0) base.bin = Buffer.concat([base.bin, Buffer.alloc(pad)]);
    base.bin = Buffer.concat([base.bin, slice]);
    const newViewIdx = (base.json.bufferViews ?? []).length;
    base.json.bufferViews = [...(base.json.bufferViews ?? []), {
      buffer: 0,
      byteOffset: viewOffset,
      byteLength: oldView.byteLength,
    }];
    viewMap.set(oldViewIdx, newViewIdx);
    return newViewIdx;
  }

  function remapAccessor(oldIdx) {
    if (accessorMap.has(oldIdx)) return accessorMap.get(oldIdx);
    const oldAcc = src.json.accessors[oldIdx];
    const newViewIdx = copyBufferView(oldAcc.bufferView);
    const newAccIdx = (base.json.accessors ?? []).length;
    base.json.accessors = [...(base.json.accessors ?? []), { ...oldAcc, bufferView: newViewIdx }];
    accessorMap.set(oldIdx, newAccIdx);
    return newAccIdx;
  }

  const newSamplers = (srcAnim.samplers ?? []).map((s) => ({
    input: remapAccessor(s.input),
    output: remapAccessor(s.output),
    interpolation: s.interpolation ?? 'LINEAR',
  }));

  const newAnim = {
    name: clipName,
    channels: srcAnim.channels ?? [],
    samplers: newSamplers,
  };

  base.json.animations = [...(base.json.animations ?? []), newAnim];
  base.json.buffers = [{ byteLength: base.bin.length }];
}

export async function mergeMeshyGlbs(runPath, walkPath, pitchPath, outputPath) {
  const [run, walk, pitch] = await Promise.all([
    readGlb(runPath),
    readGlb(walkPath),
    readGlb(pitchPath),
  ]);

  if (run.json.animations?.[0]) {
    run.json.animations[0].name = CLIP_NAMES[0];
  }

  appendAnimation(run, walk, CLIP_NAMES[1]);
  appendAnimation(run, pitch, CLIP_NAMES[2]);

  await writeGlb(outputPath, run.json, run.bin);
  return outputPath;
}

async function main() {
  const [runPath, walkPath, pitchPath, outputPath] = process.argv.slice(2);
  if (!runPath || !walkPath || !pitchPath || !outputPath) {
    console.error('Usage: node scripts/merge-meshy-glb.mjs <running.glb> <walking.glb> <pitch.glb> <output.glb>');
    process.exit(1);
  }
  await mergeMeshyGlbs(runPath, walkPath, pitchPath, outputPath);
  console.log('Merged →', outputPath);
}

if (process.argv[1]?.includes('merge-meshy-glb')) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
