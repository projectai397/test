import { useEffect, useRef } from 'react';
import type { BowlerControllerHandle } from './BowlerController';
import type { BatterControllerHandle } from './BatterController';
import type { KeeperControllerHandle } from './KeeperController';
import type { NonStrikerControllerHandle } from './NonStrikerController';
import type { FielderControllerHandle } from './FielderController';
import type { UmpireControllerHandle } from './UmpireController';
import type { BallControllerHandle } from './BallController';
import type { StumpsHandle } from './Stumps';
import {
  useCricketAnimationState,
  type CricketAnimationStore,
} from '../../hooks/useCricketAnimationState';
import { animationTimings } from '../../utils/animationTimings';
import { getResultDisplayText } from '../../utils/mapResultToShot';
import { getEventKey, type CricketBallEvent } from '../../types/cricket-ball-event';
import { mapDeliveryToAnimation } from '../../utils/mapDeliveryToAnimation';

interface AnimationOrchestratorProps {
  bowlerRef: React.RefObject<BowlerControllerHandle>;
  batterRef: React.RefObject<BatterControllerHandle>;
  keeperRef: React.RefObject<KeeperControllerHandle>;
  nonStrikerRef: React.RefObject<NonStrikerControllerHandle>;
  fieldersRef: React.RefObject<(FielderControllerHandle | null)[]>;
  umpireRef: React.RefObject<UmpireControllerHandle>;
  ballRef: React.RefObject<BallControllerHandle>;
  stumpsRef: React.RefObject<StumpsHandle>;
}

interface SceneRefs {
  bowlerRef: React.RefObject<BowlerControllerHandle>;
  batterRef: React.RefObject<BatterControllerHandle>;
  keeperRef: React.RefObject<KeeperControllerHandle>;
  nonStrikerRef: React.RefObject<NonStrikerControllerHandle>;
  fieldersRef: React.RefObject<(FielderControllerHandle | null)[]>;
  umpireRef: React.RefObject<UmpireControllerHandle>;
  ballRef: React.RefObject<BallControllerHandle>;
  stumpsRef: React.RefObject<StumpsHandle>;
}

function forEachFielder(
  ref: React.RefObject<(FielderControllerHandle | null)[]>,
  fn: (fielder: FielderControllerHandle) => void,
) {
  ref.current?.forEach((fielder) => {
    if (fielder) fn(fielder);
  });
}

