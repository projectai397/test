import { scenePositions } from './animationTimings';
import { facingToward } from './playerFacing';

export interface ResolvedUmpirePlacement {
  x: number;
  y: number;
  z: number;
  facingY: number;
}

/**
 * Main umpire at the bowler's end — centred behind the stumps, in line with the pitch
 * (as in real cricket). Faces down the pitch toward the striker.
 */
export function resolveUmpirePlacement(): ResolvedUmpirePlacement {
  const x = scenePositions.nonStrikerEndX + scenePositions.umpireBehindStumps;
  const z = 0;
  return {
    x,
    y: 0,
    z,
    facingY: facingToward(x, z, scenePositions.strikerEndX, scenePositions.strikerZ),
  };
}
