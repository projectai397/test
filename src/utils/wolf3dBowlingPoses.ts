/** Bone rotation deltas relative to Wolf3D bind pose (cricket-player.glb). */

export type BoneDelta = Partial<{ x: number; y: number; z: number }>;

export type BowlingPose = {
  hips?: BoneDelta;
  torso?: BoneDelta;
  legL?: BoneDelta;
  legR?: BoneDelta;
  lowerLegL?: BoneDelta;
  lowerLegR?: BoneDelta;
  armL?: BoneDelta;
  armR?: BoneDelta;
  foreArmL?: BoneDelta;
  foreArmR?: BoneDelta;
};

/** Side-on run-up — chest to +Z, slight forward lean, arms pumping. */
export const CRICKET_RUNUP_HOLD: BowlingPose = {
  hips: { x: 0.12, y: 0.06, z: 0.03 },
  torso: { x: 0.22, y: 0.08, z: 0.04 },
  armL: { x: 0.55, z: -0.22, y: 0.04 },
  foreArmL: { x: -0.28, z: -0.06 },
  armR: { x: 0.48, z: 0.12, y: -0.1 },
  foreArmR: { x: -0.55, z: 0.04 },
};

/** Stride keyframes — thigh + shin (jog cadence). */
export const CRICKET_RUNUP_STRIDES: Array<{
  legR: BoneDelta;
  lowerLegR: BoneDelta;
  legL: BoneDelta;
  lowerLegL: BoneDelta;
}> = [
  {
    legR: { x: 0.22, z: 0.03 },
    lowerLegR: { x: -0.28, z: 0.01 },
    legL: { x: -0.08, z: -0.02 },
    lowerLegL: { x: 0.1, z: 0 },
  },
  {
    legL: { x: 0.22, z: -0.03 },
    lowerLegL: { x: -0.28, z: -0.01 },
    legR: { x: -0.08, z: 0.02 },
    lowerLegR: { x: 0.1, z: 0 },
  },
  {
    legR: { x: 0.2, z: 0.03 },
    lowerLegR: { x: -0.26, z: 0.01 },
    legL: { x: -0.06, z: -0.02 },
    lowerLegL: { x: 0.08, z: 0 },
  },
  {
    legL: { x: 0.21, z: -0.03 },
    lowerLegL: { x: -0.27, z: -0.01 },
    legR: { x: -0.06, z: 0.02 },
    lowerLegR: { x: 0.08, z: 0 },
  },
  {
    legR: { x: 0.23, z: 0.03 },
    lowerLegR: { x: -0.29, z: 0.01 },
    legL: { x: -0.08, z: -0.02 },
    lowerLegL: { x: 0.1, z: 0 },
  },
  {
    legL: { x: 0.2, z: -0.03 },
    lowerLegL: { x: -0.26, z: -0.01 },
    legR: { x: -0.06, z: 0.02 },
    lowerLegR: { x: 0.08, z: 0 },
  },
];

/** Side-on fast-medium delivery — right-arm over the wicket. */
export const BOWLING_PHASES: Record<
  'gather' | 'bound' | 'plant' | 'release' | 'followThrough',
  BowlingPose
> = {
  gather: {
    hips: { x: 0.06, y: 0.08, z: 0.02 },
    torso: { x: 0.08, y: 0.1, z: 0.05 },
    legR: { x: 0.38, z: 0.04 },
    lowerLegR: { x: -0.18, z: 0.02 },
    legL: { x: 0.28, z: -0.05 },
    lowerLegL: { x: -0.14, z: -0.01 },
    armL: { x: 0.42, z: -0.18, y: 0.1 },
    foreArmL: { x: -0.22, z: -0.04 },
    armR: { x: 0.35, z: 0.02, y: -0.06 },
    foreArmR: { x: -0.72, z: 0.02 },
  },
  bound: {
    hips: { x: 0.02, y: 0.06, z: 0.02 },
    torso: { x: -0.08, y: 0.04, z: 0.06 },
    legR: { x: 0.55, z: 0.03 },
    lowerLegR: { x: -0.1, z: 0.01 },
    legL: { x: 0.12, z: -0.02 },
    lowerLegL: { x: -0.08, z: 0 },
    armL: { x: 0.32, z: -0.22, y: 0.14 },
    foreArmL: { x: -0.2, z: -0.02 },
    armR: { x: -1.35, z: -0.08, y: -0.12 },
    foreArmR: { x: -0.85, z: 0.02 },
  },
  plant: {
    hips: { x: -0.02, y: 0.02, z: 0.02 },
    torso: { x: -0.18, y: 0, z: 0.08 },
    legL: { x: 0.72, z: -0.08 },
    lowerLegL: { x: -0.26, z: -0.02 },
    legR: { x: 0.06, z: -0.03 },
    lowerLegR: { x: -0.1, z: 0.02 },
    armL: { x: -0.55, z: -0.02, y: 0.18 },
    foreArmL: { x: -0.42, z: 0.04 },
    armR: { x: -1.75, z: -0.14, y: -0.14 },
    foreArmR: { x: -0.98, z: -0.04 },
  },
  release: {
    hips: { x: 0.06, y: 0, z: 0.01 },
    torso: { x: 0.18, y: -0.02, z: 0.04 },
    legL: { x: 0.58, z: -0.06 },
    lowerLegL: { x: -0.16, z: -0.01 },
    legR: { x: 0.04, z: 0.04 },
    lowerLegR: { x: -0.06, z: 0.01 },
    armL: { x: -0.68, z: 0.02, y: 0.14 },
    foreArmL: { x: -0.48, z: 0.02 },
    armR: { x: -0.28, z: -0.06, y: -0.08 },
    foreArmR: { x: -0.38, z: -0.1 },
  },
  followThrough: {
    hips: { x: 0.1, y: 0, z: 0 },
    torso: { x: 0.36, y: -0.04, z: 0.02 },
    legL: { x: 0.32, z: -0.04 },
    lowerLegL: { x: -0.12, z: 0 },
    legR: { x: -0.02, z: 0.06 },
    lowerLegR: { x: 0.04, z: 0.02 },
    armL: { x: -0.05, z: 0.02, y: -0.02 },
    foreArmL: { x: -0.1, z: 0.02 },
    armR: { x: 0.65, z: -0.12, y: 0.06 },
    foreArmR: { x: 0.28, z: -0.14 },
  },
};
