import gsap from 'gsap';
import type * as THREE from 'three';
import { scenePositions } from './animationTimings';
import type { BoneRestMap } from './boneRestPose';
import {
  BOWLING_PHASES,
  CRICKET_RUNUP_HOLD,
  CRICKET_RUNUP_STRIDES,
  type BowlingPose,
} from './wolf3dBowlingPoses';

export interface PlayerBones {
  hips: THREE.Object3D | null;
  torso: THREE.Object3D | null;
  legL: THREE.Object3D | null;
  legR: THREE.Object3D | null;
  lowerLegL: THREE.Object3D | null;
  lowerLegR: THREE.Object3D | null;
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

/** Tween from current bone rotation toward rest + delta (smooth phase chaining). */
function rotTo(
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

function snapBone(
  bone: THREE.Object3D | null | undefined,
  rest: BoneRestMap,
  delta: Partial<{ x: number; y: number; z: number }> | undefined,
) {
  if (!bone || !delta) return;
  const base = restRot(bone, rest);
  bone.rotation.set(
    base.x + (delta.x ?? 0),
    base.y + (delta.y ?? 0),
    base.z + (delta.z ?? 0),
  );
}

function applyPose(bones: PlayerBones, rest: BoneRestMap, pose: BowlingPose) {
  snapBone(bones.hips, rest, pose.hips);
  snapBone(bones.torso, rest, pose.torso);
  snapBone(bones.legL, rest, pose.legL);
  snapBone(bones.legR, rest, pose.legR);
  snapBone(bones.lowerLegL, rest, pose.lowerLegL);
  snapBone(bones.lowerLegR, rest, pose.lowerLegR);
  snapBone(bones.armL, rest, pose.armL);
  snapBone(bones.armR, rest, pose.armR);
  snapBone(bones.foreArmL, rest, pose.foreArmL);
  snapBone(bones.foreArmR, rest, pose.foreArmR);
}

function tweenPose(
  tl: gsap.core.Timeline,
  bones: PlayerBones,
  rest: BoneRestMap,
  pose: BowlingPose,
  duration: number,
  at: number | string,
  ease: string,
  chain = false,
) {
  const rot = chain ? rotTo : rotRel;
  rot(tl, bones.hips, rest, pose.hips ?? {}, duration, at, ease);
  rot(tl, bones.torso, rest, pose.torso ?? {}, duration, at, ease);
  rot(tl, bones.legL, rest, pose.legL ?? {}, duration, at, ease);
  rot(tl, bones.legR, rest, pose.legR ?? {}, duration, at, ease);
  rot(tl, bones.lowerLegL, rest, pose.lowerLegL ?? {}, duration, at, ease);
  rot(tl, bones.lowerLegR, rest, pose.lowerLegR ?? {}, duration, at, ease);
  rot(tl, bones.armL, rest, pose.armL ?? {}, duration, at, ease);
  rot(tl, bones.armR, rest, pose.armR ?? {}, duration, at, ease);
  rot(tl, bones.foreArmL, rest, pose.foreArmL ?? {}, duration, at, ease);
  rot(tl, bones.foreArmR, rest, pose.foreArmR ?? {}, duration, at, ease);
}

/** Snap into side-on cricket run-up hold (avoids T-pose flash). */
export function applyCricketRunUpPose(bones: PlayerBones, rest: BoneRestMap): void {
  applyPose(bones, rest, CRICKET_RUNUP_HOLD);
}

/** Seconds into buildBowlingTimeline when the ball leaves the hand. */
export const BOWLING_RELEASE_TIME = 0.48;

/** Side-on cricket jog — locked upper body, thigh + shin strides. */
export function buildCricketRunUpTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  duration: number,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  tweenPose(tl, bones, rest, CRICKET_RUNUP_HOLD, Math.min(duration * 0.12, 0.22), 0, 'power1.out');

  const strideStart = Math.min(duration * 0.12, 0.22);
  const strideWindow = duration - strideStart - 0.1;
  const strideCount = CRICKET_RUNUP_STRIDES.length;
  const strideDur = strideWindow / strideCount;

  CRICKET_RUNUP_STRIDES.forEach((stride, i) => {
    const t = strideStart + i * strideDur;
    rotRel(tl, bones.legR, rest, stride.legR, strideDur, t, 'sine.inOut');
    rotRel(tl, bones.lowerLegR, rest, stride.lowerLegR, strideDur, t, 'sine.inOut');
    rotRel(tl, bones.legL, rest, stride.legL, strideDur, t, 'sine.inOut');
    rotRel(tl, bones.lowerLegL, rest, stride.lowerLegL, strideDur, t, 'sine.inOut');
    tweenPose(tl, bones, rest, CRICKET_RUNUP_HOLD, strideDur * 0.4, t, 'power1.out');
  });

  return tl;
}

/** Wolf3D fast-medium delivery: gather → bound → plant → OTM release → follow-through. */
export function buildBowlingTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  group: THREE.Object3D,
  onRelease?: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const p = BOWLING_PHASES;

  tweenPose(tl, bones, rest, p.gather, 0.12, 0, 'power2.out');
  tweenPose(tl, bones, rest, p.bound, 0.14, 0.12, 'power2.out', true);
  tweenPose(tl, bones, rest, p.plant, 0.14, 0.26, 'power3.in', true);
  tweenPose(tl, bones, rest, p.release, 0.12, 0.4, 'power4.in', true);
  tl.call(() => onRelease?.(), undefined, BOWLING_RELEASE_TIME);
  tweenPose(tl, bones, rest, p.followThrough, 0.38, 0.52, 'power2.out', true);

  tl.to(
    group.position,
    { x: scenePositions.bowlerCreaseX - 2.5, duration: 0.65, ease: 'power1.out' },
    0.25,
  );

  return tl;
}

/** @deprecated Use buildCricketRunUpTimeline */
export function buildProceduralRunUpTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  duration: number,
  _cycles: number,
): gsap.core.Timeline {
  return buildCricketRunUpTimeline(bones, rest, duration);
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

export const MIN_RUN_UP_MS = 2000;
export const MIN_BOWL_MS = 800;
export const MIN_BAT_MS = 500;
