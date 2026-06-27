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
  /** Trousers / pads tint — defaults to darker shade of color. */
  trouserColor?: string;
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
  /** Meshy rig — Running, Walking, baseball_pitching clips. */
  meshyBowler: '/models/meshy-bowler.glb',
} as const;

export const CLIPS = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
  /** Meshy baseball_pitching — used as bowling delivery. */
  bowl: 'bowl',
} as const;

export type ClipKey = keyof typeof CLIPS;

export const TEAM_KIT_RED = '#dc2626';

const CRICKET_BASE: Omit<PlayerModelConfig, 'url' | 'color'> = {
  profile: 'cricket',
  scale: 1,
  /** cricket-player.glb bind forward is +Z; controller group Y rotation handles pitch facing. */
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
  if (!customUrl) return base;
  if (isMeshyBowlerUrl(customUrl)) {
    return {
      ...base,
      url: customUrl,
      profile: 'mixamo',
      skipKitRecolor: true,
      minimalGear: true,
      scale: 1,
      rotationY: 0,
    };
  }
  return { ...base, url: customUrl };
}

export function isCricketProfile(config: PlayerModelConfig): boolean {
  return config.profile === 'cricket';
}

export function isMixamoProfile(config: PlayerModelConfig): boolean {
  return config.profile === 'mixamo';
}

export function isMeshyBowlerUrl(url: string): boolean {
  return url.includes('meshy-bowler');
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

  if (key === 'run') {
    const runLike = names.find((n) => /^running$/i.test(n));
    if (runLike) return runLike;
    const runPartial = names.find((n) => /(^run|_run)/i.test(n) && !/walk/i.test(n));
    if (runPartial) return runPartial;
  }

  if (key === 'bowl') {
    const bowlLike = names.find((n) => /pitch|bowl|throw|deliver/i.test(n));
    if (bowlLike) return bowlLike;
  }

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

export function getClipDuration(
  actions: Record<string, THREE.AnimationAction | null | undefined>,
  key: ClipKey,
): number | null {
  const name = resolveClipName(actions, key);
  const action = name ? actions[name] : null;
  if (!action) return null;
  return action.getClip().duration;
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

/** Slim oversized Meshy shoulder geometry toward natural human proportions. */
export function applyMeshyProportions(root: THREE.Object3D): void {
  const scaleBone = (fragment: string, scale: THREE.Vector3) => {
    const bone = findBone(root, fragment);
    if (!bone) return;
    bone.scale.multiply(scale);
    bone.updateMatrixWorld(true);
  };

  const narrow = new THREE.Vector3(0.74, 0.9, 0.74);
  const arm = new THREE.Vector3(0.86, 0.94, 0.86);
  const upperChest = new THREE.Vector3(0.9, 1, 0.9);

  scaleBone('LeftShoulder', narrow);
  scaleBone('RightShoulder', narrow);
  scaleBone('LeftArm', arm);
  scaleBone('RightArm', arm);
  scaleBone('Spine02', upperChest);
  scaleBone('Spine01', new THREE.Vector3(0.94, 1, 0.94));

  root.traverse((obj) => {
    if (!(obj instanceof THREE.SkinnedMesh)) return;
    obj.skeleton.bones.forEach((bone) => bone.updateMatrixWorld(true));
    obj.skeleton.update();
  });
}

/** Drop A-pose arms to a natural relaxed side stance (Meshy bind pose is arms-out). */
export function applyMeshyNeutralStance(root: THREE.Object3D): void {
  const rotateBone = (fragment: string, x: number, y: number, z: number) => {
    const bone = findBone(root, fragment);
    if (!bone) return;
    bone.rotation.x += x;
    bone.rotation.y += y;
    bone.rotation.z += z;
    bone.updateMatrixWorld(true);
  };

  // Meshy/Mixamo A-pose → arms hanging at sides
  rotateBone('LeftShoulder', 0, 0, 0.12);
  rotateBone('RightShoulder', 0, 0, -0.12);
  rotateBone('LeftArm', 0.06, 0, 0.92);
  rotateBone('RightArm', 0.06, 0, -0.92);
  rotateBone('LeftForeArm', 0, 0.18, 0);
  rotateBone('RightForeArm', 0, -0.18, 0);

  root.traverse((obj) => {
    if (!(obj instanceof THREE.SkinnedMesh)) return;
    obj.skeleton.bones.forEach((bone) => bone.updateMatrixWorld(true));
    obj.skeleton.update();
  });
}

/** Keep Meshy photoreal albedo — kit colour is baked in GLB texture via meshy:kit-bowler. */
export function prepareMeshyCharacterMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.SkinnedMesh)) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const nextMats = mats.map((mat) => {
      if (!(mat instanceof THREE.MeshStandardMaterial)) return mat;
      const m = mat.clone();
      m.color.set('#ffffff');
      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
      if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      if (m.normalMap) m.normalMap.colorSpace = THREE.NoColorSpace;
      m.emissiveIntensity = Math.min(m.emissiveIntensity || 1, 0.55);
      m.needsUpdate = true;
      return m;
    });
    if (nextMats.some((m, i) => m !== mats[i])) {
      child.material = Array.isArray(child.material) ? nextMats : nextMats[0]!;
    }
  });
}

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
