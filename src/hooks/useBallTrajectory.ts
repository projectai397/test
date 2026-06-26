import { useMemo } from 'react';
import type { CricketBallEvent } from '../types/cricket-ball-event';
import {
  calculateDeliveryTrajectory,
  mergeTrajectories,
} from '../utils/calculateBallTrajectory';
import { mapDeliveryToAnimation } from '../utils/mapDeliveryToAnimation';
import { mapResultToShot } from '../utils/mapResultToShot';

export function useBallTrajectory(event: CricketBallEvent | null) {
  return useMemo(() => {
    if (!event) return null;

    const deliveryParams = mapDeliveryToAnimation(
      event.delivery,
      event.bowler.type,
    );
    const deliveryPoints = calculateDeliveryTrajectory(deliveryParams);
    const shotParams = mapResultToShot(
      event.result,
      deliveryParams.contactPoint.z,
    );
    const fullTrajectory = mergeTrajectories(
      deliveryPoints,
      shotParams.postContactPoints,
    );

    return {
      deliveryParams,
      deliveryPoints,
      shotParams,
      fullTrajectory,
      contactProgress: deliveryPoints[deliveryPoints.length - 1]?.t ?? 0.55,
    };
  }, [event]);
}
