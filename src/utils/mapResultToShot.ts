import type {
  ResultInfo,
  ShotAnimationParams,
  TrajectoryPoint,
} from '../types/cricket-ball-event';

function buildSixTrajectory(contactZ: number): TrajectoryPoint[] {
  return [
    { t: 0, x: 0.5, y: 1.2, z: contactZ },
    { t: 0.3, x: -2, y: 8, z: contactZ - 1 },
    { t: 0.6, x: -8, y: 22, z: contactZ - 3 },
    { t: 1, x: -18, y: 12, z: contactZ - 6 },
    { t: 1.2, x: -28, y: 4, z: contactZ - 8 },
  ];
}

/** v1: all deliveries play as a SIX */
export function mapResultToShot(
  _result?: Partial<ResultInfo> | null,
  contactZ = 0,
): ShotAnimationParams {
  return {
    resultType: 'six',
    runs: 6,
    isWicket: false,
    postContactPoints: buildSixTrajectory(contactZ),
    contactTime: 0,
  };
}

export function getResultDisplayText(): string {
  return 'SIX';
}

export function getResultDuration(): number {
  return 2.8;
}

export function getCameraModeForResult(): 'follow_six' {
  return 'follow_six';
}
