import * as THREE from 'three';

export type PlayerRole = 'bowler' | 'batter' | 'keeper' | 'non_striker' | 'fielder' | 'umpire';
export type ModelProfile = 'mixamo' | 'cricket' | 'static';

export interface PlayerModelConfig {
  url: string;
  profile: ModelProfile;
  scale: number;
  rotationY: number;
  yOffset: number;
  color?: string;
  /** Skip recolouring mesh materials (textured cricket GLB). */
  skipKitRecolor?: boolean;
  /** Model already includes kit — only attach bat / minimal extras. */
  minimalGear?: boolean;
  /** Procedural cricket cap on head (team color). */
  showCap?: boolean;
}

/** Paid Fab Store umpire (manual GLB import) — trish.j2109 */
export const CRICKET_UMPIRE_STORE_UID = '85026f7cece84299bf4ddf90d3b0addc';
export const CRICKET_UMPIRE_STORE_URL =
  'https://sketchfab.com/3d-models/cricket-umpire-85026f7cece84299bf4ddf90d3b0addc';

export const MODEL_PATHS = {
  cricketPlayer: '/models/cricket-player.glb',
  cricketBatsman: '/models/cricket-batsman.glb',
  cricketKeeper: '/models/cricket-keeper.glb',
  /** Same as cricketPlayer — Indian Cricket Player + procedural umpire coat/hat (free). */
  cricketUmpire: '/models/cricket-player.glb',
} as const;

export const CLIPS = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
} as const;

export type ClipKey = keyof typeof CLIPS;

export const TEAM_KIT_RED = '#dc2626';

const CRICKET_BASE: Omit<PlayerModelConfig, 'url' | 'color'> = {
  profile: 'cricket',
  scale: 1,
  /** cricket-player.glb bind forward is −Z; controller group Y rotation handles pitch facing. */
  rotationY: 0,
  yOffset: 0,
  skipKitRecolor: false,
  minimalGear: true,
};

const ROLE_CONFIG: Record<PlayerRole, PlayerModelConfig> = {
  bowler: {
    ...CRICKET_BASE,
    url: MODEL_PATHS.cricketPlayer,
  },
  batter: {
    ...CRICKET_BASE,
    url: MODEL_PATHS.cricketPlayer,
  },
  keeper: {
    ...CRICKET_BASE,
    url: MODEL_PATHS.cricketPlayer,
  },
  non_striker: {
    ...CRICKET_BASE,
    url: MODEL_PATHS.cricketPlayer,
  },
  fielder: {
    ...CRICKET_BASE,
    url: MODEL_PATHS.cricketPlayer,
  },
  umpire: {
    ...CRICKET_BASE,
    url: MODEL_PATHS.cricketPlayer,
    color: '#ffffff',
    showCap: true,
  },
};

export function getPlayerModelConfig(role: PlayerRole, customUrl?: string): PlayerModelConfig {
  const base = ROLE_CONFIG[role];
  if (customUrl) return { ...base, url: customUrl };
  return base;
}

export function isCricketProfile(config: PlayerModelConfig): boolean {
  return config.profile === 'cricket';
}

export function isStaticProfile(config: PlayerModelConfig): boolean {
  return config.profile === 'static';
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
  const partial = names.find((n) => n.toLowerCase().includes(wanted));
  if (partial) return partial;

  if (key === 'walk') {
    const walkLike = names.find((n) => /walk|step|locomotion/i.test(n));
    if (walkLike) return walkLike;
    if (names.length === 1) return names[0] ?? null;
  }

  return null;
}

export function hasResolvedClip(
  actions: Record<string, THREE.AnimationAction | null | undefined>,
  key: ClipKey,
): boolean {
  return resolveClipName(actions, key) !== null;
}

/** First animation in a cricket GLB (usually idle / stance). */
export function resolveFirstClip(
  actions: Record<string, THREE.AnimationAction | null | undefined>,
): string | null {
  const names = Object.keys(actions).filter((n) => actions[n]);
  return names[0] ?? null;
}

/** Material names that are clothing only — never skin, hair, face, or body. */
const KIT_MATERIAL = /^Wolf3D_Outfit_(Top|Bottom|Footwear)$/i;

export function applyCricketKitLook(root: THREE.Object3D, teamColor?: string) {
  const kit = new THREE.Color(teamColor ?? TEAM_KIT_RED);
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const nextMats = mats.map((mat) => {
      if (!(mat instanceof THREE.MeshStandardMaterial)) return mat;
      if (!KIT_MATERIAL.test(mat.name ?? '')) return mat;

      const kitMat = mat.clone();
      kitMat.name = mat.name;
      kitMat.color.copy(kit);
      kitMat.map = null;
      kitMat.roughness = 0.65;
      kitMat.needsUpdate = true;
      return kitMat;
    });

    if (nextMats.some((m, i) => m !== mats[i])) {
      child.material = Array.isArray(child.material) ? nextMats : nextMats[0]!;
    }
  });
}

/** Umpire kit — white shirt, black trousers, light shoes (matches real umpire dress). */
export function applyUmpireKitLook(root: THREE.Object3D) {
  const parts: [RegExp, string][] = [
    [/Outfit_Top/i, '#ffffff'],
    [/Outfit_Bottom/i, '#1a1a1a'],
    [/Outfit_Footwear/i, '#f0f0f0'],
  ];

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const nextMats = mats.map((mat) => {
      if (!(mat instanceof THREE.MeshStandardMaterial)) return mat;
      const name = mat.name ?? '';
      const part = parts.find(([re]) => re.test(name));
      if (!part) return mat;

      const kitMat = mat.clone();
      kitMat.name = mat.name;
      kitMat.color.set(part[1]);
      kitMat.map = null;
      kitMat.roughness = 0.65;
      kitMat.needsUpdate = true;
      return kitMat;
    });

    if (nextMats.some((m, i) => m !== mats[i])) {
      child.material = Array.isArray(child.material) ? nextMats : nextMats[0]!;
    }
  });
}
