import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { buildKeeperCrouchTimeline } from '../../utils/cricketProcedural';
import { scenePositions } from '../../utils/animationTimings';
import { PITCH_FACING } from '../../utils/playerFacing';

export interface KeeperControllerHandle {
  playCollect: () => Promise<void>;
  playCrouch: () => void;
  reset: () => void;
}

interface KeeperControllerProps {
  name?: string;
  modelUrl?: string;
}

function setKeeperHome(group: THREE.Group) {
  group.position.set(
    scenePositions.strikerEndX + scenePositions.keeperOffsetX,
    0,
    scenePositions.keeperOffsetZ,
  );
  group.rotation.set(0, PITCH_FACING.towardBowler, 0);
}

export const KeeperController = forwardRef<KeeperControllerHandle, KeeperControllerProps>(
  function KeeperController({ name = 'J Smith', modelUrl }, ref) {
    const playerRef = useRef<PlayerModelHandle>(null);
    const groupRef = useRef<THREE.Group>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    useLayoutEffect(() => {
      if (groupRef.current) setKeeperHome(groupRef.current);
    }, []);

    useImperativeHandle(ref, () => ({
      playCrouch: () => {
        const player = playerRef.current;
        const parts = player?.getParts();
        if (!player?.isReady() || !parts?.torso) return;
        timelineRef.current?.kill();
        const rest = player.beginProcedural();
        timelineRef.current = buildKeeperCrouchTimeline(parts, rest);
      },

      playCollect: () =>
        new Promise((resolve) => {
          const player = playerRef.current;
          const parts = player?.getParts();
          if (!player?.isReady() || !parts?.armR) {
            resolve();
            return;
          }
          const tl = gsap.timeline({ onComplete: resolve });
          tl.to(parts.armR.rotation, { x: -1.4, z: 0.35, duration: 0.35, ease: 'power2.out' });
          if (parts.foreArmR) {
            tl.to(parts.foreArmR.rotation, { x: -0.8, duration: 0.25, ease: 'power2.out' }, 0);
          }
          tl.to(parts.armR.rotation, { x: 0.2, z: 0, duration: 0.3 });
          timelineRef.current = tl;
        }),

      reset: () => {
        timelineRef.current?.kill();
        playerRef.current?.resetPose();
      },
    }));

    return (
      <group ref={groupRef}>
        <PlayerModel ref={playerRef} role="keeper" jerseyColor="#dc2626" label={name} modelUrl={modelUrl} />
      </group>
    );
  },
);
