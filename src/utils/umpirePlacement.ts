import { scenePositions } from './animationTimings';
import { PITCH_FACING } from './playerFacing';

export interface ResolvedUmpirePlacement {
  x: number;
  y: number;
  z: number;
  facingY: number;
}

/**
 * Square-leg field umpire — leg side, in line with the striker's end (not at the bowling end).
 * Faces down the pitch toward the bowler.
 */
export function resolveUmpirePlacement(position?: {
  x: number;
  y: number;
  z: number;
}): ResolvedUmpirePlacement {
  const x = position?.x ?? scenePositions.umpireX;
  const y = position?.y ?? 0;
  const z = position?.z ?? scenePositions.umpireZ;

  return {
    x,
    y,
    z,
    facingY: PITCH_FACING.squareLegUmpire,
  };
}
