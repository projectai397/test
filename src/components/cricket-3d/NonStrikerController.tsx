import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { buildWatchBallTimeline } from '../../utils/cricketProcedural';
import { scenePositions } from '../../utils/animationTimings';
import { PITCH_FACING } from '../../utils/playerFacing';

export interface NonStrikerControllerHandle {
  playWatchBall: () => void;
  reset: () => void;
}

interface NonStrikerControllerProps {
  name?: string;
  modelUrl?: string;
}

function setNonStrikerHome(group: THREE.Group) {
  group.position.set(scenePositions.nonStrikerEndX, 0, scenePositions.nonStrikerOffsetZ);
  group.rotation.set(0, PITCH_FACING.towardStriker, 0);
}

export const NonStrikerController = forwardRef<
  NonStrikerControllerHandle,
  NonStrikerControllerProps
>(function NonStrikerController({ name = "W O'Rourke", modelUrl }, ref) {
  const playerRef = useRef<PlayerModelHandle>(null);
  const groupRef = useRef<THREE.Group>(null);
  const timelineRef = useRef<ReturnType<typeof buildWatchBallTimeline> | null>(null);

  useLayoutEffect(() => {
    if (groupRef.current) setNonStrikerHome(groupRef.current);
  }, []);

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
      playerRef.current?.resetPose();
    },
  }));

  return (
    <group ref={groupRef}>
      <PlayerModel ref={playerRef} role="non_striker" jerseyColor="#dc2626" label={name} modelUrl={modelUrl} />
    </group>
  );
});
