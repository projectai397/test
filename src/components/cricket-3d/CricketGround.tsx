import { useMemo } from 'react';
import { scenePositions } from '../../utils/animationTimings';
import { createOutfieldGrassTexture } from '../../utils/cricketPitchSurface';
import { STADIUM_CENTER_X } from '../../utils/stadiumConstants';

export function CricketGround() {
  const grassTexture = useMemo(() => createOutfieldGrassTexture(), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[STADIUM_CENTER_X, 0, 0]} receiveShadow>
        <circleGeometry args={[56, 96]} />
        <meshStandardMaterial
          map={grassTexture}
          color="#3a9c3a"
          roughness={0.82}
          metalness={0}
          envMapIntensity={0.35}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[STADIUM_CENTER_X, 0.022, 0]}>
        <ringGeometry args={[scenePositions.boundaryRadius - 0.06, scenePositions.boundaryRadius, 96]} />
        <meshStandardMaterial color="#f8f8f4" roughness={0.7} metalness={0} />
      </mesh>
    </group>
  );
}
