import * as THREE from 'three';
import type { PlayerBones } from './cricketProcedural';

type BoneKey = keyof PlayerBones | 'head' | 'handL' | 'handR';

const BONE_CANDIDATES: Record<BoneKey, string[]> = {
  hips: ['hips', 'pelvis', 'root', 'torso_joint_1', 'hip', 'skeleton_torso'],
  torso: ['spine2', 'spine1', 'spine', 'chest', 'torso_joint_3', 'torso_joint_2', 'skeleton_torso_joint'],
  legL: ['leftupleg', 'leg_joint_l', 'thigh_l', 'upperleg_l', 'leg_l_1'],
  legR: ['rightupleg', 'leg_joint_r', 'thigh_r', 'upperleg_r', 'leg_r_1'],
  armL: ['leftarm', 'arm_joint_l', 'upperarm_l', 'shoulder_l', 'skeleton_arm_joint_l'],
  armR: ['rightarm', 'arm_joint_r', 'upperarm_r', 'shoulder_r', 'skeleton_arm_joint_r'],
  foreArmL: ['leftforearm', 'forearm_l', 'lowerarm_l', 'arm_joint_l__3', 'elbow_l'],
  foreArmR: ['rightforearm', 'forearm_r', 'lowerarm_r', 'arm_joint_r__2', 'elbow_r'],
  head: ['head', 'neck_joint_2', 'neck_2', 'skull'],
  handL: ['lefthand', 'hand_l', 'wrist_l', 'arm_joint_l__2'],
  handR: ['righthand', 'hand_r', 'wrist_r', 'arm_joint_r__3'],
};

function normalizeBoneName(name: string): string {
  return name.toLowerCase().replace(/mixamorig[:_]?/g, '').replace(/[^a-z0-9]/g, '');
}

function scoreBone(name: string, candidates: string[]): number {
  const norm = normalizeBoneName(name);
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]!.replace(/[^a-z0-9]/g, '');
    if (norm === candidate) return 100 - i;
    if (norm.includes(candidate) || candidate.includes(norm)) return 80 - i;
  }
  return -1;
}

function pickBone(bones: THREE.Bone[], key: BoneKey, used: Set<THREE.Bone>): THREE.Bone | null {
  const candidates = BONE_CANDIDATES[key];
  let best: THREE.Bone | null = null;
  let bestScore = -1;

  for (const bone of bones) {
    if (used.has(bone)) continue;
    const score = scoreBone(bone.name, candidates);
    if (score > bestScore) {
      bestScore = score;
      best = bone;
    }
  }

  if (best && bestScore >= 0) used.add(best);
  return best;
}

export function resolveAutoBones(scene: THREE.Object3D): PlayerBones & {
  head: THREE.Bone | null;
  handL: THREE.Bone | null;
  handR: THREE.Bone | null;
} {
  const bones: THREE.Bone[] = [];
  scene.traverse((obj) => {
    if (obj instanceof THREE.Bone) bones.push(obj);
  });

  const used = new Set<THREE.Bone>();
  const result = {} as PlayerBones & { head: THREE.Bone | null; handL: THREE.Bone | null; handR: THREE.Bone | null };

  (Object.keys(BONE_CANDIDATES) as BoneKey[]).forEach((key) => {
    result[key] = pickBone(bones, key, used);
  });

  return result;
}

export function isBoneSetComplete(
  bones: PlayerBones & { head?: THREE.Bone | null; handL?: THREE.Bone | null; handR?: THREE.Bone | null },
): boolean {
  return !!(bones.torso && bones.armR && bones.legL && bones.legR);
}
