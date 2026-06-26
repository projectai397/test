import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { scenePositions } from '../../utils/animationTimings';
import { PITCH_FACING } from '../../utils/playerFacing';

export interface UmpireControllerHandle {
  isReady: () => boolean;
  reset: () => void;
}

interface UmpireControllerProps {
  name?: string;
  modelUrl?: string;
}

function setUmpireHome(group: THREE.Group) {
  group.position.set(scenePositions.umpireX, 0, scenePositions.umpireZ);
  group.rotation.set(0, PITCH_FACING.squareLegUmpire, 0);
}

export const UmpireController = forwardRef<UmpireControllerHandle, UmpireControllerProps>(
  function UmpireController({ name = 'Umpire', modelUrl }, ref) {
    const playerRef = useRef<PlayerModelHandle>(null);
    const groupRef = useRef<THREE.Group>(null);

    useLayoutEffect(() => {
      if (groupRef.current) setUmpireHome(groupRef.current);
    }, []);

    useImperativeHandle(ref, () => ({
      isReady: () => !!groupRef.current && !!playerRef.current?.isReady(),
      reset: () => {
        if (groupRef.current) setUmpireHome(groupRef.current);
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
