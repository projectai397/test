import { useMemo } from 'react';
import * as THREE from 'three';
import { scenePositions } from '../../utils/animationTimings';

export function CricketPitch() {
  const pitchTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#c4a574';
    ctx.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(120,90,50,${Math.random() * 0.15})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 512, 1, 3);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  const { pitchLength, pitchWidth } = scenePositions;
  const centerX = pitchLength / 2;

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[pitchLength, pitchWidth]} />
        <meshStandardMaterial map={pitchTexture} roughness={0.85} />
      </mesh>

      {/* Crease lines - striker end */}
      <CreaseLine x={0.3} z={pitchWidth / 2 - 0.05} length={pitchWidth} />
      <CreaseLine x={1.22} z={0} length={pitchWidth} />
      <CreaseLine x={0} z={0} length={pitchWidth} vertical />

      {/* Crease lines - bowler end */}
      <CreaseLine x={pitchLength - 0.3} z={pitchWidth / 2 - 0.05} length={pitchWidth} />
      <CreaseLine x={pitchLength - 1.22} z={0} length={pitchWidth} />
      <CreaseLine x={pitchLength} z={0} length={pitchWidth} vertical />
    </group>
  );
}

function CreaseLine({
  x,
  z,
  length,
  vertical = false,
}: {
  x: number;
  z: number;
  length: number;
  vertical?: boolean;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, vertical ? Math.PI / 2 : 0]}
      position={[x, 0.015, z]}
    >
      <planeGeometry args={[vertical ? 0.05 : length, vertical ? length : 0.05]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}
