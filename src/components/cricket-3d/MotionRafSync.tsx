import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { tickMotions } from '../../utils/motionRunner';

/** Drives imperative position tweens and GSAP from the R3F render loop. */
export function MotionRafSync() {
  const gsapTime = useRef(0);

  useFrame((_, delta) => {
    tickMotions(delta);
    gsapTime.current += delta;
    gsap.updateRoot(gsapTime.current);
  });
  return null;
}
