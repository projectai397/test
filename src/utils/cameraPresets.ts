import type { Vec3 } from '../types/cricket-ball-event';
import { scenePositions } from './animationTimings';

export type CameraViewPreset =
  | 'broadcast'
  | 'side_on'
  | 'behind_bowler'
  | 'behind_batter'
  | 'end_on'
  | 'high'
  | 'low'
  | 'free';

export interface CameraPresetConfig {
  id: CameraViewPreset;
  label: string;
  shortLabel: string;
  position: Vec3;
  lookAt: Vec3;
  fov?: number;
}

const pitchCenter: Vec3 = {
  x: scenePositions.pitchLength / 2,
  y: 1.1,
  z: 0,
};

const strikerCrease: Vec3 = { x: scenePositions.strikerEndX, y: 1.2, z: 0 };
const bowlerCrease: Vec3 = { x: scenePositions.bowlerCreaseX, y: 1.2, z: 0 };

export const CAMERA_PRESETS: CameraPresetConfig[] = [
  {
    id: 'broadcast',
    label: 'Broadcast',
    shortLabel: 'TV',
    position: { x: 18, y: 4.5, z: 12 },
    lookAt: { x: 5, y: 1.2, z: 0 },
  },
  {
    id: 'side_on',
    label: 'Side On',
    shortLabel: 'Side',
    position: { x: pitchCenter.x, y: 3.8, z: 22 },
    lookAt: pitchCenter,
  },
  {
    id: 'behind_bowler',
    label: 'Behind Bowler',
    shortLabel: 'Bowler',
    position: { x: scenePositions.bowlerStartX + 2, y: 2.8, z: 4 },
    lookAt: strikerCrease,
  },
  {
    id: 'behind_batter',
    label: 'Behind Batter',
    shortLabel: 'Batter',
    position: { x: -6, y: 2.6, z: -3 },
    lookAt: bowlerCrease,
  },
  {
    id: 'end_on',
    label: 'End On',
    shortLabel: 'End',
    position: { x: -14, y: 2.5, z: 0 },
    lookAt: bowlerCrease,
  },
  {
    id: 'high',
    label: 'High Angle',
    shortLabel: 'High',
    position: { x: pitchCenter.x, y: 28, z: 8 },
    lookAt: pitchCenter,
    fov: 50,
  },
  {
    id: 'low',
    label: 'Low Angle',
    shortLabel: 'Low',
    position: { x: 8, y: 0.9, z: 18 },
    lookAt: strikerCrease,
    fov: 42,
  },
  {
    id: 'free',
    label: 'Free Roam',
    shortLabel: 'Free',
    position: { x: 18, y: 4.5, z: 12 },
    lookAt: pitchCenter,
  },
];

export function getCameraPreset(id: CameraViewPreset): CameraPresetConfig {
  return CAMERA_PRESETS.find((p) => p.id === id) ?? CAMERA_PRESETS[0];
}

export const ORBIT_TARGET: Vec3 = pitchCenter;

export function isAnimationActive(animationState: string): boolean {
  return [
    'bowler_runup',
    'bowling_action',
    'ball_released',
    'batter_shot',
    'result_animation',
    'reset',
  ].includes(animationState);
}

export function isCinematicCameraMode(mode: string): boolean {
  return !['broadcast', 'reset'].includes(mode);
}
