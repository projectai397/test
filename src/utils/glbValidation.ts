export interface GlbMeta {
  meshNames: string[];
  animationCount: number;
  triangleCount: number;
  isCesiumPlaceholder: boolean;
  isValidCricketPlayer: boolean;
}

export function parseGlbMeta(buffer: ArrayBuffer): GlbMeta | null {
  try {
    const buf = new DataView(buffer);
    if (buffer.byteLength < 20) return null;
    if (buf.getUint32(0, true) !== 0x46546c67) return null;

    const jsonLen = buf.getUint32(12, true);
    const jsonBytes = new Uint8Array(buffer, 20, jsonLen);
    const json = JSON.parse(new TextDecoder().decode(jsonBytes)) as {
      meshes?: Array<{ name?: string; primitives?: Array<{ indices?: number }> }>;
      animations?: unknown[];
      accessors?: Array<{ count?: number }>;
      skins?: unknown[];
    };

    const meshNames = (json.meshes ?? []).map((m) => m.name ?? 'unnamed');
    const isCesiumPlaceholder = meshNames.some((n) => /cesium/i.test(n));

    let triangleCount = 0;
    for (const mesh of json.meshes ?? []) {
      for (const prim of mesh.primitives ?? []) {
        const acc = json.accessors?.[prim.indices ?? -1];
        if (acc?.count) triangleCount += acc.count / 3;
      }
    }

    const isValidCricketPlayer =
      !isCesiumPlaceholder && triangleCount > 8000 && (json.skins?.length ?? 0) > 0;

    return {
      meshNames,
      animationCount: json.animations?.length ?? 0,
      triangleCount: Math.round(triangleCount),
      isCesiumPlaceholder,
      isValidCricketPlayer,
    };
  } catch {
    return null;
  }
}

export async function fetchGlbMeta(url: string): Promise<GlbMeta | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return parseGlbMeta(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export function describeModelProblem(meta: GlbMeta | null): string | null {
  if (!meta) return 'Model file is missing or not a valid GLB.';
  if (meta.isCesiumPlaceholder) {
    return 'Wrong model installed: Cesium Man placeholder. Run: npm run install:models';
  }
  if (meta.triangleCount < 3000) {
    return `Model looks invalid (${meta.triangleCount} tris). Re-run: npm run install:models`;
  }
  return null;
}