async function waitForSceneReady(refs: SceneRefs, maxMs = 15000): Promise<boolean> {
  const start = Date.now();
  let lastLog = 0;
  while (Date.now() - start < maxMs) {
    const bowlerReady = refs.bowlerRef.current?.isReady?.() ?? false;
    const batterReady = refs.batterRef.current?.isReady?.() ?? false;
    const ballReady = !!refs.ballRef.current;
    if (bowlerReady && batterReady && ballReady) {
      console.info('[Cricket3D] Scene ready — starting delivery');
      return true;
    }
    const now = Date.now();
    if (now - lastLog > 2000) {
      lastLog = now;
      console.debug('[Cricket3D] Waiting for models…', { bowlerReady, batterReady, ballReady });
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  console.warn('[Cricket3D] Scene ready timeout', {
    bowlerReady: refs.bowlerRef.current?.isReady?.() ?? false,
    batterReady: refs.batterRef.current?.isReady?.() ?? false,
    ballReady: !!refs.ballRef.current,
  });
  return false;
}

function shouldStartPipeline(state: CricketAnimationStore, prev: CricketAnimationStore): boolean {
  if (state.animationState !== 'bowler_runup' || !state.currentBallEvent) return false;
  return (
    prev.animationState !== 'bowler_runup' ||
    prev.currentBallEvent !== state.currentBallEvent
  );
}

async function runDeliveryPipeline(event: CricketBallEvent, refs: SceneRefs): Promise<void> {
  const eventKey = getEventKey(event);
  const deliveryParams = mapDeliveryToAnimation(event.delivery, event.bowler.type);

  const {
    setAnimationState,
    setResultDisplay,
    resetForNextBall,
    setLastCompletedEvent,
    markEventProcessed,
    dequeueEvent,
  } = useCricketAnimationState.getState();

  const ready = await waitForSceneReady(refs);
  if (!ready) {
    console.warn('[Cricket3D] Models not ready — will retry');
    setAnimationState('idle');
    setTimeout(() => setAnimationState('bowler_runup'), 200);
    return;
  }

  const bowler = refs.bowlerRef.current!;
  const batter = refs.batterRef.current!;
  const ball = refs.ballRef.current!;

  try {
    refs.stumpsRef.current?.reset();
    bowler.reset();
    batter.reset();
    refs.keeperRef.current?.reset();
    refs.nonStrikerRef.current?.reset();
    forEachFielder(refs.fieldersRef, (f) => f.reset());
    refs.umpireRef.current?.reset();
    ball.reset();

    refs.keeperRef.current?.playCrouch();
    batter.playStance();
    refs.nonStrikerRef.current?.playWatchBall();
    forEachFielder(refs.fieldersRef, (f) => f.playWatchBall());

    await new Promise((r) => setTimeout(r, 350));

    const hand = bowler.getHandRef();
    if (hand) ball.attachToHand(hand);

    setAnimationState('bowler_runup');

    const deliveryResult = await bowler.playDelivery((hand) => {
      if (hand) {
        ball.releaseFromHand(hand, event.delivery.speed, deliveryParams.lineOffsetZ);
      } else {
        ball.releaseWithPhysics(event.delivery.speed, deliveryParams.lineOffsetZ);
      }
    });

    setAnimationState('bowling_action');
    setAnimationState('ball_released');

    const runUpResult = { ok: deliveryResult.ok, durationMs: deliveryResult.durationMs };
    const bowlResult = deliveryResult;
    refs.nonStrikerRef.current?.playWatchBall();
    forEachFielder(refs.fieldersRef, (f) => f.playWatchBall());
    await ball.waitUntilNearBatter(6000);

    setAnimationState('batter_shot');
    const shotPromise = batter.playSixShot();
    await new Promise((r) => setTimeout(r, 180));
    ball.applySixHit();
    const batResult = await shotPromise;

    setAnimationState('result_animation');
    const motionOk = runUpResult.ok && bowlResult.ok && batResult.ok;
    if (motionOk) {
      setResultDisplay(getResultDisplayText());
    } else {
      console.warn('[Cricket3D] Skipping SIX overlay — animations did not complete:', {
        runUp: runUpResult,
        bowl: bowlResult,
        bat: batResult,
      });
    }
    await ball.waitFlight(3000);

    setAnimationState('reset');
    await new Promise((r) => setTimeout(r, animationTimings.reset * 1000));

    bowler.reset();
    batter.reset();
    refs.keeperRef.current?.reset();
    refs.nonStrikerRef.current?.reset();
    forEachFielder(refs.fieldersRef, (f) => f.reset());
    refs.umpireRef.current?.reset();
    ball.reset();
    refs.stumpsRef.current?.reset();

    setLastCompletedEvent(event);
    if (!useCricketAnimationState.getState().isReplaying) {
      markEventProcessed(eventKey);
    }
    useCricketAnimationState.setState({ isReplaying: false });
    setAnimationState('completed');
    setResultDisplay(null);
    resetForNextBall();

    setTimeout(() => {
      if (useCricketAnimationState.getState().queuedEvents.length > 0) {
        dequeueEvent();
      }
    }, animationTimings.queueDelay * 1000);
  } catch (err) {
    console.error('[Cricket3D] Animation error:', err);
    resetForNextBall();
    setTimeout(() => {
      if (useCricketAnimationState.getState().queuedEvents.length > 0) {
        dequeueEvent();
      }
    }, 500);
  }
}

export function AnimationOrchestrator(props: AnimationOrchestratorProps) {
  const refs = useRef(props);
  refs.current = props;

  const pipelineRunning = useRef(false);
  const lastStartedKey = useRef<string | null>(null);

  useEffect(() => {
    const healStuckState = () => {
      const s = useCricketAnimationState.getState();
      if (
        s.currentBallEvent &&
        !['idle', 'waiting_for_ball', 'completed', 'bowler_runup'].includes(s.animationState)
      ) {
        useCricketAnimationState.setState({ animationState: 'bowler_runup' });
      } else if (
        !s.currentBallEvent &&
        s.queuedEvents.length > 0 &&
        ['idle', 'waiting_for_ball', 'completed'].includes(s.animationState)
      ) {
        useCricketAnimationState.getState().dequeueEvent();
      }
    };

    const startIfNeeded = (state: CricketAnimationStore) => {
      if (state.animationState !== 'bowler_runup' || !state.currentBallEvent) return;

      const key = getEventKey(state.currentBallEvent);
      if (pipelineRunning.current || lastStartedKey.current === key) return;

      pipelineRunning.current = true;
      lastStartedKey.current = key;

      void runDeliveryPipeline(state.currentBallEvent, refs.current).finally(() => {
        pipelineRunning.current = false;
        lastStartedKey.current = null;
      });
    };

    const unsub = useCricketAnimationState.subscribe((state, prev) => {
      if (shouldStartPipeline(state, prev)) {
        startIfNeeded(state);
      }
    });

    healStuckState();
    startIfNeeded(useCricketAnimationState.getState());

    return unsub;
  }, []);

  return null;
}
