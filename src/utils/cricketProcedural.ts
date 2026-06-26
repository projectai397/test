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

/** Seconds into buildFullBowlingDeliveryTimeline when the ball leaves the hand. */
export const BOWLING_RELEASE_TIME = 2.05;

/** Approach phase duration before gather/bound (single continuous delivery). */
export const BOWLING_APPROACH_DURATION = 1.65;

/**
 * Side-on cricket run-up — chest across the pitch, arms fixed (no sprint arm pump).
 * Tuned for Wolf3D / Ready Player Me T-pose rest.
 */
const BOWLING_SIDEON_HOLD = {
  hips: { x: 0.1, y: 1.18, z: 0.04 },
  torso: { x: 0.22, y: 1.22, z: 0.06 },
  /** Non-bowling arm: tucked at side for balance, not swinging. */
  armL: { x: 0.72, z: -0.42, y: 0.08 },
  foreArmL: { x: -0.38, z: -0.1 },
  /** Bowling arm: down at hip holding the ball, steady through the run-up. */
  armR: { x: 0.55, z: 0.22, y: -0.18 },
  foreArmR: { x: -0.72, z: 0.08 },
} as const;

/** Gentle leg rhythm — small knee lift, not track-sprint strides. */
const BOWLING_APPROACH_STRIDES: Array<{ legR: number; legL: number }> = [
  { legR: 0.11, legL: -0.02 },
  { legL: 0.13, legR: -0.02 },
  { legR: 0.12, legL: -0.01 },
  { legL: 0.14, legR: -0.02 },
];

function lockBowlingRunUpUpperBody(
  tl: gsap.core.Timeline,
  bones: PlayerBones,
  rest: BoneRestMap,
  at: number,
  duration: number,
) {
  const h = BOWLING_SIDEON_HOLD;
  rotRel(tl, bones.hips, rest, h.hips, duration, at, 'power1.out');
  rotRel(tl, bones.torso, rest, h.torso, duration, at, 'power1.out');
  rotRel(tl, bones.armL, rest, h.armL, duration, at, 'power1.out');
  rotRel(tl, bones.foreArmL, rest, h.foreArmL, duration, at, 'power1.out');
  rotRel(tl, bones.armR, rest, h.armR, duration, at, 'power1.out');
  rotRel(tl, bones.foreArmR, rest, h.foreArmR, duration, at, 'power1.out');
}

/** Snap bones into side-on run-up hold (avoids T-pose flash at delivery start). */
export function applyBowlingApproachHold(bones: PlayerBones, rest: BoneRestMap): void {
  const h = BOWLING_SIDEON_HOLD;
  const snap = (
    bone: THREE.Object3D | null | undefined,
    delta: Partial<{ x: number; y: number; z: number }>,
  ) => {
    if (!bone) return;
    const base = restRot(bone, rest);
    bone.rotation.set(
      base.x + (delta.x ?? 0),
      base.y + (delta.y ?? 0),
      base.z + (delta.z ?? 0),
    );
  };
  snap(bones.hips, h.hips);
  snap(bones.torso, h.torso);
  snap(bones.armL, h.armL);
  snap(bones.foreArmL, h.foreArmL);
  snap(bones.armR, h.armR);
  snap(bones.foreArmR, h.foreArmR);
}

/**
 * One continuous right-arm fast-medium delivery: approach strides → gather → bound →
 * plant → release → follow-through. No separate "run then throw".
 */
export function buildFullBowlingDeliveryTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  group: THREE.Object3D,
  onRelease?: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const t0 = BOWLING_APPROACH_DURATION;

  // ── Approach: side-on cricket jog — locked upper body, subtle leg rhythm ──
  lockBowlingRunUpUpperBody(tl, bones, rest, 0, BOWLING_APPROACH_DURATION);

  const strideStart = 0.18;
  const strideWindow = BOWLING_APPROACH_DURATION - strideStart - 0.12;
  const strideDur = strideWindow / BOWLING_APPROACH_STRIDES.length;

  BOWLING_APPROACH_STRIDES.forEach((stride, i) => {
    const t = strideStart + i * strideDur;
    rotRel(tl, bones.legR, rest, { x: stride.legR, z: 0.01 }, strideDur, t, 'sine.inOut');
    rotRel(tl, bones.legL, rest, { x: stride.legL, z: -0.01 }, strideDur, t, 'sine.inOut');
  });

  tl.fromTo(
    group.position,
    { x: scenePositions.bowlerStartX, y: 0, z: scenePositions.bowlerStartZ },
    {
      x: scenePositions.bowlerCreaseX - 0.55,
      y: 0,
      z: scenePositions.bowlerStartZ,
      duration: BOWLING_APPROACH_DURATION + 0.35,
      ease: 'power1.inOut',
    },
    0,
  );

  // ── Phase 1 — Gather: coil from side-on into delivery stride ──
  rotRel(tl, bones.hips, rest, { y: 1.05, x: 0.14, z: 0.05 }, 0.12, t0, 'power2.out');
  rotRel(tl, bones.torso, rest, { y: 1.08, x: 0.18, z: 0.08 }, 0.12, t0, 'power2.out');
  rotRel(tl, bones.legR, rest, { x: 0.48, z: 0.04 }, 0.12, t0, 'power2.out');
  rotRel(tl, bones.legL, rest, { x: 0.22, z: -0.04 }, 0.12, t0, 'power2.out');
  rotRel(tl, bones.armL, rest, { x: 0.62, z: -0.35, y: 0.14 }, 0.12, t0, 'power2.out');
  rotRel(tl, bones.foreArmL, rest, { x: -0.35, z: -0.08 }, 0.1, t0, 'power2.out');
  rotRel(tl, bones.armR, rest, { x: -0.35, z: 0.12, y: -0.12 }, 0.12, t0, 'power2.out');
  rotRel(tl, bones.foreArmR, rest, { x: -0.85, z: 0.06 }, 0.1, t0, 'power2.out');

  // ── Phase 2 — Bound: back foot braced, bowling arm climbs (OTM load) ──
  rotRel(tl, bones.legR, rest, { x: 0.68, z: 0.02 }, 0.14, t0 + 0.1, 'power2.inOut');
  rotRel(tl, bones.legL, rest, { x: 0.04, z: -0.02 }, 0.12, t0 + 0.1, 'power2.inOut');
  rotRel(tl, bones.armR, rest, { x: -1.45, z: 0.04, y: -0.14 }, 0.18, t0 + 0.1, 'power2.out');
  rotRel(tl, bones.foreArmR, rest, { x: -0.88, z: 0.02 }, 0.18, t0 + 0.1, 'power2.out');
  rotRel(tl, bones.armL, rest, { x: 0.42, z: -0.42, y: 0.16 }, 0.12, t0 + 0.1, 'power2.inOut');
  rotRel(tl, bones.torso, rest, { x: -0.12, y: 0.92, z: 0.1 }, 0.14, t0 + 0.1, 'power2.out');

  // ── Phase 3 — Front-foot plant & hip-shoulder separation ──
  rotRel(tl, bones.legL, rest, { x: 0.72, z: -0.08 }, 0.18, t0 + 0.24, 'power3.in');
  rotRel(tl, bones.legR, rest, { x: 0.06, z: -0.06 }, 0.16, t0 + 0.24, 'power3.in');
  rotRel(tl, bones.armL, rest, { x: -0.68, z: -0.1, y: 0.2 }, 0.16, t0 + 0.26, 'power3.in');
  rotRel(tl, bones.foreArmL, rest, { x: -0.58, z: 0.04 }, 0.14, t0 + 0.26, 'power3.in');
  rotRel(tl, bones.armR, rest, { x: -1.92, z: 0.02, y: -0.16 }, 0.18, t0 + 0.24, 'power3.out');
  rotRel(tl, bones.foreArmR, rest, { x: -1.05, z: 0.0 }, 0.18, t0 + 0.24, 'power3.out');
  rotRel(tl, bones.torso, rest, { x: -0.28, y: 0.72, z: 0.12 }, 0.16, t0 + 0.24, 'power3.out');
  rotRel(tl, bones.hips, rest, { x: -0.02, y: 0.82, z: 0.04 }, 0.14, t0 + 0.24, 'power3.out');

  // ── Phase 4 — Release: arm comes over the top (cricket whip, not javelin throw) ──
  rotRel(tl, bones.armR, rest, { x: -0.15, z: -0.12, y: -0.04 }, 0.12, t0 + 0.4, 'power4.in');
  rotRel(tl, bones.foreArmR, rest, { x: -0.35, z: -0.18 }, 0.1, t0 + 0.4, 'power4.in');
  rotRel(tl, bones.armL, rest, { x: -0.82, z: -0.02, y: 0.14 }, 0.1, t0 + 0.4, 'power2.in');
  rotRel(tl, bones.torso, rest, { x: 0.28, y: 0.58, z: 0.04 }, 0.12, t0 + 0.4, 'power4.in');
  rotRel(tl, bones.hips, rest, { x: 0.1, y: 0.68, z: 0.02 }, 0.1, t0 + 0.4, 'power4.in');
  tl.call(() => onRelease?.(), undefined, BOWLING_RELEASE_TIME);

  // ── Phase 5 — Follow-through down the pitch ──
  rotRel(tl, bones.armR, rest, { x: 0.72, z: -0.22, y: 0.08 }, 0.34, t0 + 0.52, 'power2.out');
  rotRel(tl, bones.foreArmR, rest, { x: 0.28, z: -0.24 }, 0.3, t0 + 0.52, 'power2.out');
  rotRel(tl, bones.armL, rest, { x: -0.08, z: 0.06, y: -0.02 }, 0.28, t0 + 0.52, 'power2.out');
  rotRel(tl, bones.torso, rest, { x: 0.48, y: 0.42, z: 0.02 }, 0.32, t0 + 0.52, 'power2.out');
  rotRel(tl, bones.hips, rest, { x: 0.14, y: 0.52, z: 0.01 }, 0.28, t0 + 0.52, 'power2.out');
  rotRel(tl, bones.legL, rest, { x: 0.38, z: -0.02 }, 0.24, t0 + 0.5, 'power2.out');
  rotRel(tl, bones.legR, rest, { x: -0.02, z: 0.1 }, 0.26, t0 + 0.52, 'power2.out');

  return tl;
}

