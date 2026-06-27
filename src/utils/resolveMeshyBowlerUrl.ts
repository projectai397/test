import kitManifest from '../../public/models/meshy-kit-manifest.json';
import { resolveKitColor, resolveTrouserColor } from './kitColors';
import type { TeamAConfig } from '../types/match-config';
import type { MeshyKitManifest } from '../types/meshy-kit-manifest';

const manifest = kitManifest as MeshyKitManifest;

function kitHash(shirtHex: string, trouserHex: string): string {
  return `${shirtHex.replace('#', '').toLowerCase()}-${trouserHex.replace('#', '').toLowerCase()}`;
}

/** Resolve kit-baked Meshy bowler GLB from config colours + generated manifest. */
export function resolveMeshyBowlerUrl(teamA: TeamAConfig): string {
  const shirt = resolveKitColor(teamA.kitColor, teamA.bowler.kitColor);
  const trousers = resolveTrouserColor(teamA.kitColor, teamA.trouserColor, teamA.bowler.kitColor);
  const hash = kitHash(shirt, trousers);

  const variant = manifest.variants?.find((v) => v.kitHash === hash);
  if (variant?.modelUrl) return variant.modelUrl;

  return manifest.defaultBowlerUrl ?? '/models/meshy-bowler.glb';
}

export { kitHash as meshyBowlerKitHash };
