import { FLOODLIGHT_TOWER_HEIGHT } from '../../../utils/stadiumConstants';

interface FloodlightTowerProps {
  position: [number, number, number];
}

/** Floodlight tower structure only — lights off for day matches. */
export function FloodlightTower({ position }: FloodlightTowerProps) {
  const h = FLOODLIGHT_TOWER_HEIGHT;

  return (
    <group position={position}>
      {[0, 120, 240].map((deg) => (
        <mesh key={deg} position={[0, h * 0.45, 0]} rotation={[0, (deg * Math.PI) / 180, 0.04]}>
          <boxGeometry args={[0.12, h * 0.88, 0.12]} />
          <meshStandardMaterial color="#c8d0dc" metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, h * 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.14, h * 0.9, 6]} />
        <meshStandardMaterial color="#b0bac8" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* LED bank — switched off */}
      <mesh position={[0, h, 0]}>
        <boxGeometry args={[3.2, 0.5, 1.4]} />
        <meshStandardMaterial color="#5a6068" roughness={0.75} metalness={0.15} />
      </mesh>
    </group>
  );
}
