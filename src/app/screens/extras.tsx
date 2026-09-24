import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Plus, Pencil, Check, SlidersHorizontal, Heart, ChevronDown } from 'lucide-react';
import { useApp } from '../context.tsx';
import type { ExtraKind, ReceiptExtra } from '../../types/index.ts';
import { PageHeading, BottomAction, Notice } from '../../components/ui/common.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { Segmented } from '../../components/ui/segmented.tsx';
import { ExtraEditor, ReceiptEditor, ConfirmCalculatedTotal } from '../../components/receipt/editors.tsx';
import { Reconciliation } from '../../components/receipt/reconciliation.tsx';
import { NumberTicker } from '../../components/magic/number-ticker.tsx';
import { formatMoney, moneyInput, parseMoney } from '../../lib/money.ts';
import { calculatedReceiptTotal, itemTotal } from '../../features/splitting/engine.ts';
import { softSpring } from '../../lib/motion.ts';
import '../../styles/results-polish.css';
const quickExtras: {
  kind: ExtraKind;
  label: string
 }[] = [{ kind: 'tax', label: 'Tax' }, { kind: 'service', label: 'Service' }, { kind: 'surcharge', label: 'Surcharge' }, { kind: 'discount', label: 'Discount' }];
export default function Extras() {

  const { state, dispatch, receiptCheck, tipAmount, split, calculationError } = useApp();
  const reduced = useReducedMotion();
  const [extra, setExtra] = useState<ReceiptExtra | null>(null);
  const [kind, setKind] = useState<ExtraKind>('tax');
  const [extraOpen, setExtraOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [custom, setCustom] = useState(moneyInput(state.tip.customAmount));
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);

  const tipValue = state.tip.mode === 'none' ? 'none' : state.tip.mode === 'custom' ? 'custom' : String(state.tip.basisPoints);

  const hasPrintedTip = state.receipt.extras.some(fee => fee.kind === 'tip' && !fee.included && fee.amount > 0);

  function setTip(value: string) {
    setError('');
    dispatch({ type: 'SET_TIP', tip: { ...state.tip, mode: value === 'none' ? 'none' : value === 'custom' ? 'custom' : 'percent', basisPoints: value === 'none' || value === 'custom' ? 0 : Number(value) } });
  }

  function customTip(value: string) {
    setCustom(value);
    const amount = parseMoney(value);
    if (amount === null || amount < 0) {
      setError('Enter a tip amount, for example 12.50.');
      return;
    }
    setError('');
    dispatch({ type: 'SET_TIP', tip: { mode: 'custom', basisPoints: 0, customAmount: amount } });
  }

  return <motion.div className="extras-screen" animate={{ scale: leaving && !reduced ? .985 : 1, y: leaving && !reduced ? -8 : 0 }} transition={softSpring}>
    <PageHeading eyebrow="05 / THE FINISHING TOUCHES" title={<>A little extra.<br />
      <span className="muted-heading">Still perfectly fair.</span>
    </>}>Check what’s on the receipt, then add a tip if you’d like.</PageHeading>
    <div className="extras-ledger">
      <div className="extras-section-label"><h2>On the receipt</h2><span>{state.receipt.currency}</span></div>
      <div className="extras-ledger-row items">
        <span>
          {state.receipt.items.length} items, all claimed</span>
        <NumberTicker value={itemTotal(state.receipt)} currency={state.receipt.currency} />
      </div>
      {state.receipt.extras.map(fee => <motion.button layout className={`extras-ledger-row ${fee.included ? 'included' : ''}`} key={fee.id} onClick={() => {
        setExtra(fee);
        setKind(fee.kind);
        setExtraOpen(true);
      }}>
        <span>
          {fee.label}
          {fee.included && <small>
            <Check size={13} />Already included · adds nothing extra</small>}
        </span>
        <b>
          {formatMoney(fee.amount, state.receipt.currency)}
        </b>
        <Pencil size={14} />
      </motion.button>)}
      <details className="extra-add-options"><summary><Plus size={16} />Add a missing charge or discount</summary><p>Only add amounts shown on your receipt. Tap any amount above to correct it.</p><div className="quick-extras">
        {quickExtras.filter(entry => !state.receipt.extras.some(fee => fee.kind === entry.kind)).map(entry => <Button key={entry.kind} variant="ghost" size="small" onClick={() => {
          setExtra(null);
          setKind(entry.kind);
          setExtraOpen(true);
        }}>
          <Plus size={13} />
          {entry.label}
        </Button>)}
        <Button variant="ghost" size="small" onClick={() => {
          setExtra(null);
          setKind('adjustment');
          setExtraOpen(true);
        }}>
          <Plus size={13} />Other</Button>
      </div></details>
      <div className="extras-receipt-total"><span>Receipt total <small>before any new tip</small></span><strong>{formatMoney(calculatedReceiptTotal(state.receipt), state.receipt.currency)}</strong></div>
    </div>
    <section className="tip-section">
      <div className="tip-section-heading">
        <div>
          <Heart size={17} />
          <h2>
            {hasPrintedTip ? 'Add another tip?' : 'Add an optional tip'}
          </h2>
        </div>
        <NumberTicker value={tipAmount} currency={state.receipt.currency} />
      </div>
      {hasPrintedTip && <Notice kind="info" title="A tip is already on this receipt.">Choose None to keep the printed tip as it is. Anything you add here is on top.</Notice>}
      <Segmented label="Tip percentage" value={tipValue} onChange={setTip} options={[{ value: 'none', label: 'None' }, { value: '1000', label: '10%' }, { value: '1500', label: '15%' }, { value: '2000', label: '20%' }, { value: 'custom', label: 'Custom' }]} />
      {state.tip.mode === 'custom' && <label className="field custom-tip-field">Custom tip amount ({state.receipt.currency})<Input inputMode="decimal" value={custom} onChange={event => customTip(event.target.value)} aria-invalid={!!error} />
      </label>}
      <p className="tip-basis">{state.tip.mode === 'percent' ? `${state.tip.basisPoints / 100}% of ${formatMoney(itemTotal(state.receipt), state.receipt.currency)} in items = ${formatMoney(tipAmount, state.receipt.currency)}.` : state.tip.mode === 'custom' ? 'This is a new tip for the whole table, added to the receipt total.' : `No extra tip. Percentages use the ${formatMoney(itemTotal(state.receipt), state.receipt.currency)} item subtotal, before fees.`}</p>
      {error && <Notice kind="error" title={error} />}
    </section>
    <details className="distribution-details">
      <summary>
        <SlidersHorizontal size={16} />
        <span>{state.distribution === 'even' || itemTotal(state.receipt) === 0 ? 'Extras are shared equally.' : 'Extras follow what you ordered.'}</span>
        <ChevronDown size={15} />
      </summary>
      <p>{itemTotal(state.receipt) === 0 ? 'The items total zero, so extras are shared equally across everyone at the table.' : state.distribution === 'even' ? 'Everyone gets an equal share of fees, added taxes, discounts and any tip, even if they have no items.' : 'Fees, added taxes, discounts and any tip follow each person’s item subtotal. A bigger order gets a bigger share of extras.'} Included taxes are never added again.</p>
      <label className="checkbox-row">
        <input type="checkbox" checked={state.distribution === 'even'} onChange={event => dispatch({ type: 'SET_DISTRIBUTION', distribution: event.target.checked ? 'even' : 'proportional' })} />
        <span>Split extras evenly instead<small>Includes everyone, even someone with no items.</small>
        </span>
      </label>
    </details>
    <Reconciliation onEdit={() => setMetaOpen(true)} compact />
    {!receiptCheck.matched && <Button className="fill" variant="secondary" onClick={() => setConfirmOpen(true)}>Confirm the updated receipt total<ArrowRight size={16} />
    </Button>}
    <motion.div className="final-total-preview" layout>
      <div>
        <span>THE WHOLE TABLE</span>
        <strong>{tipAmount > 0 ? 'Receipt + added tip' : 'Ready to split'}</strong>
      </div>
      <NumberTicker value={calculatedReceiptTotal(state.receipt) + tipAmount} currency={state.receipt.currency} />
    </motion.div>
    {calculationError && <Notice kind="error" title="Let’s check this amount.">
      {calculationError}
    </Notice>}
    <BottomAction note={state.distribution === 'even' ? 'Extras split equally. Items stay as assigned.' : 'Proportional extras. Not a cent left behind.'}>
      <Button size="large" disabled={!split || !!error || leaving} onClick={() => {
        setLeaving(true);
        dispatch({ type: 'GO', stage: 'results' });
      }}>Calculate everyone’s share<ArrowRight size={20} className="button-end" />
      </Button>
    </BottomAction>
    <ExtraEditor open={extraOpen} onOpenChange={setExtraOpen} extra={extra} initialKind={kind} />
    <ReceiptEditor open={metaOpen} onOpenChange={setMetaOpen} />
    <ConfirmCalculatedTotal open={confirmOpen} onOpenChange={setConfirmOpen} />
  </motion.div>;
}
