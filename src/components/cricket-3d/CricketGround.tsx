import { useMemo } from 'react';
import { scenePositions } from '../../utils/animationTimings';
import { createOutfieldGrassTexture } from '../../utils/cricketPitchSurface';

export function CricketGround() {
  const centerX = scenePositions.pitchLength / 2;
  const grassTexture = useMemo(() => createOutfieldGrassTexture(), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, 0]} receiveShadow>
        <planeGeometry args={[110, 110]} />
        <meshStandardMaterial map={grassTexture} roughness={0.96} metalness={0} />
      </mesh>

      {/* Boundary rope */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.018, 0]}>
        <ringGeometry args={[scenePositions.boundaryRadius - 0.4, scenePositions.boundaryRadius, 96]} />
        <meshStandardMaterial color="#f5f5f0" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}
