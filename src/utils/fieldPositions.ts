import type { FielderConfig, FieldPositionPreset } from '../types/match-config';
import { isFieldPositionPreset } from '../types/match-config';
import { facingStrikerFrom } from './playerFacing';

export interface ResolvedFieldPosition {
  x: number;
  z: number;
  facingY: number;
}

interface FieldPreset {
  x: number;
  z: number;
  /** Cricket-tuned facing; defaults to face the striker if omitted. */
  facingY?: number;
}

const PRESETS: Record<FieldPositionPreset, FieldPreset> = {
  slip: { x: -1.8, z: 3.2, facingY: facingStrikerFrom(-1.8, 3.2) },
  gully: { x: 0.5, z: 5.5, facingY: facingStrikerFrom(0.5, 5.5) },
  point: { x: 6, z: 11, facingY: facingStrikerFrom(6, 11) },
  cover: { x: 9, z: 9, facingY: facingStrikerFrom(9, 9) },
  midOff: { x: 14, z: 7, facingY: facingStrikerFrom(14, 7) },
  midOn: { x: 12, z: -7, facingY: facingStrikerFrom(12, -7) },
  squareLeg: { x: 5, z: -9, facingY: facingStrikerFrom(5, -9) },
  fineLeg: { x: -1.5, z: -6, facingY: facingStrikerFrom(-1.5, -6) },
  thirdMan: { x: -2.5, z: 14, facingY: facingStrikerFrom(-2.5, 14) },
};

export function resolveFieldPosition(fielder: FielderConfig): ResolvedFieldPosition {
  let x: number;
  let z: number;
  let presetFacing: number | undefined;

  if (fielder.x !== undefined && fielder.z !== undefined) {
    x = fielder.x;
    z = fielder.z;
  } else if (isFieldPositionPreset(fielder.position)) {
    const preset = PRESETS[fielder.position];
    x = preset.x;
    z = preset.z;
    presetFacing = preset.facingY;
  } else {
    console.warn(`[FieldPositions] Unknown preset "${fielder.position}" — using cover`);
    x = PRESETS.cover.x;
    z = PRESETS.cover.z;
    presetFacing = PRESETS.cover.facingY;
  }

  const facingY = fielder.facing ?? presetFacing ?? facingStrikerFrom(x, z);
  return { x, z, facingY };
}
