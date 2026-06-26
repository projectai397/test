import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { resolveUmpirePlacement } from '../../utils/umpirePlacement';

export interface UmpireControllerHandle {
  isReady: () => boolean;
  reset: () => void;
}

interface UmpireControllerProps {
  name?: string;
  jerseyColor?: string;
  showCap?: boolean;
  modelUrl?: string;
  position?: { x: number; y: number; z: number };
}

export const UmpireController = forwardRef<UmpireControllerHandle, UmpireControllerProps>(
  function UmpireController(
    {
      name = 'Umpire',
      jerseyColor = '#ffffff',
      showCap = true,
      modelUrl,
      position,
    },
    ref,
  ) {
    const playerRef = useRef<PlayerModelHandle>(null);
    const groupRef = useRef<THREE.Group>(null);
    const placement = resolveUmpirePlacement(position);

    useLayoutEffect(() => {
      if (!groupRef.current) return;
      groupRef.current.position.set(placement.x, placement.y, placement.z);
      groupRef.current.rotation.set(0, placement.facingY, 0);
    }, [placement.x, placement.y, placement.z, placement.facingY]);

    useImperativeHandle(ref, () => ({
      isReady: () => !!groupRef.current && !!playerRef.current?.isReady(),
      reset: () => {
        if (groupRef.current) {
          groupRef.current.position.set(placement.x, placement.y, placement.z);
          groupRef.current.rotation.set(0, placement.facingY, 0);
        }
        playerRef.current?.resetPose();
      },
    }));

    return (
      <group ref={groupRef}>
        <PlayerModel
          ref={playerRef}
          role="umpire"
          jerseyColor={jerseyColor}
          showCap={showCap}
          label={name}
          modelUrl={modelUrl}
        />
      </group>
    );
  },
);
