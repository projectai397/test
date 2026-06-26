import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { PITCH_FACING } from '../../utils/playerFacing';

export interface UmpireControllerHandle {
  isReady: () => boolean;
  reset: () => void;
}

interface UmpireControllerProps {
  name?: string;
  modelUrl?: string;
  position?: { x: number; y: number; z: number };
  facingY?: number;
}

export const UmpireController = forwardRef<UmpireControllerHandle, UmpireControllerProps>(
  function UmpireController({ name = 'Umpire', modelUrl, position, facingY }, ref) {
    const playerRef = useRef<PlayerModelHandle>(null);
    const groupRef = useRef<THREE.Group>(null);

    const homeX = position?.x ?? 8;
    const homeY = position?.y ?? 0;
    const homeZ = position?.z ?? -3.4;
    const homeFacing = facingY ?? PITCH_FACING.squareLegUmpire;

    useLayoutEffect(() => {
      if (!groupRef.current) return;
      groupRef.current.position.set(homeX, homeY, homeZ);
      groupRef.current.rotation.set(0, homeFacing, 0);
    }, [homeX, homeY, homeZ, homeFacing]);

    useImperativeHandle(ref, () => ({
      isReady: () => !!groupRef.current && !!playerRef.current?.isReady(),
      reset: () => {
        if (groupRef.current) {
          groupRef.current.position.set(homeX, homeY, homeZ);
          groupRef.current.rotation.set(0, homeFacing, 0);
        }
        playerRef.current?.resetPose();
      },
    }));

    return (
      <group ref={groupRef}>
        <PlayerModel ref={playerRef} role="umpire" label={name} modelUrl={modelUrl} />
      </group>
    );
  },
);
