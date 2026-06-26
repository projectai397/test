import { Trail } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import type { ReactNode } from 'react';

extend({ MeshLineGeometry, MeshLineMaterial });

interface BallFlightTrailProps {
  active: boolean;
  children: ReactNode;
}

/** Broadcast-style white comet tail — thickest at the ball, fading toward the tail. */
export function BallFlightTrail({ active, children }: BallFlightTrailProps) {
  if (!active) return <>{children}</>;

  return (
    <Trail
      width={5.5}
      length={18}
      decay={1}
      stride={0.03}
      interval={1}
      color="#ffffff"
      attenuation={(t) => t * t}
    >
      <meshLineMaterial transparent opacity={0.82} depthWrite={false} toneMapped={false} />
      {children}
    </Trail>
  );
}
