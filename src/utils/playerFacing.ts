/**
 * Pitch runs along +X (striker end x=0, bowler end x=pitchLength).
 * Mixamo soldier bind pose faces +Z; these Y rotations align roles with cricket.
 */
export const PITCH_FACING = {
  /** Face toward the striker end (-X) — bowler run-up, non-striker watching. */
  towardStriker: Math.PI / 2,
  /** Face toward the bowler end (+X) — batter and keeper. */
  towardBowler: -Math.PI / 2,
  /** Square-leg umpire at striker end, leg side — watches down the pitch toward the bowler. */
  squareLegUmpire: -Math.PI / 2,
} as const;
