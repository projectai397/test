import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import {
  BALL_RADIUS,
  computeReleaseVelocity,
  computeSixImpulse,
  getHandReleaseForward,
  speedKmhToMs,
} from '../../utils/ballPhysics';
import { BALL_FLIGHT_START_DELAY_SEC } from '../../utils/bowlingMotionConfig';
import { scenePositions } from '../../utils/animationTimings';

export interface BallControllerHandle {
  attachToHand: (hand: THREE.Object3D) => void;
  releaseWithPhysics: (speedKmh: number, lineOffsetZ: number) => void;
  releaseFromHand: (hand: THREE.Object3D, speedKmh: number, lineOffsetZ: number) => void;
  applySixHit: () => void;
  waitUntilNearBatter: (timeoutMs?: number) => Promise<void>;
  waitFlight: (durationMs: number) => Promise<void>;
  reset: () => void;
}

type BallMode = 'hidden' | 'attached' | 'heldAtRelease' | 'dynamic';

export const BallController = forwardRef<BallControllerHandle>(function BallController(_, ref) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const handRef = useRef<THREE.Object3D | null>(null);
  const modeRef = useRef<BallMode>('hidden');
  const flightDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ballVisible, setBallVisible] = useState(false);
  const worldPos = useRef(new THREE.Vector3());
  const waitResolveRef = useRef<(() => void) | null>(null);

  const clearFlightDelay = () => {
    if (flightDelayTimerRef.current !== null) {
      clearTimeout(flightDelayTimerRef.current);
      flightDelayTimerRef.current = null;
    }
  };

  const launchBall = (vel: { x: number; y: number; z: number }, speedKmh: number) => {
    const body = bodyRef.current;
    if (!body) return;

    handRef.current = null;
    modeRef.current = 'dynamic';
    body.setBodyType(0, true);
    body.setLinvel(vel, true);
    body.setAngvel({ x: speedKmhToMs(speedKmh) * 8, y: 2, z: 1.5 }, true);
  };

  const scheduleFlight = (
    vel: { x: number; y: number; z: number },
    speedKmh: number,
  ) => {
    clearFlightDelay();
    setBallVisible(true);

    const delayMs = Math.max(0, BALL_FLIGHT_START_DELAY_SEC * 1000);
    if (delayMs <= 0) {
      launchBall(vel, speedKmh);
      return;
    }

    modeRef.current = 'heldAtRelease';
    const body = bodyRef.current;
    if (body) {
      body.setBodyType(2, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    flightDelayTimerRef.current = setTimeout(() => {
      flightDelayTimerRef.current = null;
      launchBall(vel, speedKmh);
    }, delayMs);
  };

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;

    if (modeRef.current === 'attached' && handRef.current) {
      handRef.current.getWorldPosition(worldPos.current);
      body.setNextKinematicTranslation({
        x: worldPos.current.x,
        y: worldPos.current.y + 0.06,
        z: worldPos.current.z,
      });
      return;
    }

    if (modeRef.current === 'dynamic' && waitResolveRef.current) {
      const t = body.translation();
      if (t.x <= scenePositions.strikerEndX + 1.8) {
        waitResolveRef.current();
        waitResolveRef.current = null;
      }
    }
  });

  useImperativeHandle(ref, () => ({
    attachToHand: (hand) => {
      handRef.current = hand;
      modeRef.current = 'attached';
      setBallVisible(true);
      const body = bodyRef.current;
      if (!body) return;

      body.setBodyType(2, true);
      hand.getWorldPosition(worldPos.current);
      body.setTranslation(
        { x: worldPos.current.x, y: worldPos.current.y + 0.06, z: worldPos.current.z },
        true,
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    },

    releaseWithPhysics: (speedKmh, lineOffsetZ) => {
      const body = bodyRef.current;
      if (!body) return;

      const pos = body.translation();
      const vel = computeReleaseVelocity({
        speedKmh,
        lineOffsetZ,
        releaseWorldPos: { x: pos.x, y: pos.y, z: pos.z },
      });

      scheduleFlight(vel, speedKmh);
    },

    releaseFromHand: (hand, speedKmh, lineOffsetZ) => {
      const body = bodyRef.current;
      if (!body) return;

      hand.updateWorldMatrix(true, false);
      hand.getWorldPosition(worldPos.current);
      const forward = getHandReleaseForward(hand);

      body.setTranslation(
        { x: worldPos.current.x, y: worldPos.current.y + 0.06, z: worldPos.current.z },
        true,
      );

      const vel = computeReleaseVelocity({
        speedKmh,
        lineOffsetZ,
        releaseWorldPos: {
          x: worldPos.current.x,
          y: worldPos.current.y + 0.06,
          z: worldPos.current.z,
        },
        handForward: { x: forward.x, y: forward.y, z: forward.z },
      });

      scheduleFlight(vel, speedKmh);
    },

    applySixHit: () => {
      bodyRef.current?.applyImpulse(computeSixImpulse(), true);
      bodyRef.current?.applyTorqueImpulse({ x: 5, y: 8, z: 2 }, true);
    },

    waitUntilNearBatter: (timeoutMs = 5000) =>
      new Promise((resolve) => {
        waitResolveRef.current = resolve;
        setTimeout(() => {
          if (waitResolveRef.current) {
            waitResolveRef.current();
            waitResolveRef.current = null;
          }
        }, timeoutMs);
      }),

    waitFlight: (durationMs) => new Promise((r) => setTimeout(r, durationMs)),

    reset: () => {
      clearFlightDelay();
      handRef.current = null;
      modeRef.current = 'hidden';
      setBallVisible(false);
      waitResolveRef.current = null;
      const body = bodyRef.current;
      if (body) {
        body.setBodyType(2, true);
        body.setTranslation({ x: 0, y: -10, z: 0 }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    },
  }));

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders="ball"
      restitution={0.48}
      friction={0.35}
      linearDamping={0.015}
      angularDamping={0.04}
      mass={0.163}
      ccd
      position={[0, -10, 0]}
    >
      <mesh castShadow visible={ballVisible}>
        <sphereGeometry args={[BALL_RADIUS * 1.15, 24, 24]} />
        <meshStandardMaterial color="#cc2200" roughness={0.35} metalness={0.15} />
      </mesh>
    </RigidBody>
  );
});
