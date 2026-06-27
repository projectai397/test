import { scenePositions } from './animationTimings';

/**
 * Run-cycle calibration for bowler run-up (procedural fallback when no walk clip).
 * Run cycle = 0.700 s. Hips have almost no forward root motion (in-place clip).
 *
 * effectiveStride = world metres travelled per run cycle when clip plays at timeScale 1.
 * Calibrated so legs look natural at 1.0× — ground speed is derived from this, not forced separately.
 */
export const CLIP_LOCOMOTION = {
  run: { cycleDuration: 0.633, effectiveStride: 5.0 },
  walk: { cycleDuration: 1.033, effectiveStride: 1.15 },
  /** Cricketer Walk (IDEAZZZZ) — 2-step scanned walk, sped up for bowler run-up. */
  cricketWalkRunUp: { cycleDuration: 1.0, effectiveStride: 1.35, clipTimeScale: 1.45 },
  /** Procedural Wolf3D side-on jog — accelerates toward crease. */
  cricketBowlerRunUp: {
    startSpeed: 2.4,
    peakSpeed: 5.2,
    strideLength: 1.45,
    stridePeriod: 0.48,
  },
} as const;

/** Play the run clip at native speed — avoids fast-leg / slow-body mismatch. */
export const BOWLER_RUN_CLIP_SCALE = 1.0;

export interface LocomotionSync {
  duration: number;
  clipTimeScale: number;
  yBob: { amplitude: number; period: number };
  cycles: number;
  groundSpeed: number;
}

export function getBowlerRunUpDistance(): number {
  return scenePositions.bowlerStartX - scenePositions.bowlerCreaseX;
}

/**
 * Lock leg cadence to native Mixamo run speed; derive travel duration from stride calibration.
 * groundSpeed = effectiveStride × clipTimeScale / cycleDuration
 */
export function syncRunLocomotion(distanceM: number): LocomotionSync {
  const { cycleDuration, effectiveStride } = CLIP_LOCOMOTION.run;
  const clipTimeScale = BOWLER_RUN_CLIP_SCALE;
  const groundSpeed = (effectiveStride * clipTimeScale) / cycleDuration;
  const duration = distanceM / groundSpeed;
  const cycles = distanceM / effectiveStride;
  const stepPeriod = cycleDuration / clipTimeScale;

  return {
    duration,
    clipTimeScale,
    yBob: { amplitude: 0.035, period: stepPeriod },
    cycles,
    groundSpeed,
  };
}

export function syncWalkStep(distanceM: number, duration: number): number {
  const { cycleDuration, effectiveStride } = CLIP_LOCOMOTION.walk;
  const scale = (distanceM / effectiveStride) * cycleDuration / duration;
  return Math.min(Math.max(scale, 0.6), 1.2);
}

/** Bowler run-up using the Cricketer Walk skeletal clip (legs synced to ground travel). */
export function syncCricketWalkRunUp(distanceM: number): LocomotionSync {
  const { cycleDuration, effectiveStride, clipTimeScale } = CLIP_LOCOMOTION.cricketWalkRunUp;
  const groundSpeed = (effectiveStride * clipTimeScale) / cycleDuration;
  const duration = distanceM / groundSpeed;
  const cycles = distanceM / effectiveStride;
  const stepPeriod = cycleDuration / clipTimeScale;

  return {
    duration,
    clipTimeScale,
    yBob: { amplitude: 0.028, period: stepPeriod },
    cycles,
    groundSpeed,
  };
}

/** Side-on cricket jog for Wolf3D procedural run-up (accelerating ~2.4→5.2 m/s). */
export function syncCricketBowlerRunUp(distanceM: number): LocomotionSync {
  const { startSpeed, peakSpeed, strideLength, stridePeriod } = CLIP_LOCOMOTION.cricketBowlerRunUp;
  const avgSpeed = (startSpeed + peakSpeed) / 2;
  const duration = distanceM / avgSpeed;
  const cycles = distanceM / strideLength;

  return {
    duration,
    clipTimeScale: 1,
    yBob: { amplitude: 0.028, period: stridePeriod },
    cycles,
    groundSpeed: avgSpeed,
  };
}
