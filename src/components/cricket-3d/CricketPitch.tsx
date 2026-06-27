import { useMemo } from 'react';
import { scenePositions } from '../../utils/animationTimings';
import {
  createPitchTexture,
  CREASE_WIDTH_M,
  POPPING_CREASE_EXT_M,
  POPPING_CREASE_M,
  RETURN_CREASE_BACK_M,
  RETURN_CREASE_OFFSET_M,
} from '../../utils/cricketPitchSurface';

const CREASE_Y = 0.018;
const creaseMat = (
  <meshBasicMaterial color="#ffffff" toneMapped={false} />
);

/** Horizontal crease (constant X, runs along Z). */
function HCrease({ x, z0, z1 }: { x: number; z0: number; z1: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, CREASE_Y, (z0 + z1) / 2]}>
      <planeGeometry args={[CREASE_WIDTH_M, Math.abs(z1 - z0)]} />
      {creaseMat}
    </mesh>
  );
}

/** Return crease (constant Z, runs along X). */
function VCrease({ z, x0, x1 }: { z: number; x0: number; x1: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, CREASE_Y, z]}>
      <planeGeometry args={[Math.abs(x1 - x0), CREASE_WIDTH_M]} />
      {creaseMat}
    </mesh>
  );
}

/**
 * ICC crease box at one end.
 * @param stumpX — bowling crease X (stumps on this line)
 * @param towardCenter — +1 if popping crease is at larger X, −1 if smaller X
 */
function EndCreases({ stumpX, towardCenter }: { stumpX: number; towardCenter: 1 | -1 }) {
  const halfW = scenePositions.pitchWidth / 2;
  const popX = stumpX + towardCenter * POPPING_CREASE_M;
  const popZ = halfW + POPPING_CREASE_EXT_M;
  const backX = stumpX - towardCenter * RETURN_CREASE_BACK_M;

  return (
    <>
      <HCrease x={stumpX} z0={-halfW} z1={halfW} />
      <HCrease x={popX} z0={-popZ} z1={popZ} />
      <VCrease z={-RETURN_CREASE_OFFSET_M} x0={backX} x1={popX} />
      <VCrease z={RETURN_CREASE_OFFSET_M} x0={backX} x1={popX} />
    </>
  );
}

export function CricketPitch() {
  const { pitchLength, pitchWidth } = scenePositions;
  const centerX = pitchLength / 2;

  const pitchTexture = useMemo(
    () => createPitchTexture(pitchLength, pitchWidth),
    [pitchLength, pitchWidth],
  );

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.014, 0]}
        receiveShadow
      >
        <planeGeometry args={[pitchLength, pitchWidth]} />
        <meshStandardMaterial
          map={pitchTexture}
          color="#c8a96e"
          roughness={0.92}
          metalness={0}
        />
      </mesh>

      <EndCreases stumpX={scenePositions.strikerEndX} towardCenter={1} />
      <EndCreases stumpX={scenePositions.nonStrikerEndX} towardCenter={-1} />
    </group>
  );
}
