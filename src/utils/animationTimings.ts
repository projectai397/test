export const animationTimings = {
  idleDelay: 0.5,
  runUp: 2.8,
  bowlingAction: 1.0,
  ballFlight: 1.2,
  batterShot: 0.9,
  resultSix: 2.8,
  resultFour: 2.2,
  resultDot: 1.8,
  resultRuns: 2.4,
  resultWicket: 2.6,
  reset: 0.8,
  queueDelay: 0.4,
  demoOfflineDelay: 3,
} as const;

export const scenePositions = {
  /** Striker / batter end of the pitch (wickets at x=0). */
  strikerEndX: 0,
  /** Non-striker end — same end as the bowler (wickets at x=pitchLength). */
  nonStrikerEndX: 20.12,
  pitchWidth: 3.05,
  pitchLength: 20.12,

  /**
   * Bowler-end popping crease (1.22 m in from the stumps at x=pitchLength).
   * The bowler runs in from behind and delivers with the front foot here.
   */
  bowlerCreaseX: 20.12 - 1.22,

  /** Deep run-up start — metres behind the bowler-end stumps (shorter = less sprint-like). */
  bowlerRunUpDepth: 3.5,
  bowlerStartX: 20.12 + 3.5,
  bowlerStartZ: 0.5,

  strikerZ: 0,
  /** Keeper stands behind the striker-end stumps. */
  keeperOffsetX: -1.2,
  keeperOffsetZ: 0.3,
  /** Non-striker waits at the bowler end, off the pitch centre line. */
  nonStrikerOffsetZ: -0.8,
  /** Main umpire (bowler's end): metres behind bowler-end stumps, centred on the pitch. */
  umpireBehindStumps: 1.8,
  boundaryRadius: 45,
} as const;

export const cameraDefaults = {
  position: { x: 18, y: 4.5, z: 12 },
  lookAt: { x: 5, y: 1.2, z: 0 },
  fov: 45,
} as const;
