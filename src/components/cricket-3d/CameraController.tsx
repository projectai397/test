import { useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ORBIT_TARGET } from '../../utils/cameraPresets';
import { setOrbitControls } from '../../utils/cameraNavigation';

/** Free-roam orbit camera — drag to rotate, scroll to zoom, right-drag to pan. */
export function CameraController() {
  const bindControls = useCallback((instance: OrbitControlsImpl | null) => {
    setOrbitControls(instance);
  }, []);

  useFrame(({ camera }) => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.updateProjectionMatrix();
    }
  });

  return (
    <OrbitControls
      ref={bindControls}
      target={[ORBIT_TARGET.x, ORBIT_TARGET.y, ORBIT_TARGET.z]}
      enablePan
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={140}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minPolarAngle={0.1}
    />
  );
}
