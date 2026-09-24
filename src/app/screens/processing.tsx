import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, ScanLine, RotateCcw, PenLine, LockKeyhole, ReceiptText } from 'lucide-react';
import { useApp } from '../context.tsx';
import { PageHeading, BottomAction, Notice } from '../../components/ui/common.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Progress } from '../../components/ui/progress.tsx';
import { BorderBeam } from '../../components/magic/border-beam.tsx';
import { BlurFade } from '../../components/magic/blur-fade.tsx';
import { formatMoney } from '../../lib/money.ts';
import { softSpring, itemReflow } from '../../lib/motion.ts';
const phases = [{ key: 'preparing', label: 'Prepare' }, { key: 'reading', label: 'Read' }, { key: 'finding', label: 'Find items' }, { key: 'checking', label: 'Check total' }];
export default function Processing() {

  const { state, dispatch, scanner, receiptCheck } = useApp();
  const reduced = useReducedMotion();
  const { scan, receipt } = state;

  const ready = scan.phase === 'ready';
  const failed = scan.phase === 'error';
  const phaseIndex = ({ preparing: 0, loading: 1, reading: 1, finding: 2, checking: 3, ready: 4, error: -1 })[scan.phase];

  const boxes = scan.result?.lines.filter(line => line.bbox && /\d[.,]\d{2}/.test(line.text)).slice(0, 80) ?? [];

  return <div className="processing-screen">
    <PageHeading eyebrow={scan.sample ? 'SAMPLE RECEIPT / DEMO PLAYBACK' : '01 / ON-DEVICE READER'} title={failed ? <>Not quite<br />readable.</> : ready ? <>Paperwork,<br />
      <span className="accent">understood.</span>
    </> : <>A little<br />receipt magic.</>}>
      {scan.sample ? 'A sample scan with saved OCR. Your real photos use the on-device reader.' : 'Your browser does the reading. Your receipt goes nowhere.'}
    </PageHeading>
    <motion.div className={`scanner-frame ${ready ? 'is-ready' : ''} ${failed ? 'has-error' : ''}`} layout initial={{ y: reduced ? 0 : -25, rotate: reduced ? 0 : -3, scale: reduced ? 1 : .97 }} animate={{ y: 0, rotate: 0, scale: 1 }} transition={softSpring}>
      <div className="scanner-topline">
        <span>
          <span className={`live-dot ${ready ? 'green' : ''}`} />
          {scan.sample ? 'SAMPLE / NOT A LIVE SCAN' : 'LOCAL VISION ENGINE'}
        </span>
        <LockKeyhole size={13} />
      </div>
      {failed ? <div className="scan-error-placeholder"><ReceiptText size={42} strokeWidth={1.4} /><strong>We can still sort this.</strong><p>Choose a clearer photo, or type the items.</p></div> : <div className="scanner-viewport">
        <div className="scanner-photo" style={{ aspectRatio: `${scan.width || 700} / ${scan.height || 1120}` }}>
          {scan.imageUrl && <img src={scan.imageUrl} alt="Selected receipt, processed only on this device" draggable={false} />}
          {boxes.map((line, index) => {
            const box = line.bbox!;
            const width = scan.result!.width || scan.width;
            const height = scan.result!.height || scan.height;
            return <motion.div key={`${index}-${line.text}`} className={`ocr-box ${line.confidence < 78 ? 'uncertain' : ''}`} initial={{ opacity: 0, scaleX: reduced ? 1 : .7 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: .2, delay: reduced ? 0 : Math.min(index * .025, .4) }} style={{ left: `${box.x0 / width * 100}%`, top: `${box.y0 / height * 100}%`, width: `${(box.x1 - box.x0) / width * 100}%`, height: `${(box.y1 - box.y0) / height * 100}%` }} aria-hidden="true" />;
          })}
        </div>
        {!ready && !failed && <div className={`thermal-scan ${reduced ? 'still' : ''}`} aria-hidden="true">
          <span />
          <ScanLine size={16} />
        </div>}
        {ready && <motion.div className="scan-complete-stamp" initial={{ scale: reduced ? 1 : .6, rotate: -8 }} animate={{ scale: 1, rotate: -8 }} transition={softSpring}>
          <Check size={16} />READ LOCALLY</motion.div>}
      </div>}
      <BorderBeam active={!ready && !failed} />
      <div className="scanner-status" role="status" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.span key={scan.status} initial={{ y: reduced ? 0 : 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduced ? 0 : -4, opacity: 0 }} transition={{ duration: .15 }}>
            {failed ? 'Let’s try another way' : scan.status}
          </motion.span>
        </AnimatePresence>
        <span className="mono">
          {ready ? `${receipt.items.length} ITEMS` : scan.progress !== null ? `${Math.round(scan.progress * 100)}%` : 'ON DEVICE'}
        </span>
      </div>
      {!ready && !failed && <Progress value={scan.progress} label="Receipt recognition progress" />}
    </motion.div>
    {!failed && <ol className="scan-phases" aria-label="Reading stages">
      {phases.map((phase, index) => <li className={index < phaseIndex ? 'done' : index === phaseIndex ? 'active' : ''} key={phase.key}>
        {index < phaseIndex ? <Check size={12} /> : <span>
          {index + 1}
        </span>}
        {phase.label}
      </li>)}
    </ol>}
    {!ready && !failed && !scan.sample && <div className="scan-wait-guidance"><p>{scan.phase === 'loading' ? 'Getting the reader ready. The first scan can take a little longer.' : 'Keep this tab open while your receipt is read.'}</p><Button variant="ghost" onClick={() => { scanner.clear(); dispatch({ type: 'MANUAL' }); }}><PenLine size={16} />Enter manually instead</Button></div>}
    {ready && <BlurFade>
      <div className="extraction-stack">
        <div className="section-label">
          <span>FOUND ON YOUR RECEIPT</span>
          <span>
            {receipt.items.length} ITEMS</span>
        </div>
        {receipt.items.slice(0, 3).map((item, index) => <motion.div key={item.id} layoutId={`receipt-item-${item.id}`} layout className="extracted-mini receipt-paper" initial={{ y: reduced ? 0 : -18, rotate: reduced ? 0 : (index - 1) * 2 }} animate={{ y: 0, rotate: 0 }} transition={{ ...itemReflow, delay: reduced ? 0 : index * .06 }}>
          <span>
            {item.name}
          </span>
          <b>
            {formatMoney(item.amount, receipt.currency)}
          </b>
        </motion.div>)}
        {receipt.items.length > 3 && <p className="muted center">+ {receipt.items.length - 3} more, ready to check</p>}
      </div>
      <Notice kind={receiptCheck.matched ? 'success' : 'warning'} title={receiptCheck.matched ? 'The numbers match.' : 'A few numbers need your eyes.'}>
        {receiptCheck.matched ? `${formatMoney(receiptCheck.calculated, receipt.currency)} across ${receipt.items.length} items and printed extras. Check the names and prices next.` : 'The next screen shows the difference alongside the photo and editable items.'}
      </Notice>
    </BlurFade>}
    {failed && <Notice kind="error" title="We couldn’t make sense of this one.">
      {scan.error}
      <div className="inline-actions">
        <Button variant="secondary" onClick={() => {
          scanner.cancel();
          dispatch({ type: 'GO', stage: 'capture' });
        }}>
          <RotateCcw size={17} />Try another photo</Button>
        <Button variant="ghost" onClick={() => {
          scanner.clear();
          dispatch({ type: 'MANUAL' });
        }}>
          <PenLine size={17} />Enter manually</Button>
      </div>
    </Notice>}
    <BottomAction note={ready ? 'OCR is a first draft. You’re the final check.' : undefined}>
      {ready ? <Button size="large" onClick={() => dispatch({ type: 'GO', stage: 'review' })}>Check {receipt.items.length} {receipt.items.length === 1 ? 'item' : 'items'}<ArrowRight size={20} className="button-end" />
      </Button> : <Button variant="secondary" onClick={() => {
        scanner.cancel();
        dispatch({ type: 'GO', stage: 'capture' });
      }}>
        {failed ? 'Back to photo options' : 'Cancel scan'}
      </Button>}
    </BottomAction>
  </div>;
}
