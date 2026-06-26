import * as THREE from 'three';

export type PlayerRole = 'bowler' | 'batter' | 'keeper' | 'non_striker';

export interface PlayerModelConfig {
  url: string;
  scale: number;
  rotationY: number;
  yOffset: number;
  color?: string;
}

/** Mixamo Soldier from Three.js examples — rigged human with Idle/Walk/Run. */
export const MODEL_PATHS = {
  soldier: '/models/soldier.glb',
  /** Drop Sketchfab "Indian Cricket Player - Rigged" (CC Attribution) here */
  cricketPlayer: '/models/cricket-player-custom.glb',
} as const;

export const DEFAULT_PLAYER_MODEL = MODEL_PATHS.soldier;

export const CLIPS = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
} as const;

export type ClipKey = keyof typeof CLIPS;

const ROLE_CONFIG: Record<PlayerRole, PlayerModelConfig> = {
  bowler: { url: DEFAULT_PLAYER_MODEL, scale: 1, rotationY: 0, yOffset: 0, color: '#dc2626' },
  batter: { url: DEFAULT_PLAYER_MODEL, scale: 1, rotationY: 0, yOffset: 0, color: '#2563eb' },
  keeper: { url: DEFAULT_PLAYER_MODEL, scale: 1, rotationY: 0, yOffset: 0, color: '#059669' },
  non_striker: { url: DEFAULT_PLAYER_MODEL, scale: 1, rotationY: 0, yOffset: 0, color: '#2563eb' },
};

export function getPlayerModelConfig(role: PlayerRole, customUrl?: string): PlayerModelConfig {
  const base = ROLE_CONFIG[role];
  if (customUrl) return { ...base, url: customUrl };
  return base;
}

export const BONE_NAMES = {
  hips: 'Hips',
  spine: 'Spine',
  leftArm: 'LeftArm',
  rightArm: 'RightArm',
  rightHand: 'RightHand',
  leftUpLeg: 'LeftUpLeg',
  rightUpLeg: 'RightUpLeg',
  head: 'Head',
} as const;

export function findBone(root: THREE.Object3D, fragment: string): THREE.Bone | null {
  const needle = fragment.toLowerCase();
  let found: THREE.Bone | null = null;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Bone)) return;
    const name = obj.name.toLowerCase();
    if (name === needle || name.endsWith(`:${needle}`) || name.endsWith(needle)) {
      found = obj;
    }
  });
  return found;
}

/** Match Idle/Run/Walk regardless of clip casing or mixamorig prefix in the GLB. */
export function resolveClipName(
  actions: Record<string, THREE.AnimationAction | null | undefined>,
  key: ClipKey,
): string | null {
  const wanted = CLIPS[key].toLowerCase();
  const names = Object.keys(actions).filter((n) => actions[n]);
  const exact = names.find((n) => n.toLowerCase() === wanted);
  if (exact) return exact;
  return names.find((n) => n.toLowerCase().includes(wanted)) ?? null;
}

export function applyCricketKitLook(root: THREE.Object3D, teamColor?: string) {
  const kit = new THREE.Color(teamColor ?? '#f8f6ef');
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (/visor|helmet|cap/i.test(child.name)) {
      child.visible = false;
      return;
    }
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat) => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.color.lerp(kit, 0.55);
        mat.roughness = Math.min(mat.roughness, 0.72);
      }
    });
  });
}
