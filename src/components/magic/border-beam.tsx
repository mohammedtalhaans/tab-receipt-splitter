// Adapted from Magic UI Border Beam, MIT. SVG geometry replaces offset-path;
// the palette, cadence, and double thermal highlight are specific to TAB.
import { motion, useReducedMotion } from 'motion/react';
import { usePageVisibility } from '../../hooks/use-page-visibility.ts';
export function BorderBeam({ active = true }: {
  active?: boolean
 }) {

  const reduced = useReducedMotion();
  const visible = usePageVisibility();

  const moving = active && visible && !reduced;

  return <svg className="border-beam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <rect x="0.4" y="0.4" width="99.2" height="99.2" rx="5" fill="none" stroke="var(--thermal-dim)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    <motion.rect x="0.4" y="0.4" width="99.2" height="99.2" rx="5" fill="none" stroke="var(--thermal)" strokeWidth="1.7" pathLength="100" strokeDasharray="9 91" vectorEffect="non-scaling-stroke" animate={{ strokeDashoffset: moving ? [0, -100] : 0 }} transition={{ duration: 3.6, repeat: moving ? Infinity : 0, ease: 'linear' }} />
    <motion.rect x="0.4" y="0.4" width="99.2" height="99.2" rx="5" fill="none" stroke="var(--paper)" strokeWidth="1.2" pathLength="100" strokeDasharray="2 98" vectorEffect="non-scaling-stroke" animate={{ strokeDashoffset: moving ? [0, -100] : 0 }} transition={{ duration: 3.6, repeat: moving ? Infinity : 0, ease: 'linear' }} />
  </svg>;
}
