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
  strikerEndX: 0,
  bowlerCreaseX: 10.06,
  nonStrikerEndX: 20.12,
  /** Bowler starts far right end — long run-up toward batter */
  bowlerStartX: 19,
  bowlerStartZ: 0.5,
  strikerZ: 0,
  keeperOffsetX: -1.2,
  keeperOffsetZ: 0.3,
  nonStrikerOffsetZ: -0.8,
  pitchWidth: 3.05,
  pitchLength: 20.12,
  boundaryRadius: 45,
} as const;

export const cameraDefaults = {
  position: { x: 18, y: 4.5, z: 12 },
  lookAt: { x: 5, y: 1.2, z: 0 },
  fov: 45,
} as const;
