import { Suspense, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useGLTF, Html } from '@react-three/drei';
import { CricketGround } from './CricketGround';
import { CricketPitch } from './CricketPitch';
import { Stumps, type StumpsHandle } from './Stumps';
import { StadiumEnvironment } from './StadiumEnvironment';
import { BowlerController, type BowlerControllerHandle } from './BowlerController';
import { BatterController, type BatterControllerHandle } from './BatterController';
import { KeeperController, type KeeperControllerHandle } from './KeeperController';
import { NonStrikerController, type NonStrikerControllerHandle } from './NonStrikerController';
import { BallController, type BallControllerHandle } from './BallController';
import { CameraController } from './CameraController';
import { AnimationOrchestrator } from './AnimationOrchestrator';
import { PhysicsEnvironment } from './PhysicsEnvironment';
import { LiveOverlay } from './LiveOverlay';
import { MotionRafSync } from './MotionRafSync';
import { useCricketAnimationState } from '../../hooks/useCricketAnimationState';
import { useCricketWebSocket } from '../../hooks/useCricketWebSocket';
import { defaultBallEvent } from '../../utils/defaultBallEvent';
import { scenePositions, cameraDefaults } from '../../utils/animationTimings';
import type { CricketBallEvent } from '../../types/cricket-ball-event';
import type { CameraViewPreset } from '../../utils/cameraPresets';

export interface Cricket3DLiveSceneProps {
  wsUrl?: string;
  fallbackEvent?: CricketBallEvent;
  autoPlayDemo?: boolean;
  className?: string;
  defaultCameraAngle?: CameraViewPreset;
  /** GLB URL for all players — use /models/cricket-player-custom.glb for cricket-specific model */
  playerModelUrl?: string;
}

function SceneLoader() {
  return (
    <Html center position={[10, 2, 0]}>
      <div className="scene-loader">Loading players…</div>
    </Html>
  );
}

/** Static scene — no Zustand subscription so delivery motion is not interrupted by re-renders. */
function CricketScene({
  bowlerRef,
  batterRef,
  keeperRef,
  nonStrikerRef,
  ballRef,
  stumpsRef,
  playerModelUrl,
}: {
  bowlerRef: React.RefObject<BowlerControllerHandle>;
  batterRef: React.RefObject<BatterControllerHandle>;
  keeperRef: React.RefObject<KeeperControllerHandle>;
  nonStrikerRef: React.RefObject<NonStrikerControllerHandle>;
  ballRef: React.RefObject<BallControllerHandle>;
  stumpsRef: React.RefObject<StumpsHandle>;
  playerModelUrl?: string;
}) {
  return (
    <>
      <color attach="background" args={['#87a8c4']} />
      <fog attach="fog" args={['#87a8c4', 60, 120]} />

      <ambientLight intensity={0.45} />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={['#b1e1ff', '#3d5c3a', 0.4]} />

      <MotionRafSync />
      <CameraController />

      <CricketGround />
      <CricketPitch />
      <StadiumEnvironment />

      <Stumps ref={stumpsRef} position={[scenePositions.strikerEndX, 0, 0]} />
      <Stumps position={[scenePositions.nonStrikerEndX, 0, 0]} />

      <BowlerController ref={bowlerRef} modelUrl={playerModelUrl} />
      <BatterController ref={batterRef} modelUrl={playerModelUrl} />
      <KeeperController ref={keeperRef} modelUrl={playerModelUrl} />
      <NonStrikerController ref={nonStrikerRef} modelUrl={playerModelUrl} />

      <Physics gravity={[0, -9.81, 0]} timeStep="vary" interpolate={true}>
        <PhysicsEnvironment />
        <BallController ref={ballRef} />
      </Physics>

      <AnimationOrchestrator
        bowlerRef={bowlerRef}
        batterRef={batterRef}
        keeperRef={keeperRef}
        nonStrikerRef={nonStrikerRef}
        ballRef={ballRef}
        stumpsRef={stumpsRef}
      />
    </>
  );
}

export function Cricket3DLiveScene({
  wsUrl,
  fallbackEvent = defaultBallEvent,
  autoPlayDemo = true,
  className = '',
  defaultCameraAngle = 'broadcast',
  playerModelUrl,
}: Cricket3DLiveSceneProps) {
  const bowlerRef = useRef<BowlerControllerHandle>(null);
  const batterRef = useRef<BatterControllerHandle>(null);
  const keeperRef = useRef<KeeperControllerHandle>(null);
  const nonStrikerRef = useRef<NonStrikerControllerHandle>(null);
  const ballRef = useRef<BallControllerHandle>(null);
  const stumpsRef = useRef<StumpsHandle>(null);

  const connectionStatus = useCricketAnimationState((s) => s.connectionStatus);
  const currentBallEvent = useCricketAnimationState((s) => s.currentBallEvent);
  const resultDisplay = useCricketAnimationState((s) => s.resultDisplay);
  const showWaitingText = useCricketAnimationState((s) => s.showWaitingText);
  const lastCompletedEvent = useCricketAnimationState((s) => s.lastCompletedEvent);
  const queuedCount = useCricketAnimationState((s) => s.queuedEvents.length);
  const animationState = useCricketAnimationState((s) => s.animationState);

  const setResultDisplay = useCricketAnimationState((s) => s.setResultDisplay);
  const startReplay = useCricketAnimationState((s) => s.startReplay);
  const setCameraViewPreset = useCricketAnimationState((s) => s.setCameraViewPreset);

  useEffect(() => {
    setCameraViewPreset(defaultCameraAngle);
    useGLTF.preload('/models/soldier.glb');
  }, [defaultCameraAngle, setCameraViewPreset]);

  useCricketWebSocket({ wsUrl, autoPlayDemo });

  const handleReplay = useCallback(() => {
    if (!lastCompletedEvent) return;
    startReplay();
  }, [lastCompletedEvent, startReplay]);

  return (
    <div className={`cricket-3d-scene ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [
            cameraDefaults.position.x,
            cameraDefaults.position.y,
            cameraDefaults.position.z,
          ],
          fov: cameraDefaults.fov,
          near: 0.1,
          far: 200,
        }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={<SceneLoader />}>
          <CricketScene
            bowlerRef={bowlerRef}
            batterRef={batterRef}
            keeperRef={keeperRef}
            nonStrikerRef={nonStrikerRef}
            ballRef={ballRef}
            stumpsRef={stumpsRef}
            playerModelUrl={playerModelUrl}
          />
        </Suspense>
      </Canvas>

      <LiveOverlay
        connectionStatus={connectionStatus}
        currentEvent={currentBallEvent ?? fallbackEvent}
        resultDisplay={resultDisplay}
        showWaitingText={showWaitingText}
        queuedCount={queuedCount}
        onReplay={handleReplay}
        canReplay={!!lastCompletedEvent && animationState !== 'bowler_runup'}
        onResultComplete={() => setResultDisplay(null)}
      />
    </div>
  );
}

export default Cricket3DLiveScene;
