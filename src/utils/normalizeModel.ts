import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const TARGET_HEIGHT = 1.78;

/** Deep-clone a skinned GLB and normalize to ~1.78m standing on Y=0. */
export function cloneAndNormalizeModel(source: THREE.Object3D): THREE.Object3D {
  const clone = SkeletonUtils.clone(source) as THREE.Object3D;
  clone.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());
  const height = size.y;

  if (height > 0.01 && Math.abs(height - TARGET_HEIGHT) > 0.05) {
    const scale = TARGET_HEIGHT / height;
    clone.scale.multiplyScalar(scale);
    clone.updateMatrixWorld(true);
  }

  box.setFromObject(clone);
  clone.position.y -= box.min.y;

  return clone;
}
