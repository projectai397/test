import * as THREE from 'three';

type EaseFn = (t: number) => number;

const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const linear = (t: number) => t;

const EASE: Record<string, EaseFn> = {
  linear,
  easeIn,
  easeOut,
  easeInOut,
  power1In: easeIn,
  power1Out: easeOut,
  power2InOut: easeInOut,
};

interface PositionMotion {
  kind: 'position';
  target: THREE.Object3D;
  from: THREE.Vector3;
  to: THREE.Vector3;
  duration: number;
  elapsed: number;
  ease: EaseFn;
  resolve: () => void;
  yBob?: { amplitude: number; period: number };
}

interface RotationMotion {
  kind: 'rotation';
  target: THREE.Object3D;
  from: THREE.Euler;
  to: THREE.Euler;
  duration: number;
  elapsed: number;
  ease: EaseFn;
  resolve: () => void;
}

type MotionJob = PositionMotion | RotationMotion;

const activeMotions: MotionJob[] = [];

export function tickMotions(delta: number): void {
  for (let i = activeMotions.length - 1; i >= 0; i--) {
    const job = activeMotions[i];
    job.elapsed += delta;
    const t = Math.min(job.elapsed / job.duration, 1);
    const e = job.ease(t);

    if (job.kind === 'position') {
      job.target.position.lerpVectors(job.from, job.to, e);
      if (job.yBob) {
        const bob =
          Math.sin((job.elapsed / job.yBob.period) * Math.PI * 2) * job.yBob.amplitude;
        job.target.position.y = THREE.MathUtils.lerp(job.from.y, job.to.y, e) + bob;
      }
    } else {
      job.target.rotation.x = THREE.MathUtils.lerp(job.from.x, job.to.x, e);
      job.target.rotation.y = THREE.MathUtils.lerp(job.from.y, job.to.y, e);
      job.target.rotation.z = THREE.MathUtils.lerp(job.from.z, job.to.z, e);
    }

    if (t >= 1) {
      activeMotions.splice(i, 1);
      job.resolve();
    }
  }
}

export function cancelMotionsFor(target: THREE.Object3D): void {
  for (let i = activeMotions.length - 1; i >= 0; i--) {
    if (activeMotions[i].target === target) {
      activeMotions.splice(i, 1);
    }
  }
}

export function animatePosition(
  target: THREE.Object3D,
  to: Partial<{ x: number; y: number; z: number }>,
  duration: number,
  options?: { ease?: string; yBob?: { amplitude: number; period: number } },
): Promise<void> {
  return new Promise((resolve) => {
    const from = target.position.clone();
    const dest = new THREE.Vector3(
      to.x ?? from.x,
      to.y ?? from.y,
      to.z ?? from.z,
    );
    const ease = EASE[options?.ease ?? 'easeInOut'] ?? easeInOut;
    activeMotions.push({
      kind: 'position',
      target,
      from,
      to: dest,
      duration,
      elapsed: 0,
      ease,
      resolve,
      yBob: options?.yBob,
    });
  });
}

export function animateRotation(
  target: THREE.Object3D,
  to: Partial<{ x: number; y: number; z: number }>,
  duration: number,
  options?: { ease?: string },
): Promise<void> {
  return new Promise((resolve) => {
    const from = target.rotation.clone();
    const dest = new THREE.Euler(
      to.x ?? from.x,
      to.y ?? from.y,
      to.z ?? from.z,
      from.order,
    );
    const ease = EASE[options?.ease ?? 'easeInOut'] ?? easeInOut;
    activeMotions.push({
      kind: 'rotation',
      target,
      from,
      to: dest,
      duration,
      elapsed: 0,
      ease,
      resolve,
    });
  });
}

export function waitMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function waitUntilReady(
  check: () => boolean,
  maxMs = 10000,
  intervalMs = 50,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (check()) return true;
    await waitMs(intervalMs);
  }
  return false;
}
