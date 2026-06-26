import * as THREE from 'three';
import type { PlayerBones } from './cricketProcedural';

/** Exact bone names for Wolf3D / Ready Player Me rigs (cricket-player.glb). */
export const WOLF3D_BONE_NAMES = {
  hips: 'Hips_01',
  torso: 'Spine2_04',
  legL: 'LeftUpLeg_057',
  legR: 'RightUpLeg_062',
  lowerLegL: 'LeftLeg_058',
  lowerLegR: 'RightLeg_063',
  armL: 'LeftArm_011',
  armR: 'RightArm_034',
  foreArmL: 'LeftForeArm_012',
  foreArmR: 'RightForeArm_035',
  handL: 'LeftHand_013',
  handR: 'RightHand_036',
  head: 'Head_06',
} as const;

function findNamedBone(root: THREE.Object3D, name: string): THREE.Bone | null {
  let found: THREE.Bone | null = null;
  root.traverse((obj) => {
    if (obj instanceof THREE.Bone && obj.name === name) found = obj;
  });
  return found;
}

export function isWolf3dRig(scene: THREE.Object3D): boolean {
  return !!findNamedBone(scene, WOLF3D_BONE_NAMES.hips);
}

export function resolveWolf3dBones(scene: THREE.Object3D): PlayerBones & {
  head: THREE.Bone | null;
  handL: THREE.Bone | null;
  handR: THREE.Bone | null;
} {
  const n = WOLF3D_BONE_NAMES;
  return {
    hips: findNamedBone(scene, n.hips),
    torso: findNamedBone(scene, n.torso),
    legL: findNamedBone(scene, n.legL),
    legR: findNamedBone(scene, n.legR),
    lowerLegL: findNamedBone(scene, n.lowerLegL),
    lowerLegR: findNamedBone(scene, n.lowerLegR),
    armL: findNamedBone(scene, n.armL),
    armR: findNamedBone(scene, n.armR),
    foreArmL: findNamedBone(scene, n.foreArmL),
    foreArmR: findNamedBone(scene, n.foreArmR),
    head: findNamedBone(scene, n.head),
    handL: findNamedBone(scene, n.handL),
    handR: findNamedBone(scene, n.handR),
  };
}
