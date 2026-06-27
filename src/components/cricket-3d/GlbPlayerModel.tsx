import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import {
  CLIPS,
  applyCricketKitLook,
  applyUmpireKitLook,
  getPlayerModelConfig,
  getClipDuration,
  isCricketProfile,
  isMeshyBowlerUrl,
  isMixamoProfile,
  isStaticProfile,
  hasResolvedClip,
  prepareMeshyCharacterMaterials,
  applyMeshyProportions,
  applyMeshyNeutralStance,
  resolveClipName,
  resolveFirstClip,
  type ClipKey,
  type PlayerModelConfig,
  type PlayerRole,
  type ModelProfile,
} from '../../utils/playerModels';
import { cloneAndNormalizeModel } from '../../utils/normalizeModel';
import { attachCricketGear } from '../../utils/attachCricketGear';
import { resolvePlayerBones } from '../../utils/resolvePlayerBones';
import type { PlayerBones } from '../../utils/cricketProcedural';
import { captureBoneRestPose, captureSkeletonRestPose, restoreBoneRestPose, type BoneRestMap } from '../../utils/boneRestPose';

export interface GlbPlayerModelHandle {
  isReady: () => boolean;
  getHandRef: () => THREE.Object3D | null;
  getHeadRef: () => THREE.Object3D | null;
  getRootRef: () => THREE.Object3D | null;
  getBatRef: () => THREE.Object3D | null;
  getParts: () => PlayerBones;
  getBoneRestPose: () => BoneRestMap;
  getModelProfile: () => ModelProfile;
  hasClip: (key: ClipKey) => boolean;
  getClipDuration: (key: ClipKey) => number | null;
  playClip: (clipName: string, loop?: boolean, fade?: number, timeScale?: number) => void;
  playClipOnce: (
    key: ClipKey,
    options?: {
      fade?: number;
      timeScale?: number;
      onRelease?: () => void;
      releaseFraction?: number;
    },
  ) => Promise<number>;
  stopClips: () => void;
  beginProcedural: () => BoneRestMap;
  endProcedural: () => void;
  resetPose: () => void;
  setDeliveryRotationOffset: (offsetY: number) => void;
}

interface GlbPlayerModelProps {
  role: PlayerRole;
  label?: string;
  showBat?: boolean;
  modelUrl?: string;
  config?: PlayerModelConfig;
}

