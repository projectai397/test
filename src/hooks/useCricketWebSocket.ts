import { useEffect, useRef } from 'react';
import type { CricketBallEvent } from '../types/cricket-ball-event';
import { buildDefaultBallEvent } from '../utils/defaultBallEvent';
import { loadMatchConfig } from '../config/loadMatchConfig';
import { animationTimings } from '../utils/animationTimings';
import { useCricketAnimationState } from './useCricketAnimationState';

function isValidBallEvent(data: unknown): data is CricketBallEvent {
  if (!data || typeof data !== 'object') return false;
  const e = data as Record<string, unknown>;
  return (
    typeof e.match_id === 'string' &&
    typeof e.over === 'number' &&
    typeof e.ball === 'number' &&
    typeof e.bowler === 'object' &&
    e.bowler !== null
  );
}

interface UseCricketWebSocketOptions {
  wsUrl?: string;
  autoPlayDemo?: boolean;
  onBallEvent?: (event: CricketBallEvent) => void;
}

export function useCricketWebSocket({
  wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8081',
  autoPlayDemo = true,
  onBallEvent,
}: UseCricketWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const demoPlayed = useRef(false);
  const mounted = useRef(true);

  const setConnectionStatus = useCricketAnimationState((s) => s.setConnectionStatus);
  const enqueueEvent = useCricketAnimationState((s) => s.enqueueEvent);
  const setShowWaitingText = useCricketAnimationState((s) => s.setShowWaitingText);

  useEffect(() => {
    mounted.current = true;
    const demoEvent = buildDefaultBallEvent(loadMatchConfig());

    const connect = () => {
      if (!mounted.current) return;

      setConnectionStatus('reconnecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted.current) return;
        reconnectAttempt.current = 0;
        setConnectionStatus('live');
        setShowWaitingText(true);

        if (autoPlayDemo && !demoPlayed.current) {
          demoPlayed.current = true;
          setTimeout(() => {
            if (mounted.current) enqueueEvent(demoEvent);
          }, 1200);
        }
      };

      ws.onmessage = (msg) => {
        if (!mounted.current) return;
        try {
          const data = JSON.parse(msg.data as string);
          if (data.type === 'welcome') return;
          if (isValidBallEvent(data)) {
            onBallEvent?.(data);
            enqueueEvent(data);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        if (!mounted.current) return;
        setConnectionStatus('offline');
      };

      ws.onclose = () => {
        if (!mounted.current) return;
        setConnectionStatus('offline');
        wsRef.current = null;

        if (autoPlayDemo && !demoPlayed.current) {
          demoPlayed.current = true;
          setTimeout(() => {
            if (mounted.current) {
              enqueueEvent(demoEvent);
            }
          }, animationTimings.demoOfflineDelay * 1000);
        }

        const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 30000);
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };
    };

    connect();

    useCricketAnimationState.setState({ animationState: 'waiting_for_ball', showWaitingText: true });

    return () => {
      mounted.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [wsUrl, autoPlayDemo, onBallEvent, setConnectionStatus, enqueueEvent, setShowWaitingText]);
}
