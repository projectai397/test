import { scenePositions } from './animationTimings';
import { isMeshyBowlerUrl } from './playerModels';

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

/** RHB over-the-wicket run-up: chest to off side (+Z), run direction −X. */
export const bowlerRunUpSideOn = sideOnOffSide;

/** Run toward the striker end while facing down the pitch. */
export const bowlerRunUpTowardBatsman = towardStriker;

/** At delivery release: chest toward the striker end. */
export const bowlerDeliveryFrontOn = towardStriker;

/** Y rotation for the bowler group — faces the batsman end. */
export function bowlerFacingTowardStriker(_modelUrl?: string): number {
  return towardStriker;
}

/**
 * Meshy baseball_pitching releases along model +X. With the outer group at towardStriker
 * (−π/2), that axis points at mid-off (+Z). Add −π/2 on the inner model group so the
 * release line aligns down the pitch toward the batsman (−X).
 */
export function meshyBowlerDeliveryInnerRotation(modelUrl?: string): number {
  return modelUrl && isMeshyBowlerUrl(modelUrl) ? -Math.PI / 2 : 0;
}

export const PITCH_FACING = {
  towardStriker,
  towardBowler,
  sideOnOffSide,
  bowlerRunUpSideOn,
  bowlerRunUpTowardBatsman,
  bowlerDeliveryFrontOn,
  /** Main umpire at bowler's end — faces down the pitch toward the striker. */
  bowlersEndUmpire: towardStriker,
} as const;

/** Face the batsman from a fielding position. */
export function facingStrikerFrom(x: number, z: number): number {
  return facingToward(x, z, strikerX, strikerZ);
}
