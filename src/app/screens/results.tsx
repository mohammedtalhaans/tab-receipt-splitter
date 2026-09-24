import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown, Share2, Copy, Download, ArrowLeft, RotateCcw, ArrowUpRight, ListCollapse, ListPlus } from 'lucide-react';
import { useApp } from '../context.tsx';
import { NumberTicker } from '../../components/magic/number-ticker.tsx';
import { CompletionBurst } from '../../components/magic/confetti.tsx';
import { ShareSheet } from '../../components/results/share-sheet.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Avatar, BottomAction, SourceLink, Notice } from '../../components/ui/common.tsx';
import { Modal } from '../../components/ui/modal.tsx';
import { buildSummary, copySummary } from '../../features/sharing/summary.ts';
import { formatMoney } from '../../lib/money.ts';
import { receiptLineReveal, resultReveal, softSpring } from '../../lib/motion.ts';
import '../../styles/results-polish.css';
export default function Results() {

  const { state, dispatch, split, notify, setResetOpen } = useApp();
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [intent, setIntent] = useState<'share' | 'save'>('share');
  const [complete, setComplete] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setComplete(true), reduced ? 0 : 1320);
    return () => clearTimeout(timer);
  }, [reduced]);

  if (!split) return <Notice kind="error" title="This split needs a quick check." action={<Button onClick={() => dispatch({ type: 'GO', stage: 'review' })}>Back to the receipt</Button>}>No unverified totals will be shown.</Notice>;

  const text = buildSummary(state.receipt.label, state.receipt.currency, split);
  const everyoneExpanded = split.people.every(person => expanded.includes(person.participant.id));
  const includedExtras = state.receipt.extras.filter(extra => extra.included);
  const evenExtras = state.distribution === 'even' || split.itemTotal === 0;

  const copy = async () => {
    if (await copySummary(text)) {
      setCopied(true);
      notify('Summary copied. Dinner, dealt with.');
    } else setManualCopy(true);
  };

  const openShare = (value: 'share' | 'save') => {
    setIntent(value);
    setShareOpen(true);
  };

  return <div className="results-screen">
    <div className="result-kicker">
      <span className="eyebrow">06 / DINNER, DEALT WITH.</span>
      <span className="result-currency mono">
        {state.receipt.currency}
      </span>
    </div>
    <motion.div className="result-heading" initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }}>
      <h1 tabIndex={-1} data-stage-heading>
        <NumberTicker value={split.total} currency={state.receipt.currency} className={formatMoney(split.total, state.receipt.currency).length > 9 ? 'money-compact' : undefined} reveal delay={reduced ? 0 : 200} />
        <br />
        <span>sorted.</span>
        <motion.svg className="result-tick" viewBox="0 0 60 55" aria-hidden="true">
          <motion.path d="M 8 28 L 23 43 L 52 9" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ delay: reduced ? 0 : .72, duration: .24 }} />
        </motion.svg>
      </h1>
      <p>Good company. Fair shares. Not a cent left over.</p>
    </motion.div>
    <motion.section layoutId={shareOpen ? undefined : 'final-receipt'} className="result-receipt receipt-paper" style={{ visibility: shareOpen ? 'hidden' : 'visible' }} initial="hidden" animate="visible" variants={reduced ? undefined : resultReveal}>
      <div className="result-receipt-top">
        <span className="mono">YOUR TABLE’S TAB</span>
        <span className="mono">
          {String(split.people.length).padStart(2, '0')} {split.people.length === 1 ? 'PERSON' : 'PEOPLE'}</span>
      </div>
      <h2>
        {state.receipt.label}
      </h2>
      <details className="result-bill-breakdown">
      <summary><span>Receipt breakdown</span><ChevronDown size={16} aria-hidden="true" /></summary>
      <div className="result-bill-lines">
        <motion.div variants={reduced ? undefined : receiptLineReveal}>
          <span>{state.receipt.items.length} receipt {state.receipt.items.length === 1 ? 'item' : 'items'}</span>
          <span>
            {formatMoney(split.itemTotal, state.receipt.currency)}
          </span>
        </motion.div>
        {state.receipt.extras.filter(extra => !extra.included).map(extra => <motion.div key={extra.id} variants={reduced ? undefined : receiptLineReveal}>
          <span>{extra.label}</span>
          <span>{formatMoney(extra.amount, state.receipt.currency)}</span>
        </motion.div>)}
        {split.tipTotal > 0 && <motion.div variants={reduced ? undefined : receiptLineReveal}>
          <span>Added tip</span>
          <span>
            {formatMoney(split.tipTotal, state.receipt.currency)}
          </span>
        </motion.div>}
      </div>
      {!!includedExtras.length && <p className="result-included-note"><Check size={14} aria-hidden="true" /><span>{includedExtras.map(extra => extra.label).join(', ')} already included in item prices. Nothing added twice.</span></p>}
      </details>
      <motion.div className="thermal-divider" initial={{ scaleX: reduced ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ delay: .26, duration: .25 }} />
      <motion.div className="result-bill-total" variants={reduced ? undefined : receiptLineReveal}>
        <span>TOTAL</span>
        <NumberTicker value={split.total} currency={state.receipt.currency} reveal delay={reduced ? 0 : 240} />
      </motion.div>
      <div className="result-breakdown-toolbar">
        <div><h3>Everyone’s share</h3><p>Tap a name for the breakdown.</p></div>
        <button className="result-expand-all" onClick={() => setExpanded(everyoneExpanded ? [] : split.people.map(person => person.participant.id))}>
          {everyoneExpanded ? <ListCollapse size={17} /> : <ListPlus size={17} />}
          {everyoneExpanded ? 'Close all' : 'Show all'}
          <span className="sr-only"> breakdowns</span>
        </button>
      </div>
      <div className="participant-results">
        {split.people.map((person, index) => {
          const isExpanded = expanded.includes(person.participant.id);
          const possessive = person.participant.name === 'You' ? 'Your' : `${person.participant.name}’s`;
          return <motion.div key={person.participant.id} className="person-result" initial={{ opacity: 0, y: reduced ? 0 : -9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22, delay: reduced ? 0 : .36 + Math.min(index, 5) * .07 }}>
            <button className="person-result-summary" onClick={() => setExpanded(old => isExpanded ? old.filter(id => id !== person.participant.id) : [...old, person.participant.id])} aria-expanded={isExpanded} aria-controls={isExpanded ? `breakdown-${person.participant.id}` : undefined}>
              <Avatar person={person.participant} />
              <span className="person-result-name">
                {person.participant.name}
                <small>
                  {person.items.length} {person.items.length === 1 ? 'item' : 'items'}
                  {person.items.some(item => item.shared) ? (person.items.every(item => item.shared) ? ' · shared' : ' · shared & solo') : ''}
                </small>
              </span>
              <NumberTicker value={person.total} currency={state.receipt.currency} className={formatMoney(person.total, state.receipt.currency).length > 9 ? 'money-compact' : undefined} reveal delay={reduced ? 0 : 400 + Math.min(index, 5) * 70} />
              <ChevronDown size={15} className={isExpanded ? 'rotated' : ''} />
            </button>
            <AnimatePresence initial={false}>
              {isExpanded && <motion.div className="person-result-details" id={`breakdown-${person.participant.id}`} role="region" aria-label={`${possessive} breakdown`} initial={{ height: reduced ? 'auto' : 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: reduced ? 'auto' : 0, opacity: 0 }} transition={{ duration: .22 }}>
                <div>
                  {person.items.map(line => <div className="person-detail-line" key={line.id}>
                    <span>
                      {line.label}
                      {line.shared && <small>Split between {state.assignments[line.id]?.length ?? 1} people</small>}
                    </span>
                    <span>
                      {formatMoney(line.amount, state.receipt.currency)}
                    </span>
                  </div>)}
                  {!!person.items.length && <div className="person-detail-line person-detail-subtotal"><span>Item subtotal</span><span>{formatMoney(person.subtotal, state.receipt.currency)}</span></div>}
                  {!!person.extras.filter(line => line.amount !== 0).length && <div className="receipt-dash" />}
                  {person.extras.filter(line => line.amount !== 0).map(line => <div className="person-detail-line extra" key={line.id}>
                    <span>
                      {line.label}
                    </span>
                    <span>
                      {formatMoney(line.amount, state.receipt.currency)}
                    </span>
                  </div>)}
                  {!person.items.length && <p className="small">No items assigned.{evenExtras ? ' Includes an equal share of extras.' : ''}
                  </p>}
                  <div className="person-detail-line person-detail-total"><strong>{possessive} total</strong><strong>{formatMoney(person.total, state.receipt.currency)}</strong></div>
                </div>
              </motion.div>}
            </AnimatePresence>
          </motion.div>;
        })}
      </div>
      <p className="result-allocation-note">{(state.receipt.extras.some(extra => !extra.included) || split.tipTotal > 0) && (evenExtras ? 'Fees, discounts and any added tip are shared equally across the table. ' : 'Fees, discounts and any added tip follow each person’s item subtotal. ')}Shared items are divided equally. Spare cents are assigned one at a time, so everyone’s totals add up exactly.</p>
      <motion.div className="result-reconciled" initial={{ opacity: 0, scale: reduced ? 1 : .97 }} animate={{ opacity: complete ? 1 : .55, scale: 1 }} transition={softSpring}>
        <span className="result-check-icon">
          <Check size={15} />
        </span>
        <div>
          <strong>Every cent accounted for.</strong>
          <span>
            {formatMoney(split.total, state.receipt.currency)} in. {formatMoney(split.total, state.receipt.currency)} split.</span>
        </div>
        <span className="zero-difference mono">±0.00</span>
      </motion.div>
      <div className="result-paper-footer">
        <div className="barcode" />
        <span>THANK YOU. GO ENJOY THE NIGHT.</span>
      </div>
    </motion.section>
    <div className="result-share-secondary">
      <Button variant="secondary" onClick={() => void copy()}>
        {copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Summary copied' : 'Copy summary'}</Button>
      <Button variant="secondary" onClick={() => openShare('save')}>
        <Download size={17} />Save image</Button>
    </div>
    <div className="result-source">
      <span>Free & open source.</span>
      <SourceLink label="Made to be shared" />
    </div>
    <Button variant="ghost" className="fill new-split" onClick={() => setResetOpen(true)}>
      <RotateCcw size={15} />Start a fresh split</Button>
    <BottomAction>
      <Button size="large" onClick={() => openShare('share')}>
        <Share2 size={20} />Share results<ArrowUpRight size={20} className="button-end" />
      </Button>
    </BottomAction>
    <CompletionBurst fire={complete && split.reconciled} />
    <ShareSheet open={shareOpen} onOpenChange={setShareOpen} intent={intent} />
    <Modal open={manualCopy} onOpenChange={setManualCopy} title="Ready to copy." description="This browser couldn’t access the clipboard. Select and copy the text instead." onOpenAutoFocus={event => {
      event.preventDefault();
      copyField.current?.focus();
      copyField.current?.select();
    }}>
      <textarea ref={copyField} readOnly value={text} rows={12} aria-label="Split summary to copy" />
      <Button variant="ghost" className="fill" onClick={() => setManualCopy(false)}>
        <ArrowLeft size={16} />Back to the table</Button>
    </Modal>
  </div>;
}
