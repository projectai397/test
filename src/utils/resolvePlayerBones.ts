import type * as THREE from 'three';
import { BONE_NAMES, findBone } from './playerModels';
import { resolveCricketBones } from './cricketBoneMap';
import { isBoneSetComplete, resolveAutoBones } from './autoBoneMap';
import { isWolf3dRig, resolveWolf3dBones } from './wolf3dBoneMap';
import type { PlayerBones } from './cricketProcedural';
import type { ModelProfile } from './playerModels';

export type ResolvedBones = PlayerBones & {
  head: THREE.Bone | null;
  handL: THREE.Bone | null;
  handR: THREE.Bone | null;
};

export function resolvePlayerBones(scene: THREE.Object3D, profile: ModelProfile): ResolvedBones {
  if (profile === 'cricket') {
    if (isWolf3dRig(scene)) {
      const wolf = resolveWolf3dBones(scene);
      if (isBoneSetComplete(wolf)) return wolf;
    }
    const cricket = resolveCricketBones(scene);
    if (isBoneSetComplete(cricket)) return cricket;
    const auto = resolveAutoBones(scene);
    if (isBoneSetComplete(auto)) return auto;
    return cricket.torso || cricket.armR ? cricket : auto;
  }

  if (profile === 'mixamo') {
    const auto = resolveAutoBones(scene);
    if (isBoneSetComplete(auto)) return auto;
  }

  return {
    hips: findBone(scene, BONE_NAMES.hips),
    torso: findBone(scene, BONE_NAMES.spine),
    legL: findBone(scene, BONE_NAMES.leftUpLeg),
    legR: findBone(scene, BONE_NAMES.rightUpLeg),
    lowerLegL: findBone(scene, 'LeftLeg'),
    lowerLegR: findBone(scene, 'RightLeg'),
    armL: findBone(scene, BONE_NAMES.leftArm),
    armR: findBone(scene, BONE_NAMES.rightArm),
    foreArmL: findBone(scene, 'LeftForeArm'),
    foreArmR: findBone(scene, 'RightForeArm'),
    head: findBone(scene, BONE_NAMES.head),
    handL: findBone(scene, 'LeftHand'),
    handR: findBone(scene, BONE_NAMES.rightHand),
  };
}
