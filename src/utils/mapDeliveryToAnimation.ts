import type {
  DeliveryInfo,
  DeliveryAnimationParams,
  Vec3,
} from '../types/cricket-ball-event';
import { scenePositions } from './animationTimings';

const LINE_OFFSETS: Record<DeliveryInfo['line'], number> = {
  outside_off: 0.35,
  off_stump: 0.15,
  middle: 0,
  leg_stump: -0.15,
  wide: 0.55,
};

const LENGTH_BOUNCE: Record<
  DeliveryInfo['length'],
  { distance: number; height: number }
> = {
  yorker: { distance: 1.2, height: 0.05 },
  full: { distance: 3.5, height: 0.15 },
  good_length: { distance: 5.0, height: 0.25 },
  short: { distance: 7.0, height: 0.55 },
  bouncer: { distance: 6.5, height: 1.1 },
};

const BOUNCE_MULTIPLIER: Record<DeliveryInfo['bounce'], number> = {
  normal: 1,
  low: 0.6,
  high: 1.4,
};

export function mapDeliveryToAnimation(
  delivery: DeliveryInfo,
  bowlerType: string = 'medium_fast',
): DeliveryAnimationParams {
  const speed = delivery.speed || 132;
  const speedFactor = Math.max(0.75, Math.min(1.35, speed / 132));
  const lengthConfig = LENGTH_BOUNCE[delivery.length] ?? LENGTH_BOUNCE.good_length;
  const bounceMult = BOUNCE_MULTIPLIER[delivery.bounce] ?? 1;

  const lineOffsetZ = LINE_OFFSETS[delivery.line] ?? 0;
  const bounceDistance = lengthConfig.distance;
  const bounceHeight = lengthConfig.height * bounceMult;

  let flightDuration = 1.2 / speedFactor;
  if (bowlerType === 'spin') {
    flightDuration *= 1.35;
  }

  const releasePoint: Vec3 = {
    x: scenePositions.bowlerCreaseX,
    y: 2.1,
    z: lineOffsetZ * 0.3,
  };

  const contactPoint: Vec3 = {
    x: scenePositions.strikerEndX + bounceDistance * 0.15,
    y: bounceHeight,
    z: lineOffsetZ,
  };

  const swingAmount =
    bowlerType === 'spin' ? 0.25 : delivery.line === 'outside_off' ? 0.08 : 0.04;

  return {
    lineOffsetZ,
    bounceDistance,
    bounceHeight,
    flightDuration,
    swingAmount,
    releasePoint,
    contactPoint,
  };
}

export function formatDeliveryType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
