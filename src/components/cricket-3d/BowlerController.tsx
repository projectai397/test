import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel, type PlayerModelHandle } from './PlayerModel';
import { CLIPS } from '../../utils/playerModels';
import {
  buildBowlingTimeline,
  buildUnifiedBowlerTimeline,
  type UnifiedBowlerTimeline,
  MIN_BOWL_MS,
  MIN_RUN_UP_MS,
  timelineToPromise,
  timelineUntil,
} from '../../utils/cricketProcedural';
import { scenePositions, animationTimings } from '../../utils/animationTimings';
import { bowlerFacingTowardStriker, meshyBowlerDeliveryInnerRotation } from '../../utils/playerFacing';
import type { BoneRestMap } from '../../utils/boneRestPose';
import {
  getBowlerRunUpDistance,
  syncCricketBowlerRunUp,
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
  playBowlingAction: (
    onRelease?: () => void,
    deliverySpeedKmh?: number,
  ) => Promise<AnimationCompletion>;
  reset: () => void;
  getHandRef: () => THREE.Object3D | null;
}

interface BowlerControllerProps {
  name?: string;
  jerseyColor: string;
  trouserColor?: string;
  showCap?: boolean;
  modelUrl?: string;
}

function setBowlerHome(group: THREE.Group, modelUrl?: string) {
  group.position.set(scenePositions.bowlerStartX, 0, scenePositions.bowlerStartZ);
  group.rotation.set(0, bowlerFacingTowardStriker(modelUrl), 0);
}

export const BowlerController = forwardRef<BowlerControllerHandle, BowlerControllerProps>(
  function BowlerController({ name = 'B Stokes', jerseyColor, trouserColor, showCap, modelUrl }, ref) {
    const playerRef = useRef<PlayerModelHandle>(null);
    const groupRef = useRef<THREE.Group>(null);
    const timelineRef = useRef<UnifiedBowlerTimeline['timeline'] | null>(null);
    const runUpEndTimeRef = useRef(0);
    const bindRestRef = useRef<BoneRestMap | null>(null);
    const usesClipRunUpRef = useRef(false);

    useLayoutEffect(() => {
      if (groupRef.current) setBowlerHome(groupRef.current, modelUrl);
    }, [modelUrl]);

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
        bindRestRef.current = null;
        usesClipRunUpRef.current = false;
        setBowlerHome(group, modelUrl);
        const runFacing = bowlerFacingTowardStriker(modelUrl);

        const distance = getBowlerRunUpDistance();
        let moveDuration: number = animationTimings.runUp;

        if (player.hasClip('run')) {
          usesClipRunUpRef.current = true;
          const sync = syncRunLocomotion(distance);
          moveDuration = sync.duration;
          player.playClip(CLIPS.run, true, 0.15, sync.clipTimeScale);
          await animatePosition(
            group,
            { x: scenePositions.bowlerCreaseX, z: 0, y: 0 },
            moveDuration,
            { ease: 'power2InOut', yBob: sync.yBob },
          );
          group.rotation.set(0, runFacing, 0);
          player.stopClips();
        } else if (player.hasClip('walk')) {
          usesClipRunUpRef.current = true;
          const sync = syncCricketWalkRunUp(distance);
          moveDuration = sync.duration;
          player.playClip(CLIPS.walk, true, 0.15, sync.clipTimeScale);
          await animatePosition(
            group,
            { x: scenePositions.bowlerCreaseX, z: 0, y: 0 },
            moveDuration,
            { ease: 'power2InOut', yBob: sync.yBob },
          );
          group.rotation.set(0, runFacing, 0);
          player.stopClips();
        } else {
          const sync = syncCricketBowlerRunUp(distance);
          moveDuration = sync.duration;
          const bindRest = player.beginProcedural();
          bindRestRef.current = bindRest;

          const { timeline, runUpEndTime } = buildUnifiedBowlerTimeline(
            player.getParts(),
            bindRest,
            group,
            moveDuration,
            undefined,
            undefined,
            modelUrl,
          );
          timelineRef.current = timeline;
          runUpEndTimeRef.current = runUpEndTime;
          timeline.play();
          await timelineUntil(timeline, runUpEndTime);
        }

        const durationMs = performance.now() - start;
        return { ok: durationMs >= MIN_RUN_UP_MS, durationMs };
      },

      playBowlingAction: async (onRelease, deliverySpeedKmh) => {
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

        if (player.hasClip('bowl')) {
          timelineRef.current?.kill();
          timelineRef.current = null;
          bindRestRef.current = null;
          player.endProcedural();
          player.stopClips();

          group.position.set(scenePositions.bowlerCreaseX, 0, 0);
          group.rotation.set(0, bowlerFacingTowardStriker(modelUrl), 0);

          const deliveryInnerRot = meshyBowlerDeliveryInnerRotation(modelUrl);
          player.setDeliveryRotationOffset(deliveryInnerRot);

          const pace = Math.max(0.85, Math.min(1.2, (deliverySpeedKmh ?? 132) / 132));
          try {
            await player.playClipOnce('bowl', {
              onRelease,
              releaseFraction: 0.38,
              timeScale: pace,
            });
          } finally {
            player.setDeliveryRotationOffset(0);
          }
          usesClipRunUpRef.current = false;
          const durationMs = performance.now() - start;
          return { ok: durationMs >= MIN_BOWL_MS, durationMs };
        }

        const bindRest = bindRestRef.current ?? player.beginProcedural();
        bindRestRef.current = null;

        if (timelineRef.current && !usesClipRunUpRef.current) {
          const tl = timelineRef.current;
          const speed = deliverySpeedKmh ?? 132;
          const releaseTime =
            runUpEndTimeRef.current + 0.3 * (132 / Math.max(90, Math.min(160, speed)));
          if (onRelease) tl.call(onRelease, undefined, releaseTime);
          tl.play();
          await timelineToPromise(tl);
          timelineRef.current = null;
        } else {
          timelineRef.current?.kill();
          player.stopClips();

          const tl = buildBowlingTimeline(player.getParts(), bindRest, group, onRelease, {
            deliverySpeedKmh,
            skipGather: false,
            modelUrl,
          });
          timelineRef.current = tl;
          tl.play();
          await timelineToPromise(tl);
          timelineRef.current = null;
        }

        usesClipRunUpRef.current = false;
        player.endProcedural();

        const durationMs = performance.now() - start;
        return { ok: durationMs >= MIN_BOWL_MS, durationMs };
      },

      reset: () => {
        timelineRef.current?.kill();
        timelineRef.current = null;
        bindRestRef.current = null;
        usesClipRunUpRef.current = false;
        if (groupRef.current) {
          cancelMotionsFor(groupRef.current);
          setBowlerHome(groupRef.current, modelUrl);
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
          trouserColor={trouserColor}
          showCap={showCap}
          label={name}
          modelUrl={modelUrl}
        />
      </group>
    );
  },
);
