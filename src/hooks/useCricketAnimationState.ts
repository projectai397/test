import { create } from 'zustand';
import type {
  AnimationState,
  CameraMode,
  ConnectionStatus,
  CricketBallEvent,
  Vec3,
} from '../types/cricket-ball-event';
import { normalizeResult } from '../types/cricket-ball-event';
import type { CameraViewPreset } from '../utils/cameraPresets';

export interface CricketAnimationStore {
  connectionStatus: ConnectionStatus;
  animationState: AnimationState;
  currentBallEvent: CricketBallEvent | null;
  lastCompletedEvent: CricketBallEvent | null;
  isReplaying: boolean;
  queuedEvents: CricketBallEvent[];
  processedEventKeys: Set<string>;
  cameraMode: CameraMode;
  cameraViewPreset: CameraViewPreset;
  fixedCameraAngle: boolean;
  ballPosition: Vec3;
  resultDisplay: string | null;
  showWaitingText: boolean;

  setConnectionStatus: (status: ConnectionStatus) => void;
  setAnimationState: (state: AnimationState) => void;
  setCurrentBallEvent: (event: CricketBallEvent | null) => void;
  setLastCompletedEvent: (event: CricketBallEvent) => void;
  setIsReplaying: (value: boolean) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraViewPreset: (preset: CameraViewPreset) => void;
  setFixedCameraAngle: (fixed: boolean) => void;
  setBallPosition: (pos: Vec3) => void;
  setResultDisplay: (text: string | null) => void;
  setShowWaitingText: (show: boolean) => void;

  enqueueEvent: (event: CricketBallEvent) => boolean;
  dequeueEvent: () => CricketBallEvent | undefined;
  markEventProcessed: (key: string) => void;
  isEventProcessed: (key: string) => boolean;
  clearQueue: () => void;

  startReplay: () => void;
  advanceState: () => void;
  resetForNextBall: () => void;
}

const STATE_ORDER: AnimationState[] = [
  'idle',
  'waiting_for_ball',
  'bowler_runup',
  'bowling_action',
  'ball_released',
  'batter_shot',
  'result_animation',
  'reset',
  'completed',
];

function normalizeEvent(event: CricketBallEvent): CricketBallEvent {
  return {
    ...event,
    result: normalizeResult(event.result),
  };
}

export const useCricketAnimationState = create<CricketAnimationStore>((set, get) => ({
  connectionStatus: 'offline',
  animationState: 'idle',
  currentBallEvent: null,
  lastCompletedEvent: null,
  isReplaying: false,
  queuedEvents: [],
  processedEventKeys: new Set(),
  cameraMode: 'broadcast',
  cameraViewPreset: 'broadcast',
  fixedCameraAngle: false,
  ballPosition: { x: 14, y: 1.5, z: 0 },
  resultDisplay: null,
  showWaitingText: false,

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setAnimationState: (state) => set({ animationState: state }),
  setCurrentBallEvent: (event) => set({ currentBallEvent: event }),
  setLastCompletedEvent: (event) => set({ lastCompletedEvent: event }),
  setIsReplaying: (value) => set({ isReplaying: value }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCameraViewPreset: (preset) => set({ cameraViewPreset: preset }),
  setFixedCameraAngle: (fixed) => set({ fixedCameraAngle: fixed }),
  setBallPosition: (pos) => set({ ballPosition: pos }),
  setResultDisplay: (text) => set({ resultDisplay: text }),
  setShowWaitingText: (show) => set({ showWaitingText: show }),

  enqueueEvent: (rawEvent) => {
    const event = normalizeEvent(rawEvent);
    const key = `${event.match_id}:${event.over}:${event.ball}`;
    const { processedEventKeys, queuedEvents, animationState } = get();

    if (processedEventKeys.has(key)) return false;
    if (queuedEvents.some((e) => `${e.match_id}:${e.over}:${e.ball}` === key)) {
      return false;
    }

    const canStartImmediately =
      ['idle', 'waiting_for_ball', 'completed'].includes(animationState) ||
      (animationState === 'bowler_runup' && !get().currentBallEvent);

    if (canStartImmediately && queuedEvents.length === 0 && !get().currentBallEvent) {
      set({
        currentBallEvent: event,
        animationState: 'bowler_runup',
        showWaitingText: false,
        resultDisplay: null,
        cameraMode: 'track_bowler',
      });
      return true;
    }

    set({ queuedEvents: [...queuedEvents, event] });
    return true;
  },

  dequeueEvent: () => {
    const { queuedEvents } = get();
    if (queuedEvents.length === 0) return undefined;
    const [next, ...rest] = queuedEvents;
    set({
      queuedEvents: rest,
      currentBallEvent: next,
      animationState: 'bowler_runup',
      resultDisplay: null,
      cameraMode: 'track_bowler',
    });
    return next;
  },

  markEventProcessed: (key) => {
    const processed = new Set(get().processedEventKeys);
    processed.add(key);
    set({ processedEventKeys: processed });
  },

  isEventProcessed: (key) => get().processedEventKeys.has(key),

  clearQueue: () => set({ queuedEvents: [] }),

  startReplay: () => {
    const { lastCompletedEvent } = get();
    if (!lastCompletedEvent) return;
    set({
      isReplaying: true,
      currentBallEvent: lastCompletedEvent,
      animationState: 'bowler_runup',
      resultDisplay: null,
      cameraMode: 'track_bowler',
      showWaitingText: false,
    });
  },

  advanceState: () => {
    const { animationState, currentBallEvent, isReplaying } = get();
    const idx = STATE_ORDER.indexOf(animationState);
    const next = STATE_ORDER[Math.min(idx + 1, STATE_ORDER.length - 1)];

    if (next === 'completed' && currentBallEvent) {
      if (!isReplaying) {
        get().markEventProcessed(
          `${currentBallEvent.match_id}:${currentBallEvent.over}:${currentBallEvent.ball}`,
        );
        set({ lastCompletedEvent: currentBallEvent });
      }
      set({
        animationState: 'completed',
        isReplaying: false,
        cameraMode: 'broadcast',
      });
      return;
    }

    set({ animationState: next });
  },

  resetForNextBall: () => {
    set({
      currentBallEvent: null,
      animationState: 'waiting_for_ball',
      cameraMode: 'broadcast',
      ballPosition: { x: 14, y: 1.5, z: 0 },
      showWaitingText: true,
    });
  },
}));

export function useAnimationStateSelector<T>(
  selector: (state: CricketAnimationStore) => T,
): T {
  return useCricketAnimationState(selector);
}
