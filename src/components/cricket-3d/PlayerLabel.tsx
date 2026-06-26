import { Html } from '@react-three/drei';

interface PlayerLabelProps {
  name: string;
  position?: [number, number, number];
}

export function PlayerLabel({ name, position = [0, 2.2, 0] }: PlayerLabelProps) {
  return (
    <Html center distanceFactor={14} position={position} style={{ pointerEvents: 'none' }}>
      <div className="player-label">{name}</div>
    </Html>
  );
}
