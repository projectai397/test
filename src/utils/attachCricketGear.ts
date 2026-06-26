import * as THREE from 'three';
import type { PlayerRole } from './playerModels';
import type { PlayerBones } from './cricketProcedural';

interface GearBones extends PlayerBones {
  head: THREE.Object3D | null;
  handL: THREE.Object3D | null;
  handR: THREE.Object3D | null;
}

function mat(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
}

function hideHair(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    if (mats.some((m) => /hair/i.test(m.name ?? ''))) obj.visible = false;
  });
}

/** Classic wide-brim cricket umpire hat (round crown + flat circular brim). */
function attachWideBrimHat(head: THREE.Object3D, color: string) {
  const hatMat = mat(color);
  const g = new THREE.Group();
  g.name = 'UmpireWideBrimHat';
  g.position.set(0, 0.11, 0);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.065, 16), hatMat);
  crown.position.y = 0.02;
  crown.castShadow = true;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.014, 24), hatMat);
  brim.position.y = -0.01;
  brim.castShadow = true;
  g.add(crown, brim);
  head.add(g);
}

interface GearOptions {
  minimalGear?: boolean;
  teamColor?: string;
  showCap?: boolean;
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
  const padMat = mat('#f0ebe0');
  const gloveMat = mat('#ffffff');
  const helmetMat = mat('#1e3a8a');
  const capMat = mat(options?.teamColor ?? teamColor);

  const showHelmet = !minimal && (role === 'batter' || role === 'keeper');
  const showPads = !minimal && (role === 'batter' || role === 'non_striker');
  const showCap = options?.showCap ?? (!minimal && role === 'bowler');
  const showGloves = role === 'keeper' || role === 'batter' || role === 'bowler';

  if (showCap) hideHair(root);

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
    attachWideBrimHat(bones.head, '#ffffff');
  } else if (bones.head && showCap) {
    const g = new THREE.Group();
    g.name = 'CricketCap';
    g.position.set(0, 0.12, 0);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), capMat);
    dome.castShadow = true;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.1), capMat);
    brim.position.set(0, 0, 0.08);
    brim.rotation.x = 0.35;
    g.add(dome, brim);
    bones.head.add(g);
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
