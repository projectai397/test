import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { FielderController, type FielderControllerHandle } from './FielderController';
import { UmpireController, type UmpireControllerHandle } from './UmpireController';
import { BallController, type BallControllerHandle } from './BallController';
import { CameraController } from './CameraController';
import { AnimationOrchestrator } from './AnimationOrchestrator';
import { PhysicsEnvironment } from './PhysicsEnvironment';
import { LiveOverlay } from './LiveOverlay';
import { MotionRafSync } from './MotionRafSync';
import { useCricketAnimationState } from '../../hooks/useCricketAnimationState';
import { useCricketWebSocket } from '../../hooks/useCricketWebSocket';
import { buildDefaultBallEvent } from '../../utils/defaultBallEvent';
import { scenePositions, cameraDefaults } from '../../utils/animationTimings';
import { MODEL_PATHS } from '../../utils/playerModels';
import { resolveFieldPosition } from '../../utils/fieldPositions';
import { resolveKitColor, resolveTrouserColor } from '../../utils/kitColors';
import { auditExpectedModels, getModelInstallMessage, logModelAudit } from '../../utils/modelAudit';
import { loadMatchConfig } from '../../config/loadMatchConfig';
import type { CricketBallEvent } from '../../types/cricket-ball-event';
import type { MatchConfig } from '../../types/match-config';
import type { CameraViewPreset } from '../../utils/cameraPresets';

export interface Cricket3DLiveSceneProps {
  wsUrl?: string;
  fallbackEvent?: CricketBallEvent;
  autoPlayDemo?: boolean;
  className?: string;
  defaultCameraAngle?: CameraViewPreset;
  matchConfig?: MatchConfig;
  /** GLB URL override — defaults to cricket-player.glb for all roles */
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
  matchConfig,
  bowlerRef,
  batterRef,
  keeperRef,
  nonStrikerRef,
  fieldersRef,
  umpireRef,
  ballRef,
  stumpsRef,
  playerModelUrl,
}: {
  matchConfig: MatchConfig;
  bowlerRef: React.RefObject<BowlerControllerHandle>;
  batterRef: React.RefObject<BatterControllerHandle>;
  keeperRef: React.RefObject<KeeperControllerHandle>;
  nonStrikerRef: React.RefObject<NonStrikerControllerHandle>;
  fieldersRef: React.RefObject<(FielderControllerHandle | null)[]>;
  umpireRef: React.RefObject<UmpireControllerHandle>;
  ballRef: React.RefObject<BallControllerHandle>;
  stumpsRef: React.RefObject<StumpsHandle>;
  playerModelUrl?: string;
}) {
  const modelUrl = playerModelUrl ?? MODEL_PATHS.cricketPlayer;
  const teamA = matchConfig.teams.teamA;
  const teamB = matchConfig.teams.teamB;
  const umpire = matchConfig.umpire;

  const bowlerKit = resolveKitColor(teamA.kitColor, teamA.bowler.kitColor);
  const bowlerTrousers = resolveTrouserColor(teamA.kitColor, teamA.trouserColor, teamA.bowler.kitColor);
  const batterKit = resolveKitColor(teamB.kitColor, teamB.batsman.kitColor);
  const batterTrousers = resolveTrouserColor(teamB.kitColor, teamB.trouserColor, teamB.batsman.kitColor);
  const nonStrikerKit = resolveKitColor(teamB.kitColor, teamB.nonStriker.kitColor);
  const nonStrikerTrousers = resolveTrouserColor(teamB.kitColor, teamB.trouserColor, teamB.nonStriker.kitColor);
  const teamATrousers = resolveTrouserColor(teamA.kitColor, teamA.trouserColor);

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

      <BowlerController
        ref={bowlerRef}
        name={teamA.bowler.name}
        jerseyColor={bowlerKit}
        trouserColor={bowlerTrousers}
        showCap={teamA.bowler.showCap}
        modelUrl={teamA.bowler.modelUrl ?? modelUrl}
      />
      <BatterController
        ref={batterRef}
        name={teamB.batsman.name}
        jerseyColor={batterKit}
        trouserColor={batterTrousers}
        modelUrl={modelUrl}
      />
      <KeeperController
        ref={keeperRef}
        name={teamA.keeper.name}
        jerseyColor={teamA.kitColor}
        trouserColor={teamATrousers}
        modelUrl={modelUrl}
      />
      <NonStrikerController
        ref={nonStrikerRef}
        name={teamB.nonStriker.name}
        jerseyColor={nonStrikerKit}
        trouserColor={nonStrikerTrousers}
        modelUrl={modelUrl}
      />

      {teamA.fielders.map((fielder, index) => {
        const pos = resolveFieldPosition(fielder);
        return (
          <FielderController
            key={`fielder-${fielder.position}-${index}`}
            ref={(el) => {
              if (fieldersRef.current) fieldersRef.current[index] = el;
            }}
            name={fielder.name}
            jerseyColor={teamA.kitColor}
            trouserColor={teamATrousers}
            x={pos.x}
            z={pos.z}
            facingY={pos.facingY}
            modelUrl={modelUrl}
          />
        );
      })}

      <UmpireController
        ref={umpireRef}
        name={umpire.name}
        jerseyColor={umpire.kitColor}
        showCap={umpire.showCap}
        modelUrl={modelUrl}
      />

      <Physics gravity={[0, -9.81, 0]} timeStep="vary" interpolate={true}>
        <PhysicsEnvironment />
        <BallController ref={ballRef} />
      </Physics>

      <AnimationOrchestrator
        bowlerRef={bowlerRef}
        batterRef={batterRef}
        keeperRef={keeperRef}
        nonStrikerRef={nonStrikerRef}
        fieldersRef={fieldersRef}
        umpireRef={umpireRef}
        ballRef={ballRef}
        stumpsRef={stumpsRef}
      />
    </>
  );
}

