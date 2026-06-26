import type { ConnectionStatus, CricketBallEvent } from '../../types/cricket-ball-event';
import { formatDeliveryType } from '../../utils/mapDeliveryToAnimation';
import { ResultEffect } from './ResultEffect';
import { ReplayButton } from './ReplayButton';
import { CameraAnglePicker } from './CameraAnglePicker';

interface LiveOverlayProps {
  connectionStatus: ConnectionStatus;
  currentEvent: CricketBallEvent | null;
  resultDisplay: string | null;
  showWaitingText: boolean;
  queuedCount: number;
  onReplay: () => void;
  canReplay: boolean;
  onResultComplete?: () => void;
}

export function LiveOverlay({
  connectionStatus,
  currentEvent,
  resultDisplay,
  showWaitingText,
  queuedCount,
  onReplay,
  canReplay,
  onResultComplete,
}: LiveOverlayProps) {
  const statusLabel =
    connectionStatus === 'live'
      ? 'Live'
      : connectionStatus === 'reconnecting'
        ? 'Reconnecting'
        : 'Offline';

  const statusClass = `status-pill status-pill--${connectionStatus}`;

  return (
    <div className="live-overlay">
      <div className="live-overlay__top-left">
        <span className={statusClass}>{statusLabel}</span>
        {currentEvent && (
          <>
            <span className="overlay-chip">
              Over {currentEvent.over}.{currentEvent.ball}
            </span>
            <span className="overlay-chip">
              {formatDeliveryType(currentEvent.bowler.type)}
            </span>
          </>
        )}
        {queuedCount > 0 && (
          <span className="overlay-chip overlay-chip--queue">
            +{queuedCount} queued
          </span>
        )}
      </div>

      <div className="live-overlay__top-right">
        <ReplayButton onClick={onReplay} disabled={!canReplay} />
      </div>

      <div className="live-overlay__bottom-left">
        <CameraAnglePicker />
      </div>

      {showWaitingText && !resultDisplay && (
        <div className="waiting-text">Waiting for next ball...</div>
      )}

      <ResultEffect text={resultDisplay} onComplete={onResultComplete} />
    </div>
  );
}
