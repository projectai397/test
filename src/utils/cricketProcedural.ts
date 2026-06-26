import gsap from 'gsap';
import type * as THREE from 'three';
import { scenePositions } from './animationTimings';
import type { BoneRestMap } from './boneRestPose';

export interface PlayerBones {
  hips: THREE.Object3D | null;
  torso: THREE.Object3D | null;
  legL: THREE.Object3D | null;
  legR: THREE.Object3D | null;
  armL: THREE.Object3D | null;
  armR: THREE.Object3D | null;
  foreArmL: THREE.Object3D | null;
  foreArmR: THREE.Object3D | null;
}

function restRot(bone: THREE.Object3D | null | undefined, rest: BoneRestMap) {
  if (!bone) return { x: 0, y: 0, z: 0 };
  const r = rest.get(bone);
  return r ? { x: r.x, y: r.y, z: r.z } : { x: bone.rotation.x, y: bone.rotation.y, z: bone.rotation.z };
}

function rotRel(
  tl: gsap.core.Timeline,
  bone: THREE.Object3D | null | undefined,
  rest: BoneRestMap,
  delta: Partial<{ x: number; y: number; z: number }>,
  duration: number,
  position: number | string = 0,
  ease = 'power2.inOut',
) {
  if (!bone) return;
  const base = restRot(bone, rest);
  tl.to(
    bone.rotation,
    {
      x: base.x + (delta.x ?? 0),
      y: base.y + (delta.y ?? 0),
      z: base.z + (delta.z ?? 0),
      duration,
      ease,
    },
    position,
  );
}

/** Cricket fast-bowling action: gather → bound → release → follow-through. */
export function buildBowlingTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  group: THREE.Object3D,
  onRelease?: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  rotRel(tl, bones.armR, rest, { x: -1.8, z: 1.0, y: 0.2 }, 0.28, 0, 'power2.out');
  rotRel(tl, bones.foreArmR, rest, { x: -0.8, z: 0.3 }, 0.28, 0, 'power2.out');
  rotRel(tl, bones.armL, rest, { x: 0.6, z: -0.5, y: -0.2 }, 0.28, 0, 'power2.out');
  rotRel(tl, bones.torso, rest, { x: -0.55, y: 0.15, z: 0.05 }, 0.28, 0, 'power2.out');
  rotRel(tl, bones.hips, rest, { y: -0.12, x: 0.1 }, 0.28, 0, 'power2.out');
  rotRel(tl, bones.legR, rest, { x: 0.4 }, 0.28, 0, 'power2.out');

  rotRel(tl, bones.legL, rest, { x: 0.95, z: -0.15 }, 0.22, 0.22, 'power2.in');
  rotRel(tl, bones.legR, rest, { x: -0.2 }, 0.22, 0.22, 'power2.in');
  rotRel(tl, bones.armL, rest, { x: -0.9, z: -0.2, y: 0.1 }, 0.22, 0.22, 'power2.in');
  rotRel(tl, bones.armR, rest, { x: -3.0, z: 0.4, y: -0.1 }, 0.18, 0.28, 'power4.in');
  rotRel(tl, bones.foreArmR, rest, { x: -1.6, z: 0.1 }, 0.18, 0.28, 'power4.in');
  rotRel(tl, bones.torso, rest, { x: 0.35, y: -0.1 }, 0.18, 0.28, 'power4.in');

  rotRel(tl, bones.armR, rest, { x: 0.9, z: -0.5, y: 0.15 }, 0.14, 0.42, 'power4.out');
  rotRel(tl, bones.foreArmR, rest, { x: 0.3, z: -0.2 }, 0.14, 0.42, 'power4.out');
  tl.call(() => onRelease?.(), undefined, 0.48);

  rotRel(tl, bones.armR, rest, { x: 1.4, z: -0.8, y: 0.25 }, 0.35, 0.52, 'power1.out');
  rotRel(tl, bones.foreArmR, rest, { x: 0.6, z: -0.35 }, 0.35, 0.52, 'power1.out');
  rotRel(tl, bones.torso, rest, { x: 0.75, y: -0.2, z: 0.1 }, 0.35, 0.52, 'power1.out');
  rotRel(tl, bones.armL, rest, { x: -0.4, z: 0.2 }, 0.35, 0.52, 'power1.out');
  rotRel(tl, bones.hips, rest, { y: 0.18, x: 0.15 }, 0.35, 0.52, 'power1.out');

  tl.to(
    group.position,
    { x: scenePositions.bowlerCreaseX - 2.5, duration: 0.65, ease: 'power1.out' },
    0.25,
  );

  return tl;
}

