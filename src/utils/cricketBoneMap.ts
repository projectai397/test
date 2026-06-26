import * as THREE from 'three';
import type { PlayerBones } from './cricketProcedural';

/** Bone name fragments for legacy Indian Cricket Player rig; Cricketer Walk uses autoBoneMap fallback. */
export const CRICKET_BONE_FRAGMENTS = {
  hips: 'Skeleton_torso_joint_1',
  spine: 'torso_joint_3',
  spineUpper: 'Skeleton_torso_joint_2',
  legL: 'leg_joint_L_1',
  legR: 'leg_joint_R_1',
  armL: 'Skeleton_arm_joint_L__4_',
  armR: 'Skeleton_arm_joint_R',
  foreArmL: 'Skeleton_arm_joint_L__3_',
  foreArmR: 'Skeleton_arm_joint_R__2_',
  handL: 'Skeleton_arm_joint_L__2_',
  handR: 'Skeleton_arm_joint_R__3_',
  head: 'Skeleton_neck_joint_2',
} as const;

export function findCricketBone(root: THREE.Object3D, fragment: string): THREE.Bone | null {
  const needle = fragment.toLowerCase();
  let found: THREE.Bone | null = null;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Bone)) return;
    if (obj.name.toLowerCase() === needle || obj.name.toLowerCase().includes(needle)) {
      found = obj;
    }
  });
  return found;
}

export function resolveCricketBones(scene: THREE.Object3D): PlayerBones & {
  head: THREE.Bone | null;
  handL: THREE.Bone | null;
  handR: THREE.Bone | null;
} {
  const f = CRICKET_BONE_FRAGMENTS;
  return {
    hips: findCricketBone(scene, f.hips),
    torso: findCricketBone(scene, f.spine) ?? findCricketBone(scene, f.spineUpper),
    legL: findCricketBone(scene, f.legL),
    legR: findCricketBone(scene, f.legR),
    lowerLegL: null,
    lowerLegR: null,
    armL: findCricketBone(scene, f.armL),
    armR: findCricketBone(scene, f.armR),
    foreArmL: findCricketBone(scene, f.foreArmL),
    foreArmR: findCricketBone(scene, f.foreArmR),
    head: findCricketBone(scene, f.head),
    handL: findCricketBone(scene, f.handL),
    handR: findCricketBone(scene, f.handR),
  };
}
