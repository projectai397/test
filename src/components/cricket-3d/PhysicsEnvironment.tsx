import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { scenePositions } from '../../utils/animationTimings';

export function PhysicsEnvironment() {
  const pitchCenterX = scenePositions.pitchLength / 2;

  return (
    <>
      {/* Outfield ground */}
      <RigidBody type="fixed" friction={0.8} restitution={0.15}>
        <CuboidCollider args={[50, 0.05, 50]} position={[pitchCenterX, -0.05, 0]} />
      </RigidBody>

      {/* Cricket pitch — higher restitution for realistic bounce */}
      <RigidBody type="fixed" friction={0.5} restitution={0.55}>
        <CuboidCollider
          args={[scenePositions.pitchLength / 2, 0.03, scenePositions.pitchWidth / 2]}
          position={[pitchCenterX, 0.03, 0]}
        />
      </RigidBody>
    </>
  );
}