export function Cricket3DLiveScene({
  wsUrl,
  fallbackEvent,
  autoPlayDemo = true,
  className = '',
  defaultCameraAngle = 'free',
  matchConfig: matchConfigProp,
  playerModelUrl,
}: Cricket3DLiveSceneProps) {
  const matchConfig = useMemo(
    () => matchConfigProp ?? loadMatchConfig(),
    [matchConfigProp],
  );
  const resolvedFallback = useMemo(
    () => fallbackEvent ?? buildDefaultBallEvent(matchConfig),
    [fallbackEvent, matchConfig],
  );

  const bowlerRef = useRef<BowlerControllerHandle>(null);
  const batterRef = useRef<BatterControllerHandle>(null);
  const keeperRef = useRef<KeeperControllerHandle>(null);
  const nonStrikerRef = useRef<NonStrikerControllerHandle>(null);
  const fieldersRef = useRef<(FielderControllerHandle | null)[]>(
    new Array(matchConfig.teams.teamA.fielders.length).fill(null),
  );
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
    useGLTF.preload(playerModelUrl ?? MODEL_PATHS.cricketPlayer);

    auditExpectedModels().then((entries) => {
      logModelAudit(entries);
      setModelError(getModelInstallMessage(entries));
    });
  }, [defaultCameraAngle, setCameraViewPreset, playerModelUrl]);

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
            matchConfig={matchConfig}
            bowlerRef={bowlerRef}
            batterRef={batterRef}
            keeperRef={keeperRef}
            nonStrikerRef={nonStrikerRef}
            fieldersRef={fieldersRef}
            umpireRef={umpireRef}
            ballRef={ballRef}
            stumpsRef={stumpsRef}
            playerModelUrl={playerModelUrl}
          />
        </Suspense>
      </Canvas>

      <LiveOverlay
        connectionStatus={connectionStatus}
        currentEvent={currentBallEvent ?? resolvedFallback}
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
