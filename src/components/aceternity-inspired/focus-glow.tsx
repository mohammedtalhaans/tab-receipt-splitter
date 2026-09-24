/** Original TAB code. Concept inspired by interactive focus borders, NOT copied
 * from Aceternity: its published licence does not clearly permit source redistribution. */
import type { ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { moneySpring } from '../../lib/motion.ts';
export function FocusGlow({ children, className = '' }: {
  children: ReactNode;
  className?: string
 }) {

  const reduced = useReducedMotion();

  const pointerX = useMotionValue(-200);
  const pointerY = useMotionValue(-200);

  const x = useSpring(pointerX, moneySpring);
  const y = useSpring(pointerY, moneySpring);

  const background = useMotionTemplate`radial-gradient(160px circle at ${x}px ${y}px, var(--thermal), transparent 85%)`;

  return <div className={`focus-surface ${className}`} onPointerMove={event => {
    if (reduced || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(event.clientX - bounds.left);
    pointerY.set(event.clientY - bounds.top);
  }} onPointerLeave={() => {
    pointerX.set(-200);
    pointerY.set(-200);
  }}>
    <motion.div className="focus-glow" style={{ background }} aria-hidden="true" />
    {children}
  </div>;
}
