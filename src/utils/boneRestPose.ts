import * as THREE from 'three';
import type { PlayerBones } from './cricketProcedural';

export type BoneRestMap = Map<THREE.Object3D, THREE.Euler>;

export function captureBoneRestPose(bones: PlayerBones): BoneRestMap {
  const map: BoneRestMap = new Map();
  const list = [
    bones.hips,
    bones.torso,
    bones.legL,
    bones.legR,
    bones.lowerLegL,
    bones.lowerLegR,
    bones.armL,
    bones.armR,
    bones.foreArmL,
    bones.foreArmR,
  ];
  for (const bone of list) {
    if (bone) {
      map.set(bone, bone.rotation.clone());
    }
  }
  return map;
}

/** Full skeleton rest — for Meshy bowler neutral stance reset after clips. */
export function captureSkeletonRestPose(root: THREE.Object3D): BoneRestMap {
  const map: BoneRestMap = new Map();
  root.traverse((obj) => {
    if (obj instanceof THREE.Bone) {
      map.set(obj, obj.rotation.clone());
    }
  });
  return map;
}

export function restoreBoneRestPose(rest: BoneRestMap): void {
  rest.forEach((rot, bone) => {
    bone.rotation.copy(rot);
  });
}
