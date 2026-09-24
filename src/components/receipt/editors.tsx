import { useEffect, useRef, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../app/context.tsx';
import type { Currency, ExtraKind, ReceiptExtra, ReceiptItem } from '../../types/index.ts';
import { currencies, currencySymbols, formatMoney, moneyInput, parseMoney, MAX_MONEY } from '../../lib/money.ts';
import { calculatedReceiptTotal } from '../../features/splitting/engine.ts';
import { uniqueId } from '../../lib/utils.ts';
import { Modal } from '../ui/modal.tsx';
import { Input } from '../ui/input.tsx';
import { Button } from '../ui/button.tsx';
import { Notice } from '../ui/common.tsx';
import '../../styles/review-polish.css';
export function ItemEditor({ open, onOpenChange, item }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ReceiptItem | null
 }) {

  const { state, dispatch, notify } = useApp();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState('');
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [lastAdded, setLastAdded] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  const amountInput = useRef<HTMLInputElement>(null);
  const quantityInput = useRef<HTMLInputElement>(null);
  const keepEditing = useRef<HTMLButtonElement>(null);

  const dirty = name !== (item?.name ?? '') || amount !== (item ? moneyInput(item.amount) : '') || quantity !== String(item?.quantity ?? 1);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '');
      setAmount(item ? moneyInput(item.amount) : '');
      setQuantity(String(item?.quantity ?? 1));
      setError('');
      setInvalidField('');
      setDiscardPrompt(false);
      setLastAdded('');
    }
  }, [open, item]);

  const save = (addAnother = false) => {
    const value = parseMoney(amount);
    const count = Number(quantity);

    if (!name.trim()) {
      setError('Give this item a name.');
      setInvalidField('name');
      nameInput.current?.focus();
      return;
    }

    if (value === null || value < 0) {
      setError('Enter a valid price, such as 12.00. Add discounts in Extras.');
      setInvalidField('amount');
      amountInput.current?.focus();
      return;
    }

    if (!Number.isInteger(count) || count < 1 || count > 99) {
      setError('Quantity needs to be a whole number from 1 to 99.');
      setInvalidField('quantity');
      quantityInput.current?.focus();
      return;
    }

    if (!item && state.receipt.items.length >= 500) {
      setError('This receipt already has 500 items. Edit an existing item to continue.');
      return;
    }

    const nextItem: ReceiptItem = { ...item, id: item?.id ?? uniqueId('item'), name, amount: value, quantity: count, confidence: 'good' };
    try {
      calculatedReceiptTotal({ ...state.receipt, items: item ? state.receipt.items.map(old => old.id === item.id ? nextItem : old) : [...state.receipt.items, nextItem] });
    } catch {
      setError(`The combined receipt is too large. Keep its amounts within ${formatMoney(MAX_MONEY, state.receipt.currency)}.`);
      setInvalidField('amount');
      amountInput.current?.focus();
      return;
    }
    dispatch({ type: 'SAVE_ITEM', item: nextItem });

    if (addAnother) {
      setLastAdded(`${name.trim()} added · ${formatMoney(value, state.receipt.currency)}`);
      setName('');
      setAmount('');
      setQuantity('1');
      setError('');
      setInvalidField('');
      nameInput.current?.focus();
    } else {
      onOpenChange(false);
      notify(item ? 'Item updated. Totals recalculated.' : 'Item added to the receipt.');
    }

  };

  return <Modal open={open} onOpenChange={next => {
    if (!next && dirty) {
      setDiscardPrompt(true);
      requestAnimationFrame(() => keepEditing.current?.focus());
    } else onOpenChange(next);
  }} onOpenAutoFocus={event => { event.preventDefault(); nameInput.current?.focus(); }} className="receipt-editor" title={item ? 'A little correction.' : 'Add an item.'} description={item ? 'Update the name or price to match your receipt.' : 'One line at a time. Add another without leaving this window.'}>
    {discardPrompt && <div className="draft-discard-notice" role="alert">
      <strong>Keep your unsaved changes?</strong>
      <p>This item has not been saved yet.</p>
      <div className="editor-choice-row">
        <Button ref={keepEditing} variant="secondary" onClick={() => setDiscardPrompt(false)}>Keep editing</Button>
        <Button variant="ghost" className="danger-text" onClick={() => onOpenChange(false)}>Discard changes</Button>
      </div>
    </div>}
    <form noValidate onSubmit={event => { event.preventDefault(); save(); }} className="form-stack">
      {lastAdded && <div className="item-added-feedback" role="status"><Check size={17} /><span>{lastAdded}</span></div>}
      <label className="field">Item name<Input ref={nameInput} value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); amountInput.current?.focus(); } }} placeholder="e.g. Truffle fries" maxLength={100} autoComplete="off" enterKeyHint="next" aria-invalid={invalidField === 'name'} aria-describedby={invalidField === 'name' ? 'item-editor-error' : undefined} required />
      </label>
      <div className="form-columns item-amount-fields">
        <label className="field">Quantity<Input ref={quantityInput} type="number" inputMode="numeric" value={quantity} onChange={event => setQuantity(event.target.value)} min="1" max="99" aria-invalid={invalidField === 'quantity'} aria-describedby={invalidField === 'quantity' ? 'item-editor-error item-quantity-hint' : 'item-quantity-hint'} required />
        </label>
        <label className="field">Line total ({state.receipt.currency})<Input ref={amountInput} value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" aria-invalid={invalidField === 'amount'} aria-describedby={invalidField === 'amount' ? 'item-editor-error item-quantity-hint' : 'item-quantity-hint'} required />
        </label>
      </div>
      <div className="quantity-explainer" id="item-quantity-hint"><strong>{Number(quantity) > 1 ? `The price for all ${quantity} together.` : 'Use the price printed at the end of the line.'}</strong><p>Two {currencySymbols[state.receipt.currency]}4 coffees → quantity 2, line total {currencySymbols[state.receipt.currency]}8. Quantity is a note; it doesn’t multiply the price.</p></div>
      {item?.sourceLine && <details className="quiet-details">
        <summary>Original receipt line</summary>
        <p className="mono break-word">
          {item.sourceLine}
        </p>
      </details>}
      {error && <div id="item-editor-error"><Notice title={error} kind="error" /></div>}
      <Button type="submit">
        <Check size={17} />
        {item ? 'Save correction' : 'Add item'}
      </Button>
      {!item && <Button variant="secondary" onClick={() => save(true)}><Plus size={17} />Add and add another</Button>}
      {item && <Button variant="ghost" className="danger-text" onClick={() => {
        dispatch({ type: 'DELETE_ITEM', id: item.id });
        onOpenChange(false);
        notify('Item removed. Check the new receipt total.');
      }}>
        <Trash2 size={17} />Remove this item</Button>}
    </form>
  </Modal>;
}
export function ReceiptEditor({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void
 }) {

  const { state, dispatch, receiptCheck, notify } = useApp();

  const [label, setLabel] = useState('');
  const [total, setTotal] = useState('');
  const [currency, setCurrency] = useState<Currency>('AUD');
  const [error, setError] = useState('');
  const previewTotal = total.trim() ? parseMoney(total) : null;
  const previewDifference = previewTotal === null ? null : receiptCheck.calculated - previewTotal;

  useEffect(() => {
    if (open) {
      setLabel(state.receipt.label);
      setTotal(state.receipt.total === undefined ? '' : moneyInput(state.receipt.total));
      setCurrency(state.receipt.currency);
      setError('');
    }
  }, [open, state.receipt]);

  return <Modal className="receipt-editor" open={open} onOpenChange={onOpenChange} title="Check the receipt." description="Copy the final amount printed on the receipt, including its charges.">
    <form className="form-stack" onSubmit={event => {
      event.preventDefault();
      const value = total.trim() ? parseMoney(total) : undefined;
      if (value === null || (value !== undefined && value < 0)) {
        setError('Enter a valid, non-negative total.');
        return;
      }
      dispatch({ type: 'RECEIPT_META', label, currency, total: value, clearTotal: value === undefined });
      onOpenChange(false);
      notify('Receipt details updated.');
    }}>
      <label className="field">Dinner or restaurant name<Input value={label} onChange={event => setLabel(event.target.value)} maxLength={64} placeholder="Dinner with friends" />
      </label>
      <div className="form-columns">
        <label className="field">Currency<select className="input" value={currency} onChange={event => setCurrency(event.target.value as Currency)}>
          {currencies.map(value => <option key={value} value={value}>
            {value} {currencySymbols[value]}
          </option>)}
        </select>
        </label>
        <label className="field">Printed receipt total<Input inputMode="decimal" value={total} onChange={event => setTotal(event.target.value)} placeholder="0.00" aria-describedby="receipt-total-hint" />
        </label>
      </div>
      <p className="field-hint" id="receipt-total-hint">Currency changes the label only; it doesn’t convert prices. If there’s no printed total, leave it empty and confirm your checked item sum.</p>
      <div className="form-summary">
        <span>Items + extras</span>
        <strong>
          {formatMoney(receiptCheck.calculated, currency)}
        </strong>
      </div>
      {previewDifference !== null && previewDifference !== 0 && previewTotal !== null && previewTotal >= 0 && <div className="receipt-total-difference"><strong>{formatMoney(Math.abs(previewDifference), currency)} to resolve</strong><span>Your items and extras are {previewDifference > 0 ? 'higher' : 'lower'} than this total. Save it, then check the item prices and printed extras.</span></div>}
      {previewDifference === 0 && <div className="item-added-feedback"><Check size={17} />This matches your items and extras.</div>}
      {state.receipt.originalTotal !== undefined && <p className="field-hint">Originally read as {formatMoney(state.receipt.originalTotal, currency)}. Changing the reference total doesn’t change any item prices.</p>}
      {error && <Notice title={error} kind="error" />}
      <Button type="submit">Save receipt details</Button>
    </form>
  </Modal>;
}
export function ConfirmCalculatedTotal({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void
 }) {

  const { state, dispatch, receiptCheck, notify } = useApp();

  return <Modal className="receipt-editor" open={open} onOpenChange={onOpenChange} title={`Use ${formatMoney(receiptCheck.calculated, state.receipt.currency)}?`} description="Confirm that you’ve checked every item and printed extra. This sets the total you’ll split.">
    <div className="form-stack">
      <div className="total-confirmation-comparison">
        {receiptCheck.expected !== undefined && <div><span>Current receipt total</span><strong>{formatMoney(receiptCheck.expected, state.receipt.currency)}</strong></div>}
        <div><span>Your checked items + extras</span><strong>{formatMoney(receiptCheck.calculated, state.receipt.currency)}</strong></div>
      </div>
      <p className="field-hint">Item prices and extras stay exactly as entered. Included tax is already part of the prices.</p>
      <Button disabled={receiptCheck.calculated < 0} onClick={() => {
        dispatch({ type: 'CONFIRM_TOTAL', total: receiptCheck.calculated });
        onOpenChange(false);
        notify('Calculated total confirmed.');
      }}>
        <Check size={17} />Yes, that’s the receipt total</Button>
      <Button variant="ghost" onClick={() => onOpenChange(false)}>Go back and check</Button>
    </div>
  </Modal>;
}
export const extraLabels: Record<ExtraKind, string> = { tax: 'Tax', service: 'Service charge', surcharge: 'Surcharge', discount: 'Discount', tip: 'Printed tip', adjustment: 'Rounding adjustment' };
export function ExtraEditor({ open, onOpenChange, extra, initialKind = 'tax' }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extra: ReceiptExtra | null;
  initialKind?: ExtraKind
 }) {

  const { state, dispatch, notify } = useApp();

  const [kind, setKind] = useState<ExtraKind>(initialKind);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [included, setIncluded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setKind(extra?.kind ?? initialKind);
      setLabel(extra?.label ?? extraLabels[initialKind]);
      setAmount(extra ? moneyInput(extra.kind === 'adjustment' ? extra.amount : Math.abs(extra.amount)) : '');
      setIncluded(extra?.included ?? false);
      setError('');
    }
  }, [extra, initialKind, open]);

  return <Modal className="receipt-editor" open={open} onOpenChange={onOpenChange} title={extra ? 'Adjust an extra.' : 'Add an extra.'} description="Add only charges or discounts already printed on this receipt.">
    <form className="form-stack" onSubmit={event => {
      event.preventDefault();
      const parsed = parseMoney(amount);
      if (parsed === null || (kind !== 'adjustment' && parsed < 0)) {
        setError('Enter a valid amount. For discounts, enter the amount to take off.');
        return;
      }
      const nextExtra: ReceiptExtra = { id: extra?.id ?? uniqueId('extra'), kind, label: label.trim() || extraLabels[kind], amount: kind === 'discount' ? -Math.abs(parsed) : parsed, included: kind === 'discount' ? false : included };
      try {
        calculatedReceiptTotal({ ...state.receipt, extras: extra ? state.receipt.extras.map(old => old.id === extra.id ? nextExtra : old) : [...state.receipt.extras, nextExtra] });
      } catch {
        setError(`The combined receipt is too large. Keep its amounts within ${formatMoney(MAX_MONEY, state.receipt.currency)}.`);
        return;
      }
      dispatch({ type: 'SAVE_EXTRA', extra: nextExtra });
      onOpenChange(false);
      notify('Extra updated. Every share recalculated.');
    }}>
      <label className="field">Type<select className="input" value={kind} onChange={event => {
        const value = event.target.value as ExtraKind;
        setKind(value);
        setLabel(extraLabels[value]);
        setIncluded(false);
      }}>
        {Object.entries(extraLabels).map(([value, label]) => <option value={value} key={value}>
          {label}
        </option>)}
      </select>
      </label>
      <label className="field">Label<Input value={label} onChange={event => setLabel(event.target.value)} maxLength={64} />
      </label>
      <label className="field">
        {kind === 'discount' ? `Amount to take off (${state.receipt.currency})` : `Amount (${state.receipt.currency})`}
        <Input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" required />
      </label>
      {kind === 'discount' && <p className="field-hint">Enter a positive amount. We’ll subtract it from the bill.</p>}
      {kind === 'tip' && <p className="field-hint">Use this for a tip already on the receipt. You can choose an additional tip later.</p>}
      {kind !== 'discount' && <label className="checkbox-row">
        <input type="checkbox" checked={included} onChange={event => setIncluded(event.target.checked)} />
        <span>Already included in the item prices<small>Show it for reference. Don’t add it again.</small>
        </span>
      </label>}
      {error && <Notice title={error} kind="error" />}
      <Button type="submit">Save extra</Button>
      {extra && <Button variant="ghost" className="danger-text" onClick={() => {
        dispatch({ type: 'DELETE_EXTRA', id: extra.id });
        onOpenChange(false);
        notify('Extra removed.');
      }}>
        <Trash2 size={17} />Remove extra</Button>}
    </form>
  </Modal>;
}