/** @deprecated Use buildFullBowlingDeliveryTimeline for continuous delivery. */
export function buildBowlingTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  group: THREE.Object3D,
  onRelease?: () => void,
): gsap.core.Timeline {
  return buildFullBowlingDeliveryTimeline(bones, rest, group, onRelease);
}

/** @deprecated Merged into buildFullBowlingDeliveryTimeline approach phase. */
export function buildRunUpFinishPose(bones: PlayerBones, rest: BoneRestMap): gsap.core.Timeline {
  const tl = gsap.timeline();
  rotRel(tl, bones.legR, rest, { x: 0.48, z: 0.05 }, 0.08, 0, 'power2.out');
  rotRel(tl, bones.legL, rest, { x: 0.18, z: -0.04 }, 0.08, 0, 'power2.out');
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

/** In-place run cycle for cricket rigs without a Mixamo Run clip. */
export function buildProceduralRunTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  duration: number,
  cycles: number,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const strideCount = Math.max(Math.round(cycles * 2), 4);
  const half = duration / strideCount;

  for (let i = 0; i < strideCount; i++) {
    const t = i * half;
    const rightForward = i % 2 === 0;
    if (rightForward) {
      rotRel(tl, bones.legR, rest, { x: 0.58, z: 0.06 }, half, t, 'sine.inOut');
      rotRel(tl, bones.legL, rest, { x: -0.22, z: -0.04 }, half, t, 'sine.inOut');
      rotRel(tl, bones.armL, rest, { x: 0.35, z: -0.18 }, half, t, 'sine.inOut');
      rotRel(tl, bones.armR, rest, { x: -0.3, z: 0.14 }, half, t, 'sine.inOut');
      rotRel(tl, bones.torso, rest, { x: 0.06, y: 0.04 }, half, t, 'sine.inOut');
    } else {
      rotRel(tl, bones.legL, rest, { x: 0.58, z: -0.06 }, half, t, 'sine.inOut');
      rotRel(tl, bones.legR, rest, { x: -0.22, z: 0.04 }, half, t, 'sine.inOut');
      rotRel(tl, bones.armR, rest, { x: 0.35, z: 0.18 }, half, t, 'sine.inOut');
      rotRel(tl, bones.armL, rest, { x: -0.3, z: -0.14 }, half, t, 'sine.inOut');
      rotRel(tl, bones.torso, rest, { x: 0.06, y: -0.04 }, half, t, 'sine.inOut');
    }
  }

  return tl;
}

export const MIN_RUN_UP_MS = 800;
export const MIN_BOWL_MS = 1400;
export const MIN_DELIVERY_MS = 2300;
export const MIN_BAT_MS = 500;
