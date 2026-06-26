import { scenePositions } from './animationTimings';

/**
 * Pitch runs along +X (striker end x=0, bowler end x=pitchLength).
 * cricket-player.glb bind forward is +Z at rotationY=0.
 */

/** Optional global correction if a swapped GLB faces the opposite way. */
export const MODEL_FACING_OFFSET = 0;

/** Y rotation so a +Z-forward model looks from (fromX, fromZ) toward (toX, toZ). */
export function facingToward(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): number {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  return Math.atan2(dx, dz) + MODEL_FACING_OFFSET;
}

const strikerX = scenePositions.strikerEndX;
const strikerZ = scenePositions.strikerZ;
const bowlerEndX = scenePositions.nonStrikerEndX;

/** Face toward the striker end (−X) — bowler run-up, umpire. */
export const towardStriker = facingToward(bowlerEndX, 0, strikerX, strikerZ);

/** Face toward the bowler end (+X) — batter and keeper. */
export const towardBowler = facingToward(strikerX, strikerZ, bowlerEndX, 0);

/** RHB non-striker side-on at bowler end — body across pitch, off-side (+Z). */
export const sideOnOffSide = 0 + MODEL_FACING_OFFSET;

export const PITCH_FACING = {
  towardStriker,
  towardBowler,
  sideOnOffSide,
  /** Main umpire at bowler's end — faces down the pitch toward the striker. */
  bowlersEndUmpire: towardStriker,
} as const;

/** Face the batsman from a fielding position. */
export function facingStrikerFrom(x: number, z: number): number {
  return facingToward(x, z, strikerX, strikerZ);
}
