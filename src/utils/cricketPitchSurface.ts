import * as THREE from 'three';

/** ICC pitch dimensions (metres). */
export const POPPING_CREASE_M = 1.22;
export const RETURN_CREASE_OFFSET_M = 1.32;
/** Return crease extends this far behind the bowling crease. */
export const RETURN_CREASE_BACK_M = 2.64;
/** Popping crease painted beyond the pitch edge into the outfield. */
export const POPPING_CREASE_EXT_M = 1.83;

const CREASE_WIDTH_M = 0.05;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Dry tan pitch strip — surface only (creases are separate geometry). */
export function createPitchTexture(lengthM: number, widthM: number): THREE.CanvasTexture {
  const pxPerM = 72;
  const w = Math.round(lengthM * pxPerM);
  const h = Math.round(widthM * pxPerM);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(42);

  ctx.fillStyle = '#c8a96e';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < w * h * 0.06; i++) {
    const tone = 155 + rand() * 45;
    ctx.fillStyle = `rgba(${tone},${tone * 0.82},${tone * 0.48},${0.06 + rand() * 0.12})`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand(), 2 + rand() * 2);
  }

  for (let i = 0; i < w * 0.3; i++) {
    ctx.strokeStyle = `rgba(90,65,35,${0.1 + rand() * 0.16})`;
    ctx.lineWidth = 0.5 + rand();
    ctx.beginPath();
    let x = rand() * w;
    let y = rand() * h;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4 + rand() * 4; j++) {
      x += (rand() - 0.5) * 18;
      y += (rand() - 0.5) * 8;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Outfield — bright emerald with subtle mowing stripes, evenly sunlit. */
export function createOutfieldGrassTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(99);

  const stripePx = 24;
  for (let y = 0; y < size; y++) {
    ctx.fillStyle = Math.floor(y / stripePx) % 2 === 0 ? '#44a844' : '#2e8a2e';
    ctx.fillRect(0, y, size, 1);
  }

  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#3a9c3a';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;

  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.025})`;
    ctx.fillRect(rand() * size, rand() * size, 1, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export { CREASE_WIDTH_M };
