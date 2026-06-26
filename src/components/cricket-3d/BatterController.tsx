import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { CLIPS } from '../../utils/playerModels';
import {
  buildSixShotTimeline,
  MIN_BAT_MS,
  timelineToPromise,
} from '../../utils/cricketProcedural';
import { scenePositions } from '../../utils/animationTimings';
import { PITCH_FACING } from '../../utils/playerFacing';
import { animatePosition, cancelMotionsFor, waitUntilReady } from '../../utils/motionRunner';
import type { AnimationCompletion } from './BowlerController';

export interface BatterControllerHandle {
  isReady: () => boolean;
  playStance: () => void;
  playSixShot: () => Promise<AnimationCompletion>;
  reset: () => void;
}

interface BatterControllerProps {
  name?: string;
  modelUrl?: string;
}

function setBatterHome(group: THREE.Group) {
  group.position.set(scenePositions.strikerEndX, 0, 0);
  group.rotation.set(0, PITCH_FACING.towardBowler, 0);
}

export const BatterController = forwardRef<BatterControllerHandle, BatterControllerProps>(
  function BatterController({ name = 'T Blundell', modelUrl }, ref) {
    const playerRef = useRef<PlayerModelHandle>(null);
    const groupRef = useRef<THREE.Group>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    useLayoutEffect(() => {
      if (groupRef.current) setBatterHome(groupRef.current);
    }, []);

    useImperativeHandle(ref, () => ({
      isReady: () =>
        !!groupRef.current &&
        !!playerRef.current?.isReady() &&
        !!playerRef.current.getBatRef() &&
        !!playerRef.current.getParts().torso,

      playStance: () => {
        const player = playerRef.current;
        const bat = player?.getBatRef();
        if (!player?.isReady() || !bat) return;
        player.endProcedural();
        player.playClip(CLIPS.idle, true, 0.3);
        gsap.to(bat.rotation, { x: 0.1, y: 0.1, z: -1.4, duration: 0.4, ease: 'power2.out' });
      },

      playSixShot: async () => {
        const start = performance.now();
        const ready = await waitUntilReady(
          () =>
            !!groupRef.current &&
            !!playerRef.current?.isReady() &&
            !!playerRef.current.getBatRef(),
        );
        if (!ready) {
          console.error('[Batter] GLB not ready for six shot');
          return { ok: false, durationMs: 0 };
        }

        const player = playerRef.current!;
        const group = groupRef.current!;
        const bat = player.getBatRef()!;

        timelineRef.current?.kill();
        cancelMotionsFor(group);

        const rest = player.beginProcedural();
        const batRest = bat.rotation.clone();

        const stepDistance = 0.35;
        const stepDuration = 0.22;
        const stepPromise = animatePosition(
          group,
          { x: group.position.x + stepDistance },
          stepDuration,
          { ease: 'linear' },
        );
        const tl = buildSixShotTimeline(player.getParts(), rest, bat, batRest);
        timelineRef.current = tl;

        await Promise.all([timelineToPromise(tl), stepPromise]);
        player.endProcedural();

        const durationMs = performance.now() - start;
        return { ok: durationMs >= MIN_BAT_MS, durationMs };
      },

      reset: () => {
        timelineRef.current?.kill();
        if (groupRef.current) {
          cancelMotionsFor(groupRef.current);
          setBatterHome(groupRef.current);
        }
        playerRef.current?.resetPose();
      },
    }));

    return (
      <group ref={groupRef}>
        <PlayerModel
          ref={playerRef}
          role="batter"
          jerseyColor="#2563eb"
          showBat
          label={name}
          modelUrl={modelUrl}
        />
      </group>
    );
  },
);
