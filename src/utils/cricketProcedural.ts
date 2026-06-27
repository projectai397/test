import gsap from 'gsap';
import type * as THREE from 'three';
import { scenePositions } from './animationTimings';
import { PITCH_FACING } from './playerFacing';
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

/** Seconds into buildBowlingTimeline when the ball leaves the hand (132 km/h baseline). */
export const BOWLING_RELEASE_TIME = 0.52;

export interface BowlingTimelineOptions {
  deliverySpeedKmh?: number;
  /** Run-up already ended in gather pose — skip first delivery phase. */
  skipGather?: boolean;
}

function bowlingPaceScale(speedKmh: number): number {
  const clamped = Math.max(90, Math.min(160, speedKmh));
  return 132 / clamped;
}

/** Partial chest turn at release — stay mostly side-on, not a full 90° snap. */
function bowlerReleaseFacing(): number {
  return (
    PITCH_FACING.bowlerRunUpSideOn +
    (PITCH_FACING.bowlerDeliveryFrontOn - PITCH_FACING.bowlerRunUpSideOn) * 0.55
  );
}

/** Side-on cricket jog — locked upper body, thigh + shin strides. Ends in gather pose. */
export function buildCricketRunUpTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  duration: number,
): gsap.core.Timeline {
  const tl = gsap.timeline();

  tweenPose(tl, bones, rest, CRICKET_RUNUP_HOLD, Math.min(duration * 0.1, 0.18), 0, 'power1.out');

  const strideStart = Math.min(duration * 0.1, 0.18);
  const blendOut = 0.22;
  const strideWindow = duration - strideStart - blendOut;
  const strideCount = CRICKET_RUNUP_STRIDES.length;
  const strideDur = strideWindow / strideCount;

  CRICKET_RUNUP_STRIDES.forEach((stride, i) => {
    const t = strideStart + i * strideDur;
    rotRel(tl, bones.legR, rest, stride.legR, strideDur, t, 'sine.inOut');
    rotRel(tl, bones.lowerLegR, rest, stride.lowerLegR, strideDur, t, 'sine.inOut');
    rotRel(tl, bones.legL, rest, stride.legL, strideDur, t, 'sine.inOut');
    rotRel(tl, bones.lowerLegL, rest, stride.lowerLegL, strideDur, t, 'sine.inOut');
    tweenPose(tl, bones, rest, CRICKET_RUNUP_HOLD, strideDur * 0.35, t, 'power1.out');
  });

  /** Blend into delivery gather so run-up → bowl is seamless on the same character. */
  tweenPose(
    tl,
    bones,
    rest,
    BOWLING_PHASES.gather,
    blendOut,
    duration - blendOut,
    'power2.inOut',
  );

  return tl;
}

/** Wolf3D fast-medium delivery: bound → plant → OTM release → follow-through. */
export function buildBowlingTimeline(
  bones: PlayerBones,
  rest: BoneRestMap,
  group: THREE.Object3D,
  onRelease?: () => void,
  options?: BowlingTimelineOptions,
): gsap.core.Timeline {
  const speed = options?.deliverySpeedKmh ?? 132;
  const scale = bowlingPaceScale(speed);
  const d = (t: number) => t * scale;
  const skipGather = options?.skipGather ?? false;

  const tl = gsap.timeline();
  const p = BOWLING_PHASES;
  let t0 = 0;

  if (!skipGather) {
    tweenPose(tl, bones, rest, p.gather, d(0.12), t0, 'power2.out');
    t0 += d(0.12);
  }

  tweenPose(tl, bones, rest, p.bound, d(0.09), t0, 'power2.out', true);
  tweenPose(tl, bones, rest, p.plant, d(0.14), t0 + d(0.09), 'power3.in', true);
  tweenPose(tl, bones, rest, p.release, d(0.12), t0 + d(0.23), 'power4.in', true);
  const releaseAt = skipGather ? t0 + d(0.3) : t0 + d(BOWLING_RELEASE_TIME);
  tl.call(() => onRelease?.(), undefined, releaseAt);
  tweenPose(tl, bones, rest, p.followThrough, d(0.38), t0 + d(0.35), 'power2.out', true);

  const jumpStart = t0;
  tl.to(group.position, { y: 0.18, duration: d(0.06), ease: 'power2.out' }, jumpStart);
  tl.to(group.position, { y: 0, duration: d(0.09), ease: 'power2.in' }, jumpStart + d(0.06));

  tl.to(
    group.position,
    { x: scenePositions.bowlerCreaseX - 1.6, duration: d(0.48), ease: 'power1.out' },
    t0 + d(0.1),
  );

  tl.to(
    group.rotation,
    { y: bowlerReleaseFacing(), duration: d(0.16), ease: 'power2.inOut' },
    t0 + d(0.18),
  );

  tl.to(
    group.rotation,
    { y: PITCH_FACING.bowlerRunUpSideOn, duration: d(0.22), ease: 'power2.inOut' },
    t0 + d(0.58),
  );

  return tl;
}

export interface UnifiedBowlerTimeline {
  timeline: gsap.core.Timeline;
  runUpEndTime: number;
}

/** One GSAP clock: run-up travel + strides + delivery on the same GLB character. */
export function buildUnifiedBowlerTimeline(
  bones: PlayerBones,
  bindRest: BoneRestMap,
  group: THREE.Object3D,
  runUpDuration: number,
  onRelease?: () => void,
  options?: BowlingTimelineOptions,
): UnifiedBowlerTimeline {
  const tl = gsap.timeline();
  const startX = scenePositions.bowlerStartX;
  const creaseX = scenePositions.bowlerCreaseX;

  group.position.set(startX, 0, scenePositions.bowlerStartZ);
  group.rotation.set(0, PITCH_FACING.bowlerRunUpSideOn, 0);

  tl.to(
    group.position,
    { x: creaseX, z: 0, y: 0, duration: runUpDuration, ease: 'power2.in' },
    0,
  );

  const runUpBones = buildCricketRunUpTimeline(bones, bindRest, runUpDuration);
  tl.add(runUpBones, 0);

  tl.addLabel('runUpEnd', runUpDuration);

  const delivery = buildBowlingTimeline(bones, bindRest, group, onRelease, {
    ...options,
    skipGather: true,
  });
  tl.add(delivery, runUpDuration);

  return { timeline: tl, runUpEndTime: runUpDuration };
}

/** Play a GSAP timeline until `time` (seconds), then pause. */
export function timelineUntil(tl: gsap.core.Timeline, time: number): Promise<void> {
  return new Promise((resolve) => {
    const start = tl.time();
    if (start >= time) {
      resolve();
      return;
    }
    const proxy = { t: start };
    gsap.to(proxy, {
      t: time,
      duration: time - start,
      ease: 'none',
      onUpdate: () => {
        tl.time(proxy.t);
      },
      onComplete: () => {
        tl.pause();
        resolve();
      },
    });
    if (tl.paused()) tl.play();
  });
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
