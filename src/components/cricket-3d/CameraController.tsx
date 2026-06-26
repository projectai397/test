import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ORBIT_TARGET } from '../../utils/cameraPresets';

/** Free-roam orbit camera — drag to rotate, scroll to zoom, right-drag to pan. */
export function CameraController() {
  useFrame(({ camera }) => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.updateProjectionMatrix();
    }
  });

  return (
    <OrbitControls
      target={[ORBIT_TARGET.x, ORBIT_TARGET.y, ORBIT_TARGET.z]}
      enablePan
      enableZoom
      enableRotate
      minDistance={4}
      maxDistance={90}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minPolarAngle={0.15}
    />
  );
}
