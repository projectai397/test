import { useMemo } from 'react';
import * as THREE from 'three';

export function CricketGround() {
  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2d6a30';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const g = 80 + Math.random() * 60;
      ctx.fillStyle = `rgb(30,${g},40)`;
      ctx.fillRect(x, y, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 12);
    return tex;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={grassTexture} roughness={0.95} metalness={0} />
      </mesh>

      {/* Boundary rope ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.02, 0]}>
        <ringGeometry args={[43, 45, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
      </mesh>

      {/* Inner outfield tint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.005, 0]} receiveShadow>
        <circleGeometry args={[42, 64]} />
        <meshStandardMaterial color="#35803a" roughness={0.9} />
      </mesh>
    </group>
  );
}
