import { getBallRadius } from './calculateBallTrajectory';
import { scenePositions } from './animationTimings';

const GRAVITY = 9.81;
const BALL_RADIUS = getBallRadius();

/** Convert km/h to m/s */
export function speedKmhToMs(kmh: number): number {
  return (kmh * 1000) / 3600;
}

export interface ReleaseParams {
  speedKmh: number;
  lineOffsetZ: number;
  releaseWorldPos: { x: number; y: number; z: number };
}

/** Initial velocity from bowler release toward striker end (-X direction). */
export function computeReleaseVelocity(params: ReleaseParams): {
  x: number;
  y: number;
  z: number;
} {
  const speed = speedKmhToMs(params.speedKmh);
  const dx = scenePositions.strikerEndX - params.releaseWorldPos.x;
  const dy = 0.8 - params.releaseWorldPos.y;
  const dz = params.lineOffsetZ - params.releaseWorldPos.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  return {
    x: (dx / dist) * speed * 0.92,
    y: (dy / dist) * speed * 0.92 + 1.2,
    z: (dz / dist) * speed * 0.92,
  };
}

/** Impulse after bat contact for a SIX — high loft toward leg side. */
export function computeSixImpulse(): { x: number; y: number; z: number } {
  return { x: -32, y: 22, z: -8 };
}

export { GRAVITY, BALL_RADIUS };
