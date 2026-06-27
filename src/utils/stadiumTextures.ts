import * as THREE from 'three';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const CROWD_COLORS = ['#ffffff', '#ffdd00', '#1a4fc4', '#e63232', '#2288cc', '#ffffaa', '#ffcc44'];

/** Dense daylight crowd — white, yellow, blue, red clothing mix. */
export function createCrowdTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(13);

  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 12000; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const c = CROWD_COLORS[Math.floor(rand() * CROWD_COLORS.length)];
    const a = 0.5 + rand() * 0.5;
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    const pw = 1 + Math.floor(rand() * 2);
    const ph = 1 + Math.floor(rand() * 2);
    ctx.fillRect(x, y, pw, ph);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Clear daytime sky — sky blue with soft white clouds. */
export function createDaySkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(7);

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#6eb8e8');
  g.addColorStop(0.45, '#87CEEB');
  g.addColorStop(1, '#9fd4f0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 14; i++) {
    const cx = rand() * 512;
    const cy = 40 + rand() * 220;
    const rx = 30 + rand() * 70;
    const ry = 12 + rand() * 28;
    ctx.fillStyle = `rgba(255,255,255,${0.55 + rand() * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.4, cy + ry * 0.2, rx * 0.6, ry * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + rx * 0.35, cy + ry * 0.15, rx * 0.55, ry * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
