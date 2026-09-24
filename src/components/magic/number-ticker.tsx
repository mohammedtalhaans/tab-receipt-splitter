/**
 * Adapted from Magic UI Number Ticker, MIT (Copyright Magic UI).
 * Original: apps/www/registry/magicui/number-ticker.tsx
 * Changes: animated integer cents, stable accessible value, faster spring,
 * live updates, reduced-motion support, and no initial layout shift.
 */
import { useEffect, useRef } from 'react';
import { useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import type { Currency } from '../../types/index.ts';
import { formatMoney } from '../../lib/money.ts';
import { moneySpring } from '../../lib/motion.ts';
import { cn } from '../../lib/utils.ts';
export function NumberTicker({ value, currency = 'AUD', className, reveal = false, delay = 0 }: {
  value: number;
  currency?: Currency;
  className?: string;
  reveal?: boolean;
  delay?: number
 }) {

  const reduced = useReducedMotion();

  const ref = useRef<HTMLSpanElement>(null);

  const motionValue = useMotionValue(reveal && !reduced ? 0 : value);

  const spring = useSpring(motionValue, moneySpring);

  useEffect(() => {

    const render = (latest: number) => {
      if (ref.current) ref.current.textContent = formatMoney(Math.round(latest), currency);
    };

    render(reduced ? value : spring.get());

    return spring.on('change', latest => render(reduced ? value : latest));

  }, [currency, reduced, spring, value]);

  useEffect(() => {

    if (reduced) {
      spring.jump(value);
      motionValue.set(value);
      return;
    }
    // Delay is milliseconds, like the result choreography presets.

    const timer = setTimeout(() => motionValue.set(value), delay);
    // Settle on an exact cent on a fixed deadline, even when a frame was dropped.

    const settle = setTimeout(() => spring.jump(value), delay + (reveal ? 520 : 280));

    return () => {
      clearTimeout(timer);
      clearTimeout(settle);
    };

  }, [delay, motionValue, reduced, reveal, spring, value]);

  return <span className={cn('number-ticker', className)}>
    <span aria-hidden="true" ref={ref}>
      {formatMoney(reveal && !reduced ? 0 : value, currency)}
    </span>
    <span className="sr-only">
      {formatMoney(value, currency)}
    </span>
  </span>;
}
