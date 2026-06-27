/**
 * Cricket bowling pose deltas scaled for Meshy / Mixamo rigs.
 * Wolf3D deltas are too extreme on the Meshy skeleton.
 */
import type { BowlingPose } from './wolf3dBowlingPoses';
import { BOWLING_PHASES, CRICKET_RUNUP_HOLD } from './wolf3dBowlingPoses';

const SCALE = 0.72;

function scaleDelta(delta: Partial<{ x: number; y: number; z: number }> | undefined) {
  if (!delta) return delta;
  return {
    x: delta.x !== undefined ? delta.x * SCALE : undefined,
    y: delta.y !== undefined ? delta.y * SCALE : undefined,
    z: delta.z !== undefined ? delta.z * SCALE : undefined,
  };
}

function scalePose(pose: BowlingPose): BowlingPose {
  return {
    hips: scaleDelta(pose.hips),
    torso: scaleDelta(pose.torso),
    legL: scaleDelta(pose.legL),
    legR: scaleDelta(pose.legR),
    lowerLegL: scaleDelta(pose.lowerLegL),
    lowerLegR: scaleDelta(pose.lowerLegR),
    armL: scaleDelta(pose.armL),
    armR: scaleDelta(pose.armR),
    foreArmL: scaleDelta(pose.foreArmL),
    foreArmR: scaleDelta(pose.foreArmR),
  };
}

export const MESHY_BOWLING_PHASES = {
  gather: scalePose(BOWLING_PHASES.gather),
  bound: scalePose(BOWLING_PHASES.bound),
  plant: scalePose(BOWLING_PHASES.plant),
  release: scalePose(BOWLING_PHASES.release),
  followThrough: scalePose(BOWLING_PHASES.followThrough),
} as const;

export const MESHY_RUNUP_HOLD = scalePose(CRICKET_RUNUP_HOLD);
