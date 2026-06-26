interface ReplayButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ReplayButton({ onClick, disabled }: ReplayButtonProps) {
  return (
    <button
      type="button"
      className="replay-button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Replay last delivery"
    >
      Replay
    </button>
  );
}
