import * as THREE from 'three';
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
  handForward?: { x: number; y: number; z: number };
}

/** +Z bind model — world-space forward from the bowling hand at release. */
export function getHandReleaseForward(hand: THREE.Object3D): THREE.Vector3 {
  hand.updateWorldMatrix(true, false);
  const q = new THREE.Quaternion();
  hand.getWorldQuaternion(q);
  return new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
}

/** Initial velocity from bowler release toward striker end (-X direction). */
export function computeReleaseVelocity(params: ReleaseParams): {
  x: number;
  y: number;
  z: number;
} {
  const speed = speedKmhToMs(params.speedKmh);
  const dx = scenePositions.strikerEndX - params.releaseWorldPos.x;
  const dy = 0.75 - params.releaseWorldPos.y;
  const dz = params.lineOffsetZ - params.releaseWorldPos.z;
  const targetLen = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const tx = dx / targetLen;
  const ty = dy / targetLen;
  const tz = dz / targetLen;

  let dirX: number;
  let dirY: number;
  let dirZ: number;

  if (params.handForward) {
    const hf = params.handForward;
    const hLen = Math.sqrt(hf.x * hf.x + hf.y * hf.y + hf.z * hf.z) || 1;
    const hx = hf.x / hLen;
    const hy = hf.y / hLen;
    const hz = hf.z / hLen;
    dirX = hx * 0.7 + tx * 0.3;
    dirY = hy * 0.7 + ty * 0.3 - 0.12;
    dirZ = hz * 0.7 + tz * 0.3;
    const dLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
    dirX /= dLen;
    dirY /= dLen;
    dirZ /= dLen;
  } else {
    dirX = tx * 0.95;
    dirY = ty * 0.95 - 0.05;
    dirZ = tz * 0.95;
  }

  return {
    x: dirX * speed,
    y: dirY * speed + 0.4,
    z: dirZ * speed,
  };
}

/** Impulse after bat contact for a SIX — high loft toward leg side. */
export function computeSixImpulse(): { x: number; y: number; z: number } {
  return { x: -32, y: 22, z: -8 };
}

export { GRAVITY, BALL_RADIUS };
