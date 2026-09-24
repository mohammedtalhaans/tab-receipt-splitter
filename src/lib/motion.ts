import type { Transition, Variants } from 'motion/react';
export const snappySpring: Transition = { type: 'spring', stiffness: 480, damping: 34, mass: 0.72 };
export const softSpring: Transition = { type: 'spring', stiffness: 180, damping: 24, mass: 0.85 };
export const itemReflow: Transition = { type: 'spring', stiffness: 380, damping: 32 };
export const moneySpring = { stiffness: 210, damping: 32, mass: 0.7 };
export const screenTransition: Transition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };
export const successPop: Variants = { hidden: { scale: 0.7, rotate: -12 }, visible: { scale: 1, rotate: 0, transition: snappySpring } };
export const resultReveal: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } };
export const receiptLineReveal: Variants = { hidden: { y: -8, opacity: 0, clipPath: 'inset(0 0 100% 0)' }, visible: { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', transition: screenTransition } };
