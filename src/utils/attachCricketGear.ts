import * as THREE from 'three';
import type { PlayerRole } from './playerModels';
import type { PlayerBones } from './cricketProcedural';
interface GearBones extends PlayerBones {
  head: THREE.Object3D | null;
  handL: THREE.Object3D | null;
  handR: THREE.Object3D | null;
}

function mat(color: string, depthBias = false) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.0,
    ...(depthBias
      ? { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }
      : {}),
  });
}

function hideHair(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    if (mats.some((m) => /hair/i.test(m.name ?? ''))) obj.visible = false;
  });
}

function hideUmpireScalp(root: THREE.Object3D) {
  hideHair(root);
}

function removeNamedFromTree(root: THREE.Object3D, name: string) {
  const toRemove: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (obj.name === name) toRemove.push(obj);
  });
  toRemove.forEach((obj) => obj.removeFromParent());
}

/** HeadAnchor is placed on the skull in GlbPlayerModel — reliable wear point for hats. */
function getHeadWearAnchor(head: THREE.Object3D): THREE.Object3D {
  const headAnchor = head.children.find((c) => c.name === 'HeadAnchor');
  return headAnchor ?? head;
}

/**
 * ICC-style wide-brim cricket sun hat — lathe profile with y=0 at the crown base
 * (same wear point as the bowler cap HeadAnchor on the skull).
 */
function attachWideBrimHat(head: THREE.Object3D, color: string) {
  removeNamedFromTree(head, 'UmpireWideBrimHat');

  const anchor = getHeadWearAnchor(head);
  const hatMat = mat(color, true);
  const bandMat = mat('#141414');

  const g = new THREE.Group();
  g.name = 'UmpireWideBrimHat';
  g.position.set(0, 0.075, 0.005);
  g.rotation.x = 0.025;

  const profile = [
    new THREE.Vector2(0.158, -0.012),
    new THREE.Vector2(0.158, -0.008),
    new THREE.Vector2(0.148, -0.004),
    new THREE.Vector2(0.098, -0.001),
    new THREE.Vector2(0.093, 0.0),
    new THREE.Vector2(0.091, 0.016),
    new THREE.Vector2(0.084, 0.034),
    new THREE.Vector2(0.074, 0.05),
    new THREE.Vector2(0.056, 0.064),
    new THREE.Vector2(0.034, 0.072),
    new THREE.Vector2(0.0, 0.076),
  ];

  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 56), hatMat);
  body.castShadow = true;
  body.receiveShadow = true;
  body.renderOrder = 3;

  const band = new THREE.Mesh(new THREE.TorusGeometry(0.093, 0.008, 12, 40), bandMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = -0.002;
  band.castShadow = true;

  g.add(body, band);
  anchor.add(g);
}

interface GearOptions {
  minimalGear?: boolean;
  teamColor?: string;
  showCap?: boolean;
  /** Meshy GLB — kit is baked in texture; cap/gloves only. */
  meshyCharacter?: boolean;
}

/** Attach helmet, pads, gloves to skeleton bones so they move with animations. */
export function attachCricketGear(
  root: THREE.Object3D,
  role: PlayerRole,
  bones: GearBones,
  teamColor = '#f5f5f0',
  options?: GearOptions,
) {
  const existing = root.getObjectByName('CricketGearRoot');
  if (existing) existing.removeFromParent();

  const gearRoot = new THREE.Group();
  gearRoot.name = 'CricketGearRoot';

  const minimal = options?.minimalGear ?? false;
  const kitColor = options?.teamColor ?? teamColor;
  const padMat = mat('#f0ebe0');
  const gloveMat = mat('#ffffff');
  const helmetMat = mat(kitColor);
  const capMat = mat(kitColor);
  const showHelmet = !minimal && (role === 'batter' || role === 'keeper');
  const showPads = !minimal && (role === 'batter' || role === 'non_striker');
  const showCap = options?.showCap ?? (!minimal && role === 'bowler');
  const showGloves = role === 'keeper' || role === 'batter' || role === 'bowler';
  const meshy = options?.meshyCharacter ?? false;

  if (showCap && !meshy) {
    if (role === 'umpire') hideUmpireScalp(root);
    else hideHair(root);
  }

  if (bones.head && showHelmet) {
    const g = new THREE.Group();
    g.position.set(0, 0.1, 0.04);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), helmetMat);
    dome.castShadow = true;
    const grill = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.08), helmetMat);
    grill.position.set(0, -0.02, 0.08);
    g.add(dome, grill);
    bones.head.add(g);
  }

  if (bones.head && showCap && role === 'umpire') {
    attachWideBrimHat(bones.head, '#f5f5f5');
  } else if (bones.head && showCap) {
    removeNamedFromTree(bones.head, 'CricketCap');
    const g = new THREE.Group();
    g.name = 'CricketCap';
    g.position.set(0, 0.12, 0);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), capMat);
    dome.castShadow = true;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.1), capMat);
    brim.position.set(0, 0, 0.08);
    brim.rotation.x = 0.35;
    g.add(dome, brim);
    getHeadWearAnchor(bones.head).add(g);
  }

  const addPad = (bone: THREE.Object3D | null, side: number) => {
    if (!bone) return;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.06), padMat);
    pad.position.set(side * 0.04, -0.18, 0.04);
    pad.castShadow = true;
    bone.add(pad);
  };

  if (showPads) {
    addPad(bones.legL, -1);
    addPad(bones.legR, 1);
  }

  const addGlove = (bone: THREE.Object3D | null) => {
    if (!bone || !showGloves) return;
    const glove = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.04), gloveMat);
    glove.position.set(0, -0.06, 0.02);
    glove.castShadow = true;
    bone.add(glove);
  };

  addGlove(bones.handL);
  addGlove(bones.handR);

  root.add(gearRoot);
}
