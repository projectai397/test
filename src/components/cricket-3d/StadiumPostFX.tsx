import { EffectComposer, Bloom } from '@react-three/postprocessing';

export function StadiumPostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={0.42}
        luminanceSmoothing={0.28}
        intensity={1.05}
        mipmapBlur
      />
    </EffectComposer>
  );
}
