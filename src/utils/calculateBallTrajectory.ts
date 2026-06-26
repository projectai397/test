import type {
  DeliveryAnimationParams,
  TrajectoryPoint,
  Vec3,
} from '../types/cricket-ball-event';
import { scenePositions } from './animationTimings';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

export function calculateDeliveryTrajectory(
  params: DeliveryAnimationParams,
): TrajectoryPoint[] {
  const { releasePoint, contactPoint, bounceDistance, bounceHeight, swingAmount } =
    params;

  const bounceX = scenePositions.strikerEndX + bounceDistance * 0.2;
  const bouncePoint: Vec3 = {
    x: bounceX,
    y: bounceHeight,
    z: contactPoint.z + Math.sin(bounceDistance * 0.1) * swingAmount,
  };

  const preBounceMid: Vec3 = {
    x: lerp(releasePoint.x, bouncePoint.x, 0.5),
    y: lerp(releasePoint.y, bouncePoint.y, 0.5) + 0.8,
    z: lerp(releasePoint.z, bouncePoint.z, 0.5),
  };

  const postBounce: Vec3 = {
    x: scenePositions.strikerEndX + 0.3,
    y: bounceHeight * 0.6 + 0.5,
    z: contactPoint.z,
  };

  const points: TrajectoryPoint[] = [
    { t: 0, ...releasePoint },
    { t: 0.35, ...preBounceMid },
    { t: 0.65, ...bouncePoint },
    { t: 0.85, ...postBounce },
    { t: 1, x: scenePositions.strikerEndX + 0.1, y: 1.0, z: contactPoint.z },
  ];

  return points;
}

export function sampleTrajectory(
  points: TrajectoryPoint[],
  progress: number,
): Vec3 {
  if (points.length === 0) return { x: 0, y: 0, z: 0 };
  if (progress <= 0) return { x: points[0].x, y: points[0].y, z: points[0].z };
  if (progress >= 1) {
    const last = points[points.length - 1];
    return { x: last.x, y: last.y, z: last.z };
  }

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (progress >= a.t && progress <= b.t) {
      const localT = (progress - a.t) / (b.t - a.t);
      return lerpVec3(a, b, localT);
    }
  }

  const last = points[points.length - 1];
  return { x: last.x, y: last.y, z: last.z };
}

export function mergeTrajectories(
  delivery: TrajectoryPoint[],
  postContact: TrajectoryPoint[],
): TrajectoryPoint[] {
  const merged = delivery.map((p) => ({ ...p, t: p.t * 0.55 }));
  const offset = merged[merged.length - 1]?.t ?? 0.55;

  postContact.forEach((p) => {
    merged.push({
      ...p,
      t: offset + p.t * (1 - offset),
    });
  });

  return merged;
}

export function getBallRadius(): number {
  return 0.036;
}
