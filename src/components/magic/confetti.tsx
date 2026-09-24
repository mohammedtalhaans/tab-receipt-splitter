// Adapted from Magic UI Confetti, MIT. Lazy import, one tiny local burst, no loops.
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import type { CreateTypes } from 'canvas-confetti';
export function CompletionBurst({ fire }: {
  fire: boolean
 }) {

  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {

    if (!fire || reduced || document.hidden) return;

    let cancelled = false;
    let instance: CreateTypes | undefined;

    void import('canvas-confetti').then(({ default: confetti }) => {

      if (cancelled || !ref.current) return;

      instance = confetti.create(ref.current, { resize: true, useWorker: true });

      void instance({
        particleCount: 18, spread: 48, startVelocity: 19, gravity: 0.85, ticks: 75, scalar: 0.6,
        origin: { x: 0.5, y: 0.65 }, colors: ['#FF5A1F', '#F5F0E6', '#B7F56A'], disableForReducedMotion: true
      });

    }).catch(() => undefined); // Decorative failure must never prevent a result.

    return () => {
      cancelled = true;
      instance?.reset();
    };

  }, [fire, reduced]);

  return <canvas ref={ref} className="completion-confetti" aria-hidden="true" />;
}
