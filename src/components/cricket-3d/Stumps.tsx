import { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

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

  useImperativeHandle(ref, () => ({
    triggerWicket: () => {
      if (bail1Ref.current) {
        bail1Ref.current.rotation.z = 0.8;
        bail1Ref.current.position.y = 0.55;
        bail1Ref.current.position.x = 0.08;
      }
      if (bail2Ref.current) {
        bail2Ref.current.rotation.z = -0.7;
        bail2Ref.current.position.y = 0.52;
        bail2Ref.current.position.x = -0.06;
      }
    },
    reset: () => {
      if (bail1Ref.current) {
        bail1Ref.current.rotation.set(0, 0, 0);
        bail1Ref.current.position.set(-0.06, 0.71, 0);
      }
      if (bail2Ref.current) {
        bail2Ref.current.rotation.set(0, 0, 0);
        bail2Ref.current.position.set(0.06, 0.71, 0);
      }
    },
  }));

  const stumpPositions: [number, number, number][] = [
    [-0.11, 0.35, 0],
    [0, 0.35, 0],
    [0.11, 0.35, 0],
  ];

  return (
    <group ref={groupRef} position={position}>
      {stumpPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.018, 0.022, 0.71, 8]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.6} />
        </mesh>
      ))}
      <mesh ref={bail1Ref} position={[-0.06, 0.71, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.11, 6]} />
        <meshStandardMaterial color="#8b0000" />
      </mesh>
      <mesh ref={bail2Ref} position={[0.06, 0.71, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.11, 6]} />
        <meshStandardMaterial color="#8b0000" />
      </mesh>
    </group>
  );
});
