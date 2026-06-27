import * as THREE from 'three';
/** ICC pitch dimensions (metres). */
export const POPPING_CREASE_M = 1.22;
export const RETURN_CREASE_OFFSET_M = 1.32;
/** Return crease runs this far behind the bowling crease. */
export const RETURN_CREASE_DEPTH_M = 2.64;

const CREASE_LINE_M = 0.05;

function mToU(m: number, lengthM: number): number {
  return m / lengthM;
}

function mToV(m: number, widthM: number): number {
  return 0.5 - m / widthM;
}

/** Tan worn pitch strip with white crease markings baked into the texture. */
export function createPitchTexture(lengthM: number, widthM: number): THREE.CanvasTexture {
  const pxPerM = 64;
  const w = Math.round(lengthM * pxPerM);
  const h = Math.round(widthM * pxPerM);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Dry grass / rolled clay base
  ctx.fillStyle = '#c4a574';
  ctx.fillRect(0, 0, w, h);

  // Subtle straw-grain noise
  for (let i = 0; i < w * h * 0.08; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const tone = 160 + Math.random() * 50;
    ctx.fillStyle = `rgba(${tone},${tone * 0.82},${tone * 0.55},${0.08 + Math.random() * 0.12})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 4);
  }

  // Centre wear (bowlers' footmarks)
  const cx = w / 2;
  const cy = h / 2;
  const wear = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.35);
  wear.addColorStop(0, 'rgba(140,105,65,0.18)');
  wear.addColorStop(1, 'rgba(140,105,65,0)');
  ctx.fillStyle = wear;
  ctx.fillRect(0, 0, w, h);

  const linePx = Math.max(2, CREASE_LINE_M * pxPerM);

  const drawHLine = (xM: number, zStartM: number, zEndM: number) => {
    const x = mToU(xM, lengthM) * w;
    const y0 = mToV(zStartM, widthM) * h;
    const y1 = mToV(zEndM, widthM) * h;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - linePx / 2, Math.min(y0, y1), linePx, Math.abs(y1 - y0) || linePx);
  };

  const drawVLine = (zM: number, xStartM: number, xEndM: number) => {
    const y = mToV(zM, widthM) * h;
    const x0 = mToU(xStartM, lengthM) * w;
    const x1 = mToU(xEndM, lengthM) * w;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.min(x0, x1), y - linePx / 2, Math.abs(x1 - x0) || linePx, linePx);
  };

  const halfW = widthM / 2;
  const retZ = RETURN_CREASE_OFFSET_M;
  const popBehind = RETURN_CREASE_DEPTH_M - POPPING_CREASE_M;

  // —— Striker end (x = 0) ——
  drawHLine(0, -halfW, halfW);
  drawHLine(POPPING_CREASE_M, -halfW, halfW);
  drawVLine(-retZ, -popBehind, POPPING_CREASE_M);
  drawVLine(retZ, -popBehind, POPPING_CREASE_M);

  // —— Bowler end (x = lengthM) ——
  drawHLine(lengthM, -halfW, halfW);
  drawHLine(lengthM - POPPING_CREASE_M, -halfW, halfW);
  drawVLine(-retZ, lengthM - POPPING_CREASE_M, lengthM + popBehind);
  drawVLine(retZ, lengthM - POPPING_CREASE_M, lengthM + popBehind);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Outfield grass with mower stripes parallel to the pitch length. */
export function createOutfieldGrassTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const stripePx = 28;
  const light = '#4caf50';
  const dark = '#2e7d32';

  for (let y = 0; y < size; y++) {
    ctx.fillStyle = Math.floor(y / stripePx) % 2 === 0 ? light : dark;
    ctx.fillRect(0, y, size, 1);
  }

  // Fine grass speckle
  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
