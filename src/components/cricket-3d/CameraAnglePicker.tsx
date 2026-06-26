import { useCricketAnimationState } from '../../hooks/useCricketAnimationState';
import { CAMERA_PRESETS, type CameraViewPreset } from '../../utils/cameraPresets';

export function CameraAnglePicker() {
  const cameraViewPreset = useCricketAnimationState((s) => s.cameraViewPreset);
  const setCameraViewPreset = useCricketAnimationState((s) => s.setCameraViewPreset);

  return (
    <div className="camera-picker">
      <div className="camera-picker__header">
        <span className="camera-picker__title">Camera Angle</span>
      </div>

      <div className="camera-picker__grid">
        {CAMERA_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`camera-picker__btn ${
              cameraViewPreset === preset.id ? 'camera-picker__btn--active' : ''
            }`}
            onClick={() => setCameraViewPreset(preset.id as CameraViewPreset)}
            title={preset.label}
          >
            {preset.shortLabel}
          </button>
        ))}
      </div>

      <p className="camera-picker__hint">
        {cameraViewPreset === 'free'
          ? 'Drag to rotate · Scroll to zoom · Right-drag to pan'
          : 'Camera stays on this angle during delivery'}
      </p>
    </div>
  );
}
