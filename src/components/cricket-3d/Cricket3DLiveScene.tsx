import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
import { UmpireController, type UmpireControllerHandle } from './UmpireController';
import { OptionalModelCharacter } from './OptionalModelCharacter';
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
import { MODEL_PATHS } from '../../utils/playerModels';
import { isGlbAvailable } from '../../utils/modelAvailability';
import { auditExpectedModels, getModelInstallMessage, logModelAudit } from '../../utils/modelAudit';
import type { CricketBallEvent } from '../../types/cricket-ball-event';
import type { CameraViewPreset } from '../../utils/cameraPresets';

export interface Cricket3DLiveSceneProps {
  wsUrl?: string;
  fallbackEvent?: CricketBallEvent;
  autoPlayDemo?: boolean;
  className?: string;
  defaultCameraAngle?: CameraViewPreset;
  /** GLB URL override — defaults to role-specific cricket models in public/models/ */
  playerModelUrl?: string;
  /** Umpire GLB override — defaults to /models/cricket-umpire.glb */
  umpireModelUrl?: string;
  /** Wicket keeper GLB override — defaults to /models/cricket-keeper.glb */
  keeperModelUrl?: string;
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
  umpireRef,
  ballRef,
  stumpsRef,
  playerModelUrl,
  umpireModelUrl,
  keeperModelUrl,
}: {
  bowlerRef: React.RefObject<BowlerControllerHandle>;
  batterRef: React.RefObject<BatterControllerHandle>;
  keeperRef: React.RefObject<KeeperControllerHandle>;
  nonStrikerRef: React.RefObject<NonStrikerControllerHandle>;
  umpireRef: React.RefObject<UmpireControllerHandle>;
  ballRef: React.RefObject<BallControllerHandle>;
  stumpsRef: React.RefObject<StumpsHandle>;
  playerModelUrl?: string;
  umpireModelUrl?: string;
  keeperModelUrl?: string;
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
      <KeeperController ref={keeperRef} modelUrl={keeperModelUrl} />
      <NonStrikerController ref={nonStrikerRef} modelUrl={playerModelUrl} />
      <OptionalModelCharacter
        modelUrl={umpireModelUrl ?? MODEL_PATHS.cricketUmpire}
        label="umpire"
      >
        <UmpireController ref={umpireRef} modelUrl={umpireModelUrl} />
      </OptionalModelCharacter>

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
  defaultCameraAngle = 'free',
  playerModelUrl,
  umpireModelUrl,
  keeperModelUrl,
}: Cricket3DLiveSceneProps) {
  const bowlerRef = useRef<BowlerControllerHandle>(null);
  const batterRef = useRef<BatterControllerHandle>(null);
  const keeperRef = useRef<KeeperControllerHandle>(null);
  const nonStrikerRef = useRef<NonStrikerControllerHandle>(null);
  const umpireRef = useRef<UmpireControllerHandle>(null);
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

  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    setCameraViewPreset(defaultCameraAngle);
    useGLTF.preload('/models/cricket-player.glb');
    useGLTF.preload('/models/cricket-batsman.glb');
    useGLTF.preload('/models/cricket-keeper.glb');

    const umpireUrl = umpireModelUrl ?? MODEL_PATHS.cricketUmpire;
    if (umpireUrl !== MODEL_PATHS.cricketPlayer) {
      isGlbAvailable(umpireUrl).then((ok) => {
        if (ok) useGLTF.preload(umpireUrl);
      });
    }

    auditExpectedModels().then((entries) => {
      logModelAudit(entries);
      setModelError(getModelInstallMessage(entries));
    });
  }, [defaultCameraAngle, setCameraViewPreset, umpireModelUrl]);

  useCricketWebSocket({ wsUrl, autoPlayDemo });

  const handleReplay = useCallback(() => {
    if (!lastCompletedEvent) return;
    startReplay();
  }, [lastCompletedEvent, startReplay]);

  return (
    <div className={`cricket-3d-scene ${className}`}>
      {modelError && (
        <div className="model-install-banner" role="alert">
          {modelError}
        </div>
      )}
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
            umpireRef={umpireRef}
            ballRef={ballRef}
            stumpsRef={stumpsRef}
            playerModelUrl={playerModelUrl}
            umpireModelUrl={umpireModelUrl}
            keeperModelUrl={keeperModelUrl}
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
