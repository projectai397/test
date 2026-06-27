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

/** Unit vector from release point down the pitch toward the striker end. */
export function pitchDirectionTowardStriker(
  releaseWorldPos: { x: number; y: number; z: number },
  lineOffsetZ: number,
): THREE.Vector3 {
  const dx = scenePositions.strikerEndX - releaseWorldPos.x;
  const dy = 0.75 - releaseWorldPos.y;
  const dz = lineOffsetZ - releaseWorldPos.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  return new THREE.Vector3(dx / len, dy / len, dz / len);
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
  const pitchDir = pitchDirectionTowardStriker(params.releaseWorldPos, params.lineOffsetZ);

  let dirX = pitchDir.x;
  let dirY = pitchDir.y - 0.06;
  let dirZ = pitchDir.z;

  if (params.handForward) {
    const hf = params.handForward;
    const hLen = Math.sqrt(hf.x * hf.x + hf.y * hf.y + hf.z * hf.z) || 1;
    const hy = hf.y / hLen;
    const hz = hf.z / hLen;
    // Hand pose only nudges height and line — pitch always travels toward the batsman.
    dirY = hy * 0.25 + pitchDir.y * 0.75 - 0.06;
    dirZ = hz * 0.35 + pitchDir.z * 0.65;
  }

  const dLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
  return {
    x: (dirX / dLen) * speed,
    y: (dirY / dLen) * speed + 0.4,
    z: (dirZ / dLen) * speed,
  };
}

/** Impulse after bat contact for a SIX — high loft toward leg side. */
export function computeSixImpulse(): { x: number; y: number; z: number } {
  return { x: -32, y: 22, z: -8 };
}

export { GRAVITY, BALL_RADIUS };
