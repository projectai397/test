import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { buildWatchBallTimeline } from '../../utils/cricketProcedural';

export interface FielderControllerHandle {
  playWatchBall: () => void;
  reset: () => void;
}

interface FielderControllerProps {
  name: string;
  jerseyColor: string;
  trouserColor?: string;
  x: number;
  z: number;
  facingY: number;
  modelUrl?: string;
}

export const FielderController = forwardRef<FielderControllerHandle, FielderControllerProps>(
  function FielderController({ name, jerseyColor, trouserColor, x, z, facingY, modelUrl }, ref) {
    const playerRef = useRef<PlayerModelHandle>(null);
    const groupRef = useRef<THREE.Group>(null);
    const timelineRef = useRef<ReturnType<typeof buildWatchBallTimeline> | null>(null);

    useLayoutEffect(() => {
      if (!groupRef.current) return;
      groupRef.current.position.set(x, 0, z);
      groupRef.current.rotation.set(0, facingY, 0);
    }, [x, z, facingY]);

    useImperativeHandle(ref, () => ({
      playWatchBall: () => {
        const player = playerRef.current;
        if (!player?.isReady()) return;
        timelineRef.current?.kill();
        const rest = player.beginProcedural();
        timelineRef.current = buildWatchBallTimeline(player.getParts(), rest);
      },

      reset: () => {
        timelineRef.current?.kill();
        if (groupRef.current) {
          groupRef.current.position.set(x, 0, z);
          groupRef.current.rotation.set(0, facingY, 0);
        }
        playerRef.current?.resetPose();
      },
    }));

    return (
      <group ref={groupRef}>
        <PlayerModel
          ref={playerRef}
          role="fielder"
          jerseyColor={jerseyColor}
          trouserColor={trouserColor}
          label={name}
          modelUrl={modelUrl}
        />
      </group>
    );
  },
);
