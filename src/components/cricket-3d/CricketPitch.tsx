import { useMemo } from 'react';
import { scenePositions } from '../../utils/animationTimings';
import {
  createPitchTexture,
  POPPING_CREASE_M,
} from '../../utils/cricketPitchSurface';

function PoppingCreaseExtensions() {
  const { pitchLength, pitchWidth } = scenePositions;
  const halfW = pitchWidth / 2;
  const extension = 2.4;
  const y = 0.011;
  const lineW = 0.06;

  const ends = [
    { x: POPPING_CREASE_M, zSign: 1 },
    { x: POPPING_CREASE_M, zSign: -1 },
    { x: pitchLength - POPPING_CREASE_M, zSign: 1 },
    { x: pitchLength - POPPING_CREASE_M, zSign: -1 },
  ];

  return (
    <>
      {ends.map(({ x, zSign }, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, y, zSign * (halfW + extension / 2)]}
        >
          <planeGeometry args={[lineW, extension]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
}

export function CricketPitch() {
  const { pitchLength, pitchWidth } = scenePositions;
  const centerX = pitchLength / 2;

  const pitchTexture = useMemo(
    () => createPitchTexture(pitchLength, pitchWidth),
    [pitchLength, pitchWidth],
  );

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.012, 0]}
        receiveShadow
      >
        <planeGeometry args={[pitchLength, pitchWidth]} />
        <meshStandardMaterial
          map={pitchTexture}
          roughness={0.92}
          metalness={0}
        />
      </mesh>
      <PoppingCreaseExtensions />
    </group>
  );
}