export const GlbPlayerModel = forwardRef<GlbPlayerModelHandle, GlbPlayerModelProps>(
  function GlbPlayerModel({ role, label, showBat = false, modelUrl, config: configOverride }, ref) {
    const config = configOverride ?? getPlayerModelConfig(role, modelUrl);
    const groupRef = useRef<THREE.Group>(null);
    const handAnchorRef = useRef<THREE.Group>(null!);
    const headAnchorRef = useRef<THREE.Group>(null!);
    const batObjectRef = useRef<THREE.Group | null>(null);
    const bonesRef = useRef<PlayerBones & { head: THREE.Bone | null; handL: THREE.Bone | null; handR: THREE.Bone | null }>({
      hips: null,
      torso: null,
      legL: null,
      legR: null,
      lowerLegL: null,
      lowerLegR: null,
      armL: null,
      armR: null,
      foreArmL: null,
      foreArmR: null,
      head: null,
      handL: null,
      handR: null,
    });
    const proceduralActive = useRef(false);
    const skinnedMeshesRef = useRef<THREE.SkinnedMesh[]>([]);
    const readyRef = useRef(false);
    /** Bind-pose reference — never overwritten; procedural deltas are relative to this. */
    const bindRestRef = useRef<BoneRestMap>(new Map());
    const restPoseRef = useRef<BoneRestMap>(new Map());
    const deliveryRotationOffsetRef = useRef(0);

    const applyModelRotation = () => {
      if (!groupRef.current) return;
      groupRef.current.rotation.y = config.rotationY + deliveryRotationOffsetRef.current;
    };

    if (!handAnchorRef.current) handAnchorRef.current = new THREE.Group();
    if (!headAnchorRef.current) headAnchorRef.current = new THREE.Group();

    const gltf = useGLTF(config.url);
    const scene = useMemo(() => cloneAndNormalizeModel(gltf.scene), [gltf.scene]);
    const { actions, mixer } = useAnimations(gltf.animations, scene);
    const actionsRef = useRef(actions);
    actionsRef.current = actions;
    const currentAction = useRef<THREE.AnimationAction | null>(null);

    const getParts = (): PlayerBones => ({
      hips: bonesRef.current.hips,
      torso: bonesRef.current.torso,
      legL: bonesRef.current.legL,
      legR: bonesRef.current.legR,
      lowerLegL: bonesRef.current.lowerLegL,
      lowerLegR: bonesRef.current.lowerLegR,
      armL: bonesRef.current.armL,
      armR: bonesRef.current.armR,
      foreArmL: bonesRef.current.foreArmL,
      foreArmR: bonesRef.current.foreArmR,
    });

    const playIdle = () => {
      if (proceduralActive.current) return;

      if (isMeshyBowlerUrl(config.url)) {
        if (mixer) mixer.stopAllAction();
        currentAction.current = null;
        restoreBoneRestPose(bindRestRef.current);
        return;
      }

      let idleName: string | null;
      if (isCricketProfile(config)) {
        idleName = resolveFirstClip(actionsRef.current);
      } else if (isMixamoProfile(config)) {
        idleName = resolveClipName(actionsRef.current, 'walk');
      } else {
        idleName = resolveClipName(actionsRef.current, 'idle');
      }
      if (!idleName || !actionsRef.current[idleName]) return;
      const idle = actionsRef.current[idleName]!;
      idle.reset();
      idle.setLoop(THREE.LoopRepeat, Infinity);
      idle.setEffectiveTimeScale(isMixamoProfile(config) ? 0.02 : 1);
      idle.setEffectiveWeight(1);
      idle.fadeIn(0.15).play();
      currentAction.current = idle;
    };

    useEffect(() => {
      readyRef.current = false;

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
              mat.map.colorSpace = THREE.SRGBColorSpace;
              mat.needsUpdate = true;
            }
          }
        }
      });

      if (isStaticProfile(config)) {
        bindRestRef.current = new Map();
        restPoseRef.current = new Map();
        readyRef.current = true;
        console.debug(`[GlbPlayerModel] ready (${role}) static mesh`);
        return;
      }

      if (!config.skipKitRecolor) {
        if (role === 'umpire') applyUmpireKitLook(scene);
        else if (config.color) applyCricketKitLook(scene, config.color);
      } else if (isMeshyBowlerUrl(config.url)) {
        prepareMeshyCharacterMaterials(scene);
        applyMeshyProportions(scene);
        applyMeshyNeutralStance(scene);
      }

      const resolved = resolvePlayerBones(scene, config.profile);
      const b = bonesRef.current;
      Object.assign(b, resolved);

      if (b.handR && !b.handR.children.some((c) => c.name === 'HandAnchor')) {
        handAnchorRef.current.name = 'HandAnchor';
        b.handR.add(handAnchorRef.current);
        if (role === 'bowler') {
          handAnchorRef.current.position.set(0, -0.02, 0.04);
        } else {
          handAnchorRef.current.position.set(0, 0, 0);
        }
      }

      if (b.head && !b.head.children.some((c) => c.name === 'HeadAnchor')) {
        headAnchorRef.current.name = 'HeadAnchor';
        b.head.add(headAnchorRef.current);
        headAnchorRef.current.position.set(0, 0.08, 0);
      }

      if (!isStaticProfile(config)) {
        attachCricketGear(scene, role, b, config.color, {
          minimalGear: config.minimalGear,
          teamColor: config.color,
          showCap: config.showCap,
          meshyCharacter: isMeshyBowlerUrl(config.url),
        });
      }

      skinnedMeshesRef.current = [];
      scene.traverse((obj) => {
        if (obj instanceof THREE.SkinnedMesh) skinnedMeshesRef.current.push(obj);
      });

      if (showBat && handAnchorRef.current && !batObjectRef.current) {
        const bat = new THREE.Group();
        bat.name = 'BatAttach';
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.72, 0.025),
          new THREE.MeshStandardMaterial({ color: '#c4a35a', roughness: 0.45 }),
        );
        blade.position.set(0, 0.36, 0.06);
        blade.castShadow = true;
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.2, 8),
          new THREE.MeshStandardMaterial({ color: '#1a1a1a' }),
        );
        handle.position.set(0, -0.02, 0);
        bat.add(blade, handle);
        bat.rotation.set(0.25, 0, -0.35);
        handAnchorRef.current.add(bat);
        batObjectRef.current = bat;
      }

      bindRestRef.current = isMeshyBowlerUrl(config.url)
        ? captureSkeletonRestPose(scene)
        : captureBoneRestPose(getParts());
      restPoseRef.current = bindRestRef.current;
      playIdle();
      readyRef.current = !!b.torso && !!b.armR;
      if (readyRef.current) {
        console.debug(`[GlbPlayerModel] ready (${role})`, { torso: b.torso?.name, armR: b.armR?.name });
      } else {
        console.warn(`[GlbPlayerModel] bones missing (${role})`, {
          torso: b.torso?.name ?? null,
          armR: b.armR?.name ?? null,
        });
      }
    }, [scene, config.color, config.trouserColor, config.url, config.profile, config.skipKitRecolor, config.minimalGear, config.showCap, role, showBat]);

    useFrame((_, delta) => {
      if (proceduralActive.current) {
        for (const mesh of skinnedMeshesRef.current) {
          mesh.skeleton.bones.forEach((bone) => bone.updateMatrixWorld(true));
        }
      } else if (mixer) {
        mixer.update(delta);
      }
    });

    useImperativeHandle(ref, () => ({
      isReady: () =>
        isStaticProfile(config) ? readyRef.current : readyRef.current && !!bonesRef.current.torso,
      getHandRef: () => handAnchorRef.current,
      getHeadRef: () => headAnchorRef.current,
      getRootRef: () => groupRef.current,
      getBatRef: () => batObjectRef.current,
      getParts,
      getBoneRestPose: () => bindRestRef.current,
      getModelProfile: () => config.profile,
      hasClip: (key: ClipKey) => hasResolvedClip(actionsRef.current, key),
      getClipDuration: (key: ClipKey) => getClipDuration(actionsRef.current, key),
      playClip: (clipName, loop = true, fade = 0.25, timeScale?: number) => {
        if (proceduralActive.current) return;
        const key = (Object.keys(CLIPS) as Array<keyof typeof CLIPS>).find(
          (k) => CLIPS[k].toLowerCase() === clipName.toLowerCase() || k === clipName,
        );
        let resolved = key ? resolveClipName(actionsRef.current, key) : clipName;
        if (!resolved && isCricketProfile(config) && key === 'idle') {
          resolved = resolveFirstClip(actionsRef.current);
        }
        const next = resolved ? actionsRef.current[resolved] : undefined;
        if (!next) return;
        next.reset();
        next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
        next.clampWhenFinished = !loop;
        const defaultSpeed = key === 'run' ? 1 : key === 'walk' ? 1 : 1;
        next.setEffectiveTimeScale(timeScale ?? defaultSpeed);
        if (currentAction.current && currentAction.current !== next) {
          currentAction.current.fadeOut(fade);
        }
        next.fadeIn(fade).play();
        currentAction.current = next;
      },
      playClipOnce: (key, options = {}) => {
        const { fade = 0.2, timeScale = 1, onRelease, releaseFraction = 0.38 } = options;
        return new Promise((resolve) => {
          if (!mixer) {
            resolve(0);
            return;
          }
          proceduralActive.current = false;
          const resolved = resolveClipName(actionsRef.current, key);
          const next = resolved ? actionsRef.current[resolved] : undefined;
          if (!next) {
            console.warn(`[GlbPlayerModel] clip not found: ${key}`);
            resolve(0);
            return;
          }
          const clipDuration = next.getClip().duration / timeScale;
          mixer.stopAllAction();
          next.reset();
          next.setLoop(THREE.LoopOnce, 1);
          next.clampWhenFinished = true;
          next.setEffectiveTimeScale(timeScale);
          next.setEffectiveWeight(1);
          next.fadeIn(fade).play();
          currentAction.current = next;

          if (onRelease) {
            gsap.delayedCall(clipDuration * releaseFraction, onRelease);
          }

          let settled = false;
          const finish = (duration: number) => {
            if (settled) return;
            settled = true;
            mixer!.removeEventListener('finished', onFinished as never);
            resolve(duration);
          };

          const onFinished = (event: { action: THREE.AnimationAction }) => {
            if (event.action !== next) return;
            finish(clipDuration);
          };
          mixer.addEventListener('finished', onFinished as never);

          gsap.delayedCall(clipDuration + 0.2, () => finish(clipDuration));
        });
      },
      stopClips: () => {
        mixer?.stopAllAction();
        currentAction.current = null;
      },
      beginProcedural: () => {
        if (isStaticProfile(config)) return bindRestRef.current;
        proceduralActive.current = true;
        mixer?.stopAllAction();
        currentAction.current = null;
        return bindRestRef.current;
      },
      endProcedural: () => {
        proceduralActive.current = false;
        playIdle();
      },
      resetPose: () => {
        proceduralActive.current = false;
        deliveryRotationOffsetRef.current = 0;
        applyModelRotation();
        restoreBoneRestPose(bindRestRef.current);
        if (batObjectRef.current) batObjectRef.current.rotation.set(0.25, 0, -0.35);
        playIdle();
      },
      setDeliveryRotationOffset: (offsetY: number) => {
        deliveryRotationOffsetRef.current = offsetY;
        applyModelRotation();
      },
    }));

    return (
      <group ref={groupRef} scale={config.scale} rotation={[0, config.rotationY, 0]} position={[0, config.yOffset, 0]}>
        <primitive object={scene} />
        {label && (
          <Html center distanceFactor={12} position={[0, 2.05, 0]} style={{ pointerEvents: 'none' }}>
            <div className="player-label">{label}</div>
          </Html>
        )}
      </group>
    );
  },
);

useGLTF.preload('/models/cricket-player.glb');
useGLTF.preload('/models/cricket-batsman.glb');
useGLTF.preload('/models/cricket-keeper.glb');
useGLTF.preload('/models/meshy-bowler.glb');
useGLTF.preload('/models/meshy-bowler-dc2626-1a1a1a.glb');
