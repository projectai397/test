import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { cameraDefaults } from './animationTimings';
import { ORBIT_TARGET } from './cameraPresets';

let controls: OrbitControlsImpl | null = null;

export function setOrbitControls(c: OrbitControlsImpl | null) {
  controls = c;
}

const PAN_STEP = 2.8;
const ZOOM_FACTOR = 0.85;

function getCameraOffset(): THREE.Vector3 {
  if (!controls) return new THREE.Vector3();
  const camera = controls.object as THREE.PerspectiveCamera;
  return new THREE.Vector3().subVectors(camera.position, controls.target);
}

export function zoomCameraIn() {
  if (!controls) return;
  const camera = controls.object as THREE.PerspectiveCamera;
  const offset = getCameraOffset().multiplyScalar(ZOOM_FACTOR);
  const minDist = controls.minDistance ?? 3;
  if (offset.length() < minDist) offset.setLength(minDist);
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

export function zoomCameraOut() {
  if (!controls) return;
  const camera = controls.object as THREE.PerspectiveCamera;
  const offset = getCameraOffset().multiplyScalar(1 / ZOOM_FACTOR);
  const maxDist = controls.maxDistance ?? 140;
  if (offset.length() > maxDist) offset.setLength(maxDist);
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

export function panCamera(direction: 'up' | 'down' | 'left' | 'right') {
  if (!controls) return;
  const camera = controls.object as THREE.PerspectiveCamera;
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() > 0.001) forward.normalize();

  const move = new THREE.Vector3();
  switch (direction) {
    case 'left':
      move.addScaledVector(right, -PAN_STEP);
      break;
    case 'right':
      move.addScaledVector(right, PAN_STEP);
      break;
    case 'up':
      move.addScaledVector(forward, -PAN_STEP);
      break;
    case 'down':
      move.addScaledVector(forward, PAN_STEP);
      break;
  }

  controls.target.add(move);
  camera.position.add(move);
  controls.update();
}

export function resetCameraView() {
  if (!controls) return;
  const camera = controls.object as THREE.PerspectiveCamera;
  camera.position.set(
    cameraDefaults.position.x,
    cameraDefaults.position.y,
    cameraDefaults.position.z,
  );
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.fov = cameraDefaults.fov;
    camera.updateProjectionMatrix();
  }
  controls.target.set(ORBIT_TARGET.x, ORBIT_TARGET.y, ORBIT_TARGET.z);
  controls.update();
}
