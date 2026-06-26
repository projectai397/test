import { useEffect, useState, type ReactNode } from 'react';
import { isGlbAvailable } from '../../utils/modelAvailability';

interface OptionalModelCharacterProps {
  modelUrl: string;
  label: string;
  children: ReactNode;
}

/** Mount GLB characters only when the file exists — avoids Suspense crash on missing store models. */
export function OptionalModelCharacter({ modelUrl, label, children }: OptionalModelCharacterProps) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    isGlbAvailable(modelUrl).then((ok) => {
      if (cancelled) return;
      if (!ok) {
        console.warn(`[Cricket3D] Skipping ${label} — missing GLB at ${modelUrl}`);
      }
      setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [modelUrl, label]);

  if (available !== true) return null;
  return <>{children}</>;
}
