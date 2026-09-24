import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowRight, Plus, Pencil, Check, RotateCcw, Image, ReceiptText, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';
import { useApp } from '../context.tsx';
import type { ReceiptItem, ReceiptExtra } from '../../types/index.ts';
import { Button } from '../../components/ui/button.tsx';
import { PageHeading, BottomAction, EmptyReceipt, Notice } from '../../components/ui/common.tsx';
import { ItemEditor, ReceiptEditor, ConfirmCalculatedTotal, ExtraEditor } from '../../components/receipt/editors.tsx';
import { Reconciliation } from '../../components/receipt/reconciliation.tsx';
import { Modal } from '../../components/ui/modal.tsx';
import { NumberTicker } from '../../components/magic/number-ticker.tsx';
import { formatMoney } from '../../lib/money.ts';
import { itemTotal } from '../../features/splitting/engine.ts';
import { itemReflow } from '../../lib/motion.ts';
export default function Review() {

  const { state, dispatch, receiptCheck } = useApp();
  const { receipt, scan } = state;
  const reduced = useReducedMotion();

  const [editing, setEditing] = useState<ReceiptItem | null>(null);
  const [itemOpen, setItemOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoZoomed, setPhotoZoomed] = useState(false);
  const [onlyUncertain, setOnlyUncertain] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [extra, setExtra] = useState<ReceiptExtra | null>(null);

  const uncertain = receipt.items.filter(item => item.confidence === 'check').length;
  const visibleItems = onlyUncertain ? receipt.items.filter(item => item.confidence === 'check') : receipt.items;

  const edit = (item: ReceiptItem | null) => {
    setEditing(item);
    setItemOpen(true);
  };

  return <div className="review-screen">
    <PageHeading eyebrow={scan.imageUrl ? '02 / A QUICK SANITY CHECK' : '02 / YOUR RECEIPT, BY HAND'} title={receipt.items.length || scan.imageUrl ? <>Looks right?<br />
      <span className="muted-heading">Make it yours.</span>
    </> : <>Start with<br /><span className="muted-heading">what you ordered.</span></>}>{scan.imageUrl ? 'Compare the names and prices with your receipt, then check the total.' : 'Add each item’s full line price. You can keep adding without closing the editor.'}</PageHeading>
    <button className="receipt-label-button" aria-label={`Edit receipt details for ${receipt.label}`} onClick={() => setMetaOpen(true)}>
      <ReceiptText size={16} />
      <span>
        {receipt.label}
      </span>
      <span className="mono">
        {receipt.currency}
      </span>
      <Pencil size={15} />
    </button>
    {(receipt.items.length > 0 || scan.imageUrl) && <div className="review-overview">
      <button className="review-total-link" onClick={() => setMetaOpen(true)} aria-label="Check printed receipt total">
        <span className="mono">{receipt.totalSource === 'confirmed' ? 'CONFIRMED TOTAL' : 'PRINTED RECEIPT TOTAL'}</span>
        <strong>{receipt.total === undefined ? 'Add the total' : formatMoney(receipt.total, receipt.currency)}<Pencil size={15} /></strong>
        <small>{receiptCheck.matched ? 'Items + extras match' : receipt.total === undefined ? 'Confirm this before splitting' : `${formatMoney(Math.abs(receiptCheck.difference ?? 0), receipt.currency)} difference to check`}</small>
      </button>
      {scan.imageUrl && <button className="review-photo-trigger" onClick={() => { setPhotoZoomed(false); setPhotoOpen(true); }}>
        <img src={scan.imageUrl} alt="" />
        <span><Image size={17} />Compare photo</span>
      </button>}
    </div>}
    {uncertain > 0 && <Notice kind="warning" title={`${uncertain} ${uncertain === 1 ? 'item could' : 'items could'} use a second look.`}>The marked lines were harder to read. Check their name and price; tap “Looks right” once you’ve checked.</Notice>}
    {receipt.items.length > 0 && <div className="review-list-heading"><h2>Receipt items</h2><span>{receipt.items.length} {receipt.items.length === 1 ? 'line' : 'lines'}</span></div>}
    {(uncertain > 0 || onlyUncertain) && <div className="review-filters" aria-label="Items to review">
      <button aria-pressed={!onlyUncertain} onClick={() => setOnlyUncertain(false)}>All items ({receipt.items.length})</button>
      <button aria-pressed={onlyUncertain} onClick={() => setOnlyUncertain(true)}>Needs review ({uncertain})</button>
    </div>}
    {!receipt.items.length ? <EmptyReceipt onAdd={() => edit(null)} /> : <div className="review-items">
      <AnimatePresence initial={false}>
        {visibleItems.map(item => <motion.article className={`review-item receipt-paper ${item.confidence === 'check' ? 'needs-check' : ''}`} key={item.id} layout layoutId={`receipt-item-${item.id}`} initial={{ opacity: 0, y: reduced ? 0 : -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: reduced ? 1 : .96 }} transition={itemReflow}>
          <span className="receipt-item-index" aria-hidden="true">
            {String(receipt.items.indexOf(item) + 1).padStart(2, '0')}
          </span>
          <button className="review-item-main" onClick={() => edit(item)} aria-label={`Edit ${item.name}, ${formatMoney(item.amount, receipt.currency)}`}>
            <span className="review-item-name">
              {item.name}
              {item.quantity > 1 && <small>{item.quantity} UNITS · PRICE FOR ALL {item.quantity}</small>}
            </span>
            <NumberTicker value={item.amount} currency={receipt.currency} />
            <Pencil size={15} className="edit-hint" />
          </button>
          {item.confidence === 'check' && <div className="check-item-row">
            <span className="check-tag">CHECK THIS ONE</span>
            <button onClick={() => dispatch({ type: 'CONFIRM_ITEM', id: item.id })}>
              <Check size={14} />Looks right</button>
          </div>}
        </motion.article>)}
      </AnimatePresence>
      {onlyUncertain && !visibleItems.length && <div className="review-filter-empty"><Check size={22} /><strong>Marked items checked.</strong><Button variant="secondary" onClick={() => setOnlyUncertain(false)}>Show all items</Button></div>}
    </div>}
    {receipt.items.length > 0 && <Button className="add-item-button" variant="secondary" onClick={() => edit(null)}>
      <Plus size={18} />{scan.imageUrl ? 'Add missing item' : 'Add another item'}</Button>}
    {receipt.items.length > 0 && <>
      <div className="subtotal-row">
        <span>
          {receipt.items.length} items</span>
        <NumberTicker value={itemTotal(receipt)} currency={receipt.currency} />
      </div>
      <div className="printed-extras">
        <div className="section-label">
          <span>PRINTED EXTRAS</span>
          <Button size="small" variant="ghost" onClick={() => {
            setExtra(null);
            setExtraOpen(true);
          }}>
            <Plus size={16} />Add extra</Button>
        </div>
        {receipt.extras.map(fee => <button className="printed-extra-row" onClick={() => {
          setExtra(fee);
          setExtraOpen(true);
        }} key={fee.id}>
          <span>
            {fee.label}
            {fee.included && <small>INCLUDED · NOT ADDED AGAIN</small>}
          </span>
          <b>
            {formatMoney(fee.amount, receipt.currency)}
          </b>
          <Pencil size={14} />
        </button>)}
        {!receipt.extras.length && <p className="muted small">Add any tax, service charge, printed tip or discount. Leave this empty if the item prices are the whole bill.</p>}
      </div>
      <Reconciliation onEdit={() => setMetaOpen(true)} />
      {!receiptCheck.matched && <div className="reconcile-actions">
        <Button variant="secondary" onClick={() => setMetaOpen(true)}>Check printed total<Pencil size={15} />
        </Button>
        <Button variant="ghost" onClick={() => setConfirmOpen(true)}>Use the checked item sum<ArrowRight size={15} />
        </Button>
      </div>}
    </>}
    {!!receipt.warnings.length && <details className="quiet-details">
      <summary>Reading notes<ChevronDown size={15} />
      </summary>
      {receipt.warnings.map((warning, index) => <p key={index}>
        {warning}
      </p>)}
    </details>}
    <div className="review-secondary">
      <Button variant="ghost" onClick={() => dispatch({ type: 'GO', stage: 'capture' })}>
        <RotateCcw size={15} />Scan again</Button>
    </div>
    <BottomAction note={!receiptCheck.matched && receipt.items.length ? 'Check or confirm the total to keep going.' : undefined}>
      <Button size="large" disabled={!receipt.items.length || !receiptCheck.matched} onClick={() => dispatch({ type: 'GO', stage: 'people' })}>Looks good. Who’s in?<ArrowRight size={20} className="button-end" />
      </Button>
    </BottomAction>
    <ItemEditor open={itemOpen} onOpenChange={setItemOpen} item={editing} />
    <ReceiptEditor open={metaOpen} onOpenChange={setMetaOpen} />
    <ConfirmCalculatedTotal open={confirmOpen} onOpenChange={setConfirmOpen} />
    <ExtraEditor open={extraOpen} onOpenChange={setExtraOpen} extra={extra} />
    <Modal className="receipt-photo-modal" open={photoOpen} onOpenChange={setPhotoOpen} title="Check it against the photo." description="Your photo stays on this device. Zoom in to read the smaller print.">
      <div className="receipt-photo-toolbar"><span>{receipt.items.length} items · {receipt.total === undefined ? 'Total to check' : formatMoney(receipt.total, receipt.currency)}</span><Button variant="secondary" size="small" onClick={() => setPhotoZoomed(value => !value)}>{photoZoomed ? <ZoomOut size={17} /> : <ZoomIn size={17} />}{photoZoomed ? 'Fit photo' : 'Zoom in'}</Button></div>
      <div className={`receipt-photo-viewer ${photoZoomed ? 'is-zoomed' : ''}`} tabIndex={0} aria-label={photoZoomed ? 'Zoomed receipt photo. Scroll to explore.' : 'Receipt photo'}>
        {scan.imageUrl && <img src={scan.imageUrl} alt="Your locally held receipt" />}
      </div>
      <Button className="receipt-photo-done" onClick={() => setPhotoOpen(false)}><Check size={17} />Back to the items</Button>
    </Modal>
  </div>;
}
