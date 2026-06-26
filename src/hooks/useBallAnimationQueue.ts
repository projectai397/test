import { useCallback, useRef } from 'react';
import type { CricketBallEvent } from '../types/cricket-ball-event';
import { getEventKey } from '../types/cricket-ball-event';
import { useCricketAnimationState } from './useCricketAnimationState';

export function useBallAnimationQueue() {
  const enqueueEvent = useCricketAnimationState((s) => s.enqueueEvent);
  const dequeueEvent = useCricketAnimationState((s) => s.dequeueEvent);
  const resetForNextBall = useCricketAnimationState((s) => s.resetForNextBall);
  const animationState = useCricketAnimationState((s) => s.animationState);
  const queuedCount = useCricketAnimationState((s) => s.queuedEvents.length);
  const pendingRef = useRef<Set<string>>(new Set());

  const addToQueue = useCallback(
    (event: CricketBallEvent) => {
      const key = getEventKey(event);
      if (pendingRef.current.has(key)) return false;
      pendingRef.current.add(key);
      const added = enqueueEvent(event);
      if (!added) pendingRef.current.delete(key);
      return added;
    },
    [enqueueEvent],
  );

  const processNextInQueue = useCallback(() => {
    const next = dequeueEvent();
    if (next) {
      pendingRef.current.delete(getEventKey(next));
    }
    return next;
  }, [dequeueEvent]);

  const onAnimationComplete = useCallback(() => {
    resetForNextBall();
    setTimeout(() => {
      if (useCricketAnimationState.getState().queuedEvents.length > 0) {
        processNextInQueue();
      }
    }, 400);
  }, [resetForNextBall, processNextInQueue]);

  const canAcceptEvents = ['idle', 'waiting_for_ball', 'completed'].includes(
    animationState,
  );

  return {
    addToQueue,
    processNextInQueue,
    onAnimationComplete,
    queuedCount,
    canAcceptEvents,
  };
}
