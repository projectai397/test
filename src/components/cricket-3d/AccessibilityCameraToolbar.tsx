import type { ReactNode } from 'react';
import {
  panCamera,
  resetCameraView,
  zoomCameraIn,
  zoomCameraOut,
} from '../../utils/cameraNavigation';

export function AccessibilityCameraToolbar() {
  return (
    <div
      className="a11y-camera"
      role="toolbar"
      aria-label="Camera navigation"
    >
      <span className="a11y-camera__title">Navigate</span>

      <div className="a11y-camera__grid">
        <div className="a11y-camera__spacer" aria-hidden />

        <NavButton label="Pan up" onClick={() => panCamera('up')}>
          ↑
        </NavButton>
        <div className="a11y-camera__spacer" aria-hidden />

        <NavButton label="Pan left" onClick={() => panCamera('left')}>
          ←
        </NavButton>
        <NavButton label="Reset camera view" onClick={resetCameraView} variant="reset">
          ⌂
        </NavButton>
        <NavButton label="Pan right" onClick={() => panCamera('right')}>
          →
        </NavButton>

        <div className="a11y-camera__spacer" aria-hidden />
        <NavButton label="Pan down" onClick={() => panCamera('down')}>
          ↓
        </NavButton>
        <div className="a11y-camera__spacer" aria-hidden />
      </div>

      <div className="a11y-camera__zoom">
        <NavButton label="Zoom out" onClick={zoomCameraOut} variant="zoom">
          −
        </NavButton>
        <span className="a11y-camera__zoom-label">Zoom</span>
        <NavButton label="Zoom in" onClick={zoomCameraIn} variant="zoom">
          +
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
  variant = 'nav',
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  variant?: 'nav' | 'zoom' | 'reset';
}) {
  return (
    <button
      type="button"
      className={`a11y-camera__btn a11y-camera__btn--${variant}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
