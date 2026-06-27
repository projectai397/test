import { useMemo } from 'react';
import { createDaySkyTexture } from '../../../utils/stadiumTextures';

export function DaySky() {
  const tex = useMemo(() => createDaySkyTexture(), []);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[180, 48, 32]} />
      <meshBasicMaterial map={tex} side={2} depthWrite={false} />
    </mesh>
  );
}
