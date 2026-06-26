import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import { useCricketAnimationState } from '../../hooks/useCricketAnimationState';
import {
  getCameraPreset,
  ORBIT_TARGET,
  type CameraViewPreset,
} from '../../utils/cameraPresets';

function applyPreset(
  camera: THREE.Camera,
  preset: CameraViewPreset,
  lookAtTarget: THREE.Vector3,
  duration: number,
): gsap.core.Timeline {
  const config = getCameraPreset(preset);
  lookAtTarget.set(config.lookAt.x, config.lookAt.y, config.lookAt.z);

  const tl = gsap.timeline();
  tl.to(
    camera.position,
    {
      x: config.position.x,
      y: config.position.y,
      z: config.position.z,
      duration,
      ease: 'power2.inOut',
    },
    0,
  );

  if (camera instanceof THREE.PerspectiveCamera && config.fov) {
    tl.to(camera, { fov: config.fov, duration, ease: 'power2.inOut' }, 0);
  }

  return tl;
}

/** Camera stays on the user-selected preset — no cinematic movement during delivery. */
export function CameraController() {
  const { camera } = useThree();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const lookAtTarget = useRef(new THREE.Vector3(ORBIT_TARGET.x, ORBIT_TARGET.y, ORBIT_TARGET.z));
  const lastPreset = useRef<CameraViewPreset | null>(null);

  const cameraViewPreset = useCricketAnimationState((s) => s.cameraViewPreset);
  const orbitEnabled = cameraViewPreset === 'free';

  // Only move camera when the user picks a different angle
  useEffect(() => {
    if (cameraViewPreset === 'free') {
      lastPreset.current = 'free';
      return;
    }

    if (lastPreset.current === cameraViewPreset) return;
    const isFirstApply = lastPreset.current === null;
    lastPreset.current = cameraViewPreset;

    timelineRef.current?.kill();
    timelineRef.current = applyPreset(
      camera,
      cameraViewPreset,
      lookAtTarget.current,
      isFirstApply ? 0 : 0.8,
    );
  }, [cameraViewPreset, camera]);

  useFrame(() => {
    if (!orbitEnabled) {
      camera.lookAt(lookAtTarget.current);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.updateProjectionMatrix();
      }
    }
  });

  if (!orbitEnabled) return null;

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
