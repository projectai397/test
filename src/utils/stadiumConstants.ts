import { scenePositions } from './animationTimings';

export const STADIUM_CENTER_X = scenePositions.pitchLength / 2;

/** Oval stand ellipse radii (metres). */
export const STADIUM_RX = 58;
export const STADIUM_RZ = 50;

export const STAND_SEGMENTS = 56;
export const STAND_INNER_R = 46;
export const STAND_SEGMENT_WIDTH = 5.8;
export const STAND_DEPTH = 2.4;

export const TIER_HEIGHTS = [3.8, 3.4, 3.2] as const;
/** Lower red, middle royal blue, upper orange — IPL-style tiers. */
export const TIER_COLORS = ['#e63232', '#1a4fc4', '#f5820a'] as const;

export const FLOODLIGHT_COUNT = 6;
export const FLOODLIGHT_RADIUS = 64;
export const FLOODLIGHT_TOWER_HEIGHT = 28;

/** Auto-orbit camera constants (optional showcase mode). */
export const ORBIT_CAM_RADIUS = 36;
export const ORBIT_CAM_HEIGHT = 22;
export const ORBIT_CAM_SPEED = 0.06;
export const ORBIT_LOOK_AT_Y = 0.9;
