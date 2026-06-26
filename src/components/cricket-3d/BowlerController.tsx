import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { CLIPS } from '../../utils/playerModels';
import {
  buildBowlingTimeline,
  buildProceduralRunUpTimeline,
  MIN_BOWL_MS,
  MIN_RUN_UP_MS,
  timelineToPromise,
} from '../../utils/cricketProcedural';
import { scenePositions, animationTimings } from '../../utils/animationTimings';
import { PITCH_FACING } from '../../utils/playerFacing';
import {
  getBowlerRunUpDistance,
  syncCricketWalkRunUp,
  syncRunLocomotion,
} from '../../utils/locomotionSync';
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
  jerseyColor: string;
  showCap?: boolean;
  modelUrl?: string;
}

function setBowlerHome(group: THREE.Group) {
  group.position.set(scenePositions.bowlerStartX, 0, scenePositions.bowlerStartZ);
  group.rotation.set(0, PITCH_FACING.towardStriker, 0);
}

export const BowlerController = forwardRef<BowlerControllerHandle, BowlerControllerProps>(
  function BowlerController({ name = 'B Stokes', jerseyColor, showCap, modelUrl }, ref) {
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

        const distance = getBowlerRunUpDistance();
        let moveDuration = animationTimings.runUp;
        let yBob = { amplitude: 0.12, period: 0.18 };

        if (player.hasClip('run')) {
          const sync = syncRunLocomotion(distance);
          moveDuration = sync.duration;
          yBob = sync.yBob;
          player.playClip(CLIPS.run, true, 0.15, sync.clipTimeScale);
        } else if (player.hasClip('walk')) {
          const sync = syncCricketWalkRunUp(distance);
          moveDuration = sync.duration;
          yBob = sync.yBob;
          player.playClip(CLIPS.walk, true, 0.15, sync.clipTimeScale);
        } else {
          const sync = syncRunLocomotion(distance);
          moveDuration = sync.duration;
          yBob = sync.yBob;
          const rest = player.beginProcedural();
          timelineRef.current = buildProceduralRunUpTimeline(
            player.getParts(),
            rest,
            moveDuration,
            sync.cycles,
          );
        }

        await animatePosition(
          group,
          { x: scenePositions.bowlerCreaseX, z: scenePositions.bowlerStartZ, y: 0 },
          moveDuration,
          { ease: 'power1Out', yBob },
        );

        timelineRef.current?.kill();
        timelineRef.current = null;
        player.stopClips();
        player.endProcedural();

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
        player.stopClips();
        player.endProcedural();
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
        timelineRef.current = null;
        if (groupRef.current) {
          cancelMotionsFor(groupRef.current);
          setBowlerHome(groupRef.current);
        }
        playerRef.current?.resetPose();
      },
    }));

    return (
      <group ref={groupRef}>
        <PlayerModel
          ref={playerRef}
          role="bowler"
          jerseyColor={jerseyColor}
          showCap={showCap}
          label={name}
          modelUrl={modelUrl}
        />
      </group>
    );
  },
);