/** Batter six — backlift, step, slog, follow-through. */
export function buildSixShotTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  bat: THREE.Object3D,
  batRest: THREE.Euler,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  tl.to(
    bat.rotation,
    { x: batRest.x - 0.2, y: batRest.y + 0.15, z: batRest.z - 1.85, duration: 0.18, ease: 'power2.in' },
    0,
  );
  rotRel(tl, bones.torso, rest, { y: -0.35, x: -0.15, z: 0.05 }, 0.18, 0, 'power2.in');
  rotRel(tl, bones.armR, rest, { x: -1.2, z: -0.4 }, 0.18, 0, 'power2.in');
  rotRel(tl, bones.foreArmR, rest, { x: -0.6 }, 0.18, 0, 'power2.in');
  rotRel(tl, bones.armL, rest, { x: 0.3, z: 0.2 }, 0.18, 0, 'power2.in');
  rotRel(tl, bones.legL, rest, { x: 0.15 }, 0.18, 0, 'power2.in');

  tl.to(bat.rotation, { x: 0.4, y: -0.1, z: 1.8, duration: 0.22, ease: 'power4.out' }, 0.14);
  rotRel(tl, bones.torso, rest, { y: 1.1, x: 0.25, z: -0.1 }, 0.22, 0.14, 'power4.out');
  rotRel(tl, bones.armR, rest, { x: 0.5, z: 0.8, y: 0.3 }, 0.22, 0.14, 'power4.out');
  rotRel(tl, bones.foreArmR, rest, { x: 0.8, z: 0.4 }, 0.22, 0.14, 'power4.out');
  rotRel(tl, bones.armL, rest, { x: -0.5, z: -0.3 }, 0.22, 0.14, 'power4.out');
  rotRel(tl, bones.hips, rest, { y: 0.5, x: 0.1 }, 0.22, 0.14, 'power4.out');
  rotRel(tl, bones.legR, rest, { x: 0.5 }, 0.22, 0.14, 'power4.out');

  tl.to(bat.rotation, { x: 0.15, y: 0, z: -0.35, duration: 0.45, ease: 'power2.out' }, 0.38);
  rotRel(tl, bones.torso, rest, { y: 0.15, x: 0, z: 0 }, 0.4, 0.42, 'power2.out');
  rotRel(tl, bones.armR, rest, { x: 0.2, z: -0.2, y: 0 }, 0.4, 0.42, 'power2.out');
  rotRel(tl, bones.hips, rest, { y: 0, x: 0 }, 0.4, 0.42, 'power2.out');

  return tl;
}

/** Keeper crouch behind stumps. */
export function buildKeeperCrouchTimeline(bones: PlayerBones, rest: BoneRestMap): gsap.core.Timeline {
  const tl = gsap.timeline();
  rotRel(tl, bones.torso, rest, { x: 0.55, y: 0.05 }, 0.35, 0, 'power2.out');
  rotRel(tl, bones.hips, rest, { x: 0.25, y: 0.05 }, 0.35, 0, 'power2.out');
  rotRel(tl, bones.legL, rest, { x: 0.65 }, 0.35, 0, 'power2.out');
  rotRel(tl, bones.legR, rest, { x: 0.65 }, 0.35, 0, 'power2.out');
  rotRel(tl, bones.armL, rest, { x: 0.4, z: -0.3 }, 0.35, 0, 'power2.out');
  rotRel(tl, bones.armR, rest, { x: 0.4, z: 0.3 }, 0.35, 0, 'power2.out');
  return tl;
}

/** Non-striker watches the ball. */
export function buildWatchBallTimeline(bones: PlayerBones, rest: BoneRestMap): gsap.core.Timeline {
  const tl = gsap.timeline();
  rotRel(tl, bones.torso, rest, { y: -0.45, x: -0.08 }, 0.4, 0, 'power2.out');
  rotRel(tl, bones.armL, rest, { x: 0.25, z: -0.15 }, 0.4, 0, 'power2.out');
  return tl;
}

export function timelineToPromise(tl: gsap.core.Timeline): Promise<void> {
  return new Promise((resolve) => {
    tl.eventCallback('onComplete', () => resolve());
  });
}

export const MIN_RUN_UP_MS = 2000;
export const MIN_BOWL_MS = 800;
export const MIN_BAT_MS = 600;
