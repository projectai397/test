import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { CLIPS } from '../../utils/playerModels';
import {
  buildBowlingTimeline,
  MIN_BOWL_MS,
  MIN_RUN_UP_MS,
  timelineToPromise,
} from '../../utils/cricketProcedural';
import { scenePositions } from '../../utils/animationTimings';
import { PITCH_FACING } from '../../utils/playerFacing';
import { getBowlerRunUpDistance, syncRunLocomotion } from '../../utils/locomotionSync';
import { animatePosition, cancelMotionsFor, waitUntilReady } from '../../utils/motionRunner';

export interface AnimationCompletion {
  ok: boolean;
  durationMs: number;
}

export interface BowlerControllerHandle {
  isReady: () => boolean;
  playRunUp: () => Promise<AnimationCompletion>;
  playBowlingAction: (onRelease?: () => void) => Promise<AnimationCompletion>;
  reset: () => void;
  getHandRef: () => THREE.Object3D | null;
}

interface BowlerControllerProps {
  name?: string;
  modelUrl?: string;
}

function setBowlerHome(group: THREE.Group) {
  group.position.set(scenePositions.bowlerStartX, 0, scenePositions.bowlerStartZ);
  group.rotation.set(0, PITCH_FACING.towardStriker, 0);
}

export const BowlerController = forwardRef<BowlerControllerHandle, BowlerControllerProps>(
  function BowlerController({ name = 'B Stokes', modelUrl }, ref) {
    const playerRef = useRef<PlayerModelHandle>(null);
    const groupRef = useRef<THREE.Group>(null);
    const timelineRef = useRef<ReturnType<typeof buildBowlingTimeline> | null>(null);

    useLayoutEffect(() => {
      if (groupRef.current) setBowlerHome(groupRef.current);
    }, []);

    useImperativeHandle(ref, () => ({
      isReady: () =>
        !!groupRef.current && !!playerRef.current?.isReady() && !!playerRef.current.getParts().torso,

      getHandRef: () => playerRef.current?.getHandRef() ?? null,

      playRunUp: async () => {
        const start = performance.now();
        const ready = await waitUntilReady(
          () => !!groupRef.current && !!playerRef.current?.isReady(),
        );
        if (!ready) {
          console.error('[Bowler] GLB not ready for run-up');
          return { ok: false, durationMs: 0 };
        }

        const group = groupRef.current!;
        const player = playerRef.current!;

        timelineRef.current?.kill();
        cancelMotionsFor(group);
        player.endProcedural();
        setBowlerHome(group);
        const runSync = syncRunLocomotion(getBowlerRunUpDistance());
        player.playClip(CLIPS.run, true, 0.15, runSync.clipTimeScale);

        await animatePosition(
          group,
          { x: scenePositions.bowlerCreaseX, z: scenePositions.bowlerStartZ, y: 0 },
          runSync.duration,
          { ease: 'linear', yBob: runSync.yBob },
        );
        player.stopClips();

        const durationMs = performance.now() - start;
        return { ok: durationMs >= MIN_RUN_UP_MS, durationMs };
      },

      playBowlingAction: async (onRelease) => {
        const start = performance.now();
        const ready = await waitUntilReady(
          () => !!groupRef.current && !!playerRef.current?.isReady(),
        );
        if (!ready) {
          console.error('[Bowler] GLB not ready for bowling action');
          return { ok: false, durationMs: 0 };
        }

        const player = playerRef.current!;
        const group = groupRef.current!;

        timelineRef.current?.kill();
        const rest = player.beginProcedural();

        const tl = buildBowlingTimeline(player.getParts(), rest, group, onRelease);
        timelineRef.current = tl;
        await timelineToPromise(tl);
        player.endProcedural();

        const durationMs = performance.now() - start;
        return { ok: durationMs >= MIN_BOWL_MS, durationMs };
      },

      reset: () => {
        timelineRef.current?.kill();
        if (groupRef.current) {
          cancelMotionsFor(groupRef.current);
          setBowlerHome(groupRef.current);
        }
        playerRef.current?.resetPose();
      },
    }));

    return (
      <group ref={groupRef}>
        <PlayerModel ref={playerRef} role="bowler" jerseyColor="#dc2626" label={name} modelUrl={modelUrl} />
      </group>
    );
  },
);
