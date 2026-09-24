import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { Check, ScanLine } from 'lucide-react';
import { usePageVisibility } from '../../hooks/use-page-visibility.ts';
import { softSpring } from '../../lib/motion.ts';
import { Avatar } from '../ui/common.tsx';
const people = [{ id: 'hero-you', name: 'You', tone: 0 }, { id: 'hero-maya', name: 'Maya', tone: 1 }];
export function HeroReceipt() {

  const reduced = useReducedMotion();
  const visible = usePageVisibility();
  const play = visible && !reduced;

  const pointer = useMotionValue(0);
  const spring = useSpring(pointer, softSpring);
  const rotate = useTransform(spring, [-1, 1], [-5, -1]);

  return <div className="hero-visual" aria-label="A receipt becoming a fair split: You owe 55 dollars, Maya owes 33 dollars." role="img"
    onPointerMove={event => {
      if (event.pointerType === 'mouse' && !reduced) {
        const rect = event.currentTarget.getBoundingClientRect();
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1);
      }
    }} onPointerLeave={() => pointer.set(0)}>
    <div className="hero-orbit" aria-hidden="true" />
    <div className="printer-label" aria-hidden="true">
      <span className="live-dot" /> THE END OF “LET’S JUST SPLIT IT”</div>
    <div className="printer-slot" aria-hidden="true">
      <span />
    </div>
    <div className="printer-mask" aria-hidden="true">
      <motion.div className="hero-paper receipt-paper" style={{ rotate: reduced ? -3 : rotate }} animate={play ? { y: [-42, 14, 14, -42] } : { y: 0 }} transition={play ? { duration: 9, times: [0, .2, .76, 1], repeat: Infinity, repeatDelay: 1.2, ease: [.22, 1, .36, 1] } : { duration: 0 }}>
        <div className="receipt-corner-mark">01 / THE GOOD KIND OF PAPERWORK</div>
        <div className="hero-restaurant">NORTH & EMBER</div>
        <div className="receipt-meta">GOOD FOOD. BETTER COMPANY.</div>
        <div className="receipt-dash" />
        <div className="hero-receipt-line">
          <span>1 RIBEYE</span>
          <span>46.00</span>
        </div>
        <div className="hero-receipt-line">
          <span>1 BURRATA <small>SHARED</small>
          </span>
          <span>18.00</span>
        </div>
        <div className="hero-receipt-line">
          <span>2 HOUSE RED</span>
          <span>24.00</span>
        </div>
        <div className="receipt-dash" />
        <div className="hero-receipt-total">
          <span>TOTAL</span>
          <span>88.00<svg className="ink-circle" viewBox="0 0 120 60">
            <motion.path d="M 110 26 C 96 0, 8 5, 6 30 C 3 63, 112 55, 114 27 C 114 9, 53 5, 31 12" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ delay: .6, duration: .5 }} />
          </svg>
          </span>
        </div>
        <p className="hero-paper-foot">SPLIT THE RECEIPT.<br />NOT THE BILL EQUALLY.</p>
        <div className="barcode" />
        {play && <motion.div className="hero-scan-line" animate={{ top: ['14%', '80%'], opacity: [0, 1, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 8, delay: .8 }} />}
      </motion.div>
    </div>
    <motion.div className="hero-allocation allocation-you" aria-hidden="true" initial={{ y: reduced ? 0 : 28, opacity: 0, rotate: 3 }} animate={{ y: 0, opacity: 1, rotate: 3 }} transition={{ ...softSpring, delay: .65 }}>
      <Avatar person={people[0]!} />
      <div>
        <span>YOU ORDERED. YOU OWE.</span>
        <strong>You <b>$55.00</b>
        </strong>
      </div>
      <Check size={15} />
    </motion.div>
    <motion.div className="hero-allocation allocation-maya" aria-hidden="true" initial={{ y: reduced ? 0 : 30, opacity: 0, rotate: -4 }} animate={{ y: 0, opacity: 1, rotate: -4 }} transition={{ ...softSpring, delay: .8 }}>
      <Avatar person={people[1]!} />
      <div>
        <span>HER SHARE. NOT HALF.</span>
        <strong>Maya <b>$33.00</b>
        </strong>
      </div>
      <Check size={15} />
    </motion.div>
    <div className="hero-annotation" aria-hidden="true">
      <ScanLine size={16} />
      <span>One receipt.<br />
        <b>Zero awkward maths.</b>
      </span>
    </div>
  </div>;
}
