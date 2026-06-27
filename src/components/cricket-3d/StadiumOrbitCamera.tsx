import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  ORBIT_CAM_HEIGHT,
  ORBIT_CAM_RADIUS,
  ORBIT_CAM_SPEED,
  ORBIT_LOOK_AT_Y,
  STADIUM_CENTER_X,
} from '../../utils/stadiumConstants';

const LOOK_AT = new THREE.Vector3(STADIUM_CENTER_X, ORBIT_LOOK_AT_Y, 0);

/** Mid-stand camera with slow auto-orbit (~35° look-down). */
export function StadiumOrbitCamera() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const azimuth = useRef(0.6);

  useFrame(({ camera }, delta) => {
    azimuth.current += ORBIT_CAM_SPEED * delta;
    const a = azimuth.current;
    camera.position.set(
      STADIUM_CENTER_X + Math.cos(a) * ORBIT_CAM_RADIUS,
      ORBIT_CAM_HEIGHT,
      Math.sin(a) * ORBIT_CAM_RADIUS,
    );
    camera.lookAt(LOOK_AT);
    if (controlsRef.current) {
      controlsRef.current.target.copy(LOOK_AT);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[STADIUM_CENTER_X, ORBIT_LOOK_AT_Y, 0]}
      enablePan={false}
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.06}
      minDistance={28}
      maxDistance={75}
      maxPolarAngle={Math.PI / 2 - 0.35}
      minPolarAngle={Math.PI / 2 - 0.65}
    />
  );
}
