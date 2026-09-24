import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, LockKeyhole, Pencil, TriangleAlert } from 'lucide-react';
import { useApp } from '../../app/context.tsx';
import { formatMoney } from '../../lib/money.ts';
import { snappySpring } from '../../lib/motion.ts';
import { NumberTicker } from '../magic/number-ticker.tsx';
import { Button } from '../ui/button.tsx';
export function Reconciliation({ onEdit, compact = false }: {
  onEdit?: () => void;
  compact?: boolean
 }) {

  const { state, receiptCheck } = useApp();
  const reduced = useReducedMotion();

  const matched = receiptCheck.matched;
  const missing = receiptCheck.difference === null;

  return <motion.div layout className={`reconciliation ${matched ? 'matched' : 'unmatched'} ${compact ? 'compact' : ''}`} transition={snappySpring}>
    <div className="reconciliation-main" role="status" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span className="reconciliation-icon" key={matched ? 'matched' : 'unmatched'} initial={{ scale: reduced ? 1 : .55, rotate: reduced ? 0 : -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: reduced ? 1 : .7, opacity: 0 }} transition={snappySpring}>
          {matched ? <LockKeyhole size={18} /> : <TriangleAlert size={18} />}
        </motion.span>
      </AnimatePresence>
      <div className="reconciliation-copy">
        <strong>
          {matched ? (state.receipt.totalSource === 'confirmed' ? 'Total confirmed' : 'Receipt matched') : missing ? 'One total to check.' : <>We’re <NumberTicker value={Math.abs(receiptCheck.difference ?? 0)} currency={state.receipt.currency} /> off</>}
        </strong>
        {!compact && <p>
          {matched ? 'Every cent accounted for.' : missing ? 'Enter the final printed amount, or confirm the items you’ve checked.' : `Items and extras are ${receiptCheck.difference! > 0 ? 'higher' : 'lower'} than the receipt total. Check prices, missing items and tax.`}
        </p>}
      </div>
      {matched && !onEdit && <Check className="reconcile-end" size={17} />}
      {onEdit && <Button variant="ghost" size="icon" aria-label="Edit receipt total" onClick={onEdit}>
        <Pencil size={16} />
      </Button>}
    </div>
    {!compact && !matched && <div className="reconciliation-figures">
      <div>
        <span>Items + extras</span>
        <strong>
          {formatMoney(receiptCheck.calculated, state.receipt.currency)}
        </strong>
      </div>
      <div>
        <span>Receipt total</span>
        <strong>
          {receiptCheck.expected === undefined ? 'Not found' : formatMoney(receiptCheck.expected, state.receipt.currency)}
        </strong>
      </div>
    </div>}
  </motion.div>;
}
