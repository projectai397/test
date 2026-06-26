import { scenePositions } from './animationTimings';
import { PITCH_FACING } from './playerFacing';

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
  return {
    x: scenePositions.nonStrikerEndX + scenePositions.umpireBehindStumps,
    y: 0,
    z: 0,
    facingY: PITCH_FACING.bowlersEndUmpire,
  };
}
