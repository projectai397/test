import { scenePositions } from './animationTimings';
import type { FielderConfig, FieldPositionPreset } from '../types/match-config';
import { isFieldPositionPreset } from '../types/match-config';

export interface ResolvedFieldPosition {
  x: number;
  z: number;
  facingY: number;
}

const pitchCentreX = scenePositions.pitchLength / 2;

/** Face toward pitch centre from a fielding spot. */
function facingPitchCentre(x: number, z: number): number {
  return Math.atan2(pitchCentreX - x, -z);
}

const PRESETS: Record<FieldPositionPreset, { x: number; z: number }> = {
  slip: { x: -1.8, z: 3.2 },
  gully: { x: 0.5, z: 5.5 },
  point: { x: 6, z: 11 },
  cover: { x: 9, z: 9 },
  midOff: { x: 14, z: 7 },
  midOn: { x: 12, z: -7 },
  squareLeg: { x: 5, z: -9 },
  fineLeg: { x: -1.5, z: -6 },
  thirdMan: { x: -2.5, z: 14 },
};

export function resolveFieldPosition(fielder: FielderConfig): ResolvedFieldPosition {
  let x: number;
  let z: number;

  if (fielder.x !== undefined && fielder.z !== undefined) {
    x = fielder.x;
    z = fielder.z;
  } else if (isFieldPositionPreset(fielder.position)) {
    const preset = PRESETS[fielder.position];
    x = preset.x;
    z = preset.z;
  } else {
    console.warn(`[FieldPositions] Unknown preset "${fielder.position}" — using cover`);
    x = PRESETS.cover.x;
    z = PRESETS.cover.z;
  }

  const facingY = fielder.facing ?? facingPitchCentre(x, z);
  return { x, z, facingY };
}
