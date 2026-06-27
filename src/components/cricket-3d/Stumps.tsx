import { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

/** ICC dimensions (metres). */
const STUMP_HEIGHT = 0.711;
const STUMP_RADIUS = 0.0175;
const STUMP_SPREAD = 0.114;
const BAIL_LENGTH = 0.111;
const BAIL_RADIUS = 0.009;

export interface StumpsHandle {
  triggerWicket: () => void;
  reset: () => void;
}

interface StumpsProps {
  position: [number, number, number];
}

export const Stumps = forwardRef<StumpsHandle, StumpsProps>(function Stumps(
  { position },
  ref,
) {
  const bail1Ref = useRef<THREE.Mesh>(null);
  const bail2Ref = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const bailY = STUMP_HEIGHT + BAIL_RADIUS;
  const bailHalfSpan = STUMP_SPREAD * 0.52;

  useImperativeHandle(ref, () => ({
    triggerWicket: () => {
      if (bail1Ref.current) {
        bail1Ref.current.rotation.z = 0.8;
        bail1Ref.current.position.y = STUMP_HEIGHT * 0.75;
        bail1Ref.current.position.x = bailHalfSpan + 0.04;
      }
      if (bail2Ref.current) {
        bail2Ref.current.rotation.z = -0.7;
        bail2Ref.current.position.y = STUMP_HEIGHT * 0.72;
        bail2Ref.current.position.x = -(bailHalfSpan + 0.02);
      }
    },
    reset: () => {
      if (bail1Ref.current) {
        bail1Ref.current.rotation.set(0, 0, 0);
        bail1Ref.current.position.set(-bailHalfSpan, bailY, 0);
      }
      if (bail2Ref.current) {
        bail2Ref.current.rotation.set(0, 0, 0);
        bail2Ref.current.position.set(bailHalfSpan, bailY, 0);
      }
    },
  }));

  const stumpPositions: [number, number, number][] = [
    [-STUMP_SPREAD, STUMP_HEIGHT / 2, 0],
    [0, STUMP_HEIGHT / 2, 0],
    [STUMP_SPREAD, STUMP_HEIGHT / 2, 0],
  ];

  const stumpMat = (
    <meshStandardMaterial color="#e8b923" roughness={0.45} metalness={0.05} />
  );
  const bailMat = (
    <meshStandardMaterial color="#f0d040" roughness={0.4} metalness={0.05} />
  );

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial color="#8b6914" roughness={0.95} />
      </mesh>

      {stumpPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <cylinderGeometry args={[STUMP_RADIUS, STUMP_RADIUS * 1.05, STUMP_HEIGHT, 12]} />
          {stumpMat}
        </mesh>
      ))}

      <mesh ref={bail1Ref} position={[-bailHalfSpan, bailY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[BAIL_RADIUS, BAIL_RADIUS, BAIL_LENGTH, 8]} />
        {bailMat}
      </mesh>
      <mesh ref={bail2Ref} position={[bailHalfSpan, bailY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[BAIL_RADIUS, BAIL_RADIUS, BAIL_LENGTH, 8]} />
        {bailMat}
      </mesh>
    </group>
  );
});
