import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ResultEffectProps {
  text: string | null;
  onComplete?: () => void;
}

export function ResultEffect({ text, onComplete }: ResultEffectProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!text || !ref.current) return;

    const el = ref.current;
    gsap.fromTo(
      el,
      { scale: 0.3, opacity: 0, y: 20 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'back.out(2)',
        onComplete: () => {
          gsap.to(el, {
            opacity: 0,
            y: -30,
            duration: 0.8,
            delay: 1.5,
            onComplete,
          });
        },
      },
    );
  }, [text, onComplete]);

  if (!text) return null;

  const isBig = text === 'SIX' || text === 'WICKET' || text === 'FOUR';

  return (
    <div className={`result-effect ${isBig ? 'result-effect--big' : ''}`} ref={ref}>
      {text}
    </div>
  );
}
