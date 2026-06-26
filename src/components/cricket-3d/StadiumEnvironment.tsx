import { Sky, Environment } from '@react-three/drei';

export function StadiumEnvironment() {
  return (
    <group>
      <Sky
        distance={450000}
        sunPosition={[100, 30, 50]}
        inclination={0.52}
        azimuth={0.25}
      />
      <Environment preset="park" />

      {/* Stadium stands - far side */}
      <StadiumStand position={[10, 0, -35]} rotation={[0, 0, 0]} />
      <StadiumStand position={[10, 0, 35]} rotation={[0, Math.PI, 0]} />

      {/* Floodlight poles */}
      <Floodlight position={[25, 0, -20]} />
      <Floodlight position={[25, 0, 20]} />
      <Floodlight position={[-15, 0, -25]} />
      <Floodlight position={[-15, 0, 25]} />

      {/* Low boundary fence */}
      <mesh position={[10, 0.4, 0]}>
        <torusGeometry args={[44, 0.08, 8, 64]} />
        <meshStandardMaterial color="#cccccc" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

function StadiumStand({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[(i - 3.5) * 8, 2 + i * 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[7, 4 + i * 0.5, 3]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#1a3a5c' : '#2a4a6c'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Floodlight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 12, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.6} />
      </mesh>
      <mesh position={[0, 12.2, 0]}>
        <boxGeometry args={[2, 0.3, 0.8]} />
        <meshStandardMaterial color="#eeeeee" emissive="#ffffcc" emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 12, 0]} intensity={0.3} distance={60} color="#fff5e0" />
    </group>
  );
}
