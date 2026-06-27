export interface MeshyKitVariant {
  kitHash: string;
  shirt: string;
  trousers: string;
  modelUrl: string;
  generatedAt: string;
}

export interface MeshyKitManifest {
  variants: MeshyKitVariant[];
  defaultBowlerUrl?: string;
}
