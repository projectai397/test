/** Meshy Animation API preset IDs — https://docs.meshy.ai/en/api/animation-library */
export const MESHY_BOWLER_ACTIONS = {
  walking: -2,
  running: -1,
  idle: 0,
  baseballPitching: 393,
} as const;

/** GLB clip name → Meshy action (for docs / scripts). */
export const MESHY_BOWLER_CLIP_MAP = {
  walk: 'Walking',
  run: 'Running',
  bowl: 'baseball_pitching',
} as const;
