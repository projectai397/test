import { useMemo } from 'react';
import * as THREE from 'three';
import {
  FLOODLIGHT_COUNT,
  FLOODLIGHT_RADIUS,
  STADIUM_CENTER_X,
  STADIUM_RX,
  STADIUM_RZ,
  STAND_DEPTH,
  STAND_SEGMENTS,
  STAND_SEGMENT_WIDTH,
  TIER_COLORS,
  TIER_HEIGHTS,
} from '../../../utils/stadiumConstants';
import { createCrowdTexture } from '../../../utils/stadiumTextures';
import { FloodlightTower } from './FloodlightTower';
import { DaySky } from './DaySky';

function StandTier({
  y,
  height,
  color,
  crowdMap,
}: {
  y: number;
  height: number;
  color: string;
  crowdMap: THREE.Texture;
}) {
  return (
    <group position={[0, y + height / 2, STAND_DEPTH * 0.35]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[STAND_SEGMENT_WIDTH, height, STAND_DEPTH]} />
        <meshStandardMaterial map={crowdMap} color={color} roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0, -STAND_DEPTH * 0.55]}>
        <boxGeometry args={[STAND_SEGMENT_WIDTH * 0.92, height * 0.95, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} />
      </mesh>
    </group>
  );
}

function StandSegment({
  crowdMap,
  index,
}: {
  crowdMap: THREE.Texture;
  index: number;
}) {
  const t = (index / STAND_SEGMENTS) * Math.PI * 2;
  const x = Math.cos(t) * STADIUM_RX;
  const z = Math.sin(t) * STADIUM_RZ;
  const yaw = Math.atan2(-x, -z);

  let tierY = 0;
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      {TIER_COLORS.map((color, tier) => {
        const h = TIER_HEIGHTS[tier];
        const y = tierY;
        tierY += h + 0.15;
        return (
          <StandTier key={tier} y={y} height={h} color={color} crowdMap={crowdMap} />
        );
      })}

      <mesh position={[0, tierY * 0.45, -STAND_DEPTH * 1.1]} receiveShadow>
        <boxGeometry args={[STAND_SEGMENT_WIDTH * 1.05, tierY * 1.05, 1.2]} />
        <meshStandardMaterial color="#b8bcc4" roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh position={[0, tierY * 0.55, -STAND_DEPTH * 1.65]}>
        <boxGeometry args={[STAND_SEGMENT_WIDTH * 0.7, tierY * 0.85, 0.18]} />
        <meshStandardMaterial color="#eef1f6" roughness={0.55} metalness={0.08} />
      </mesh>
    </group>
  );
}

export function OvalStadium() {
  const crowdMap = useMemo(() => createCrowdTexture(), []);

  const floodlightPositions = useMemo(() => {
    return Array.from({ length: FLOODLIGHT_COUNT }, (_, i) => {
      const t = (i / FLOODLIGHT_COUNT) * Math.PI * 2 + Math.PI / 12;
      return [
        STADIUM_CENTER_X + Math.cos(t) * FLOODLIGHT_RADIUS,
        0,
        Math.sin(t) * FLOODLIGHT_RADIUS * (STADIUM_RZ / STADIUM_RX),
      ] as [number, number, number];
    });
  }, []);

  return (
    <group>
      <DaySky />

      <group position={[STADIUM_CENTER_X, 0, 0]}>
        {Array.from({ length: STAND_SEGMENTS }, (_, i) => (
          <StandSegment key={i} crowdMap={crowdMap} index={i} />
        ))}
      </group>

      {floodlightPositions.map((pos, i) => (
        <FloodlightTower key={i} position={pos} />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[STADIUM_CENTER_X, 0.05, 0]} receiveShadow>
        <ringGeometry args={[STADIUM_RX - 4, STADIUM_RX + 6, 96]} />
        <meshStandardMaterial color="#9aa3ad" roughness={0.9} metalness={0.05} />
      </mesh>
    </group>
  );
}
