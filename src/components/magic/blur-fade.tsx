// Adapted from Magic UI Blur Fade, MIT. Faster, smaller, and reduced-motion aware.
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
export function BlurFade({ children, delay = 0, className }: {
  children: ReactNode;
  delay?: number;
  className?: string
 }) {

  const reduced = useReducedMotion();

  return <motion.div className={className} initial={{ opacity: 0, y: reduced ? 0 : 5, filter: reduced ? 'none' : 'blur(3px)' }} animate={{ opacity: 1, y: 0, filter: reduced ? 'none' : 'blur(0px)' }} transition={{ duration: reduced ? 0.1 : 0.24, delay: reduced ? 0 : delay, ease: 'easeOut' }}>
    {children}
  </motion.div>;
}
