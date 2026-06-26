/** Free-roam camera controls hint (no preset angles). */
export function CameraAnglePicker() {
  return (
    <div className="camera-picker">
      <div className="camera-picker__header">
        <span className="camera-picker__title">Camera</span>
      </div>
      <p className="camera-picker__hint">
        Drag to rotate · Scroll to zoom · Right-drag to pan
      </p>
    </div>
  );
}
