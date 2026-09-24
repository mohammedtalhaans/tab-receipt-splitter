import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Pencil, Users, Search, X, ArrowRight } from 'lucide-react';
import type { ReceiptItem } from '../../types/index.ts';
import { useApp } from '../../app/context.tsx';
import { Avatar } from '../ui/common.tsx';
import { NumberTicker } from '../magic/number-ticker.tsx';
import { formatMoney } from '../../lib/money.ts';
import { allocate } from '../../features/splitting/allocate.ts';
import { itemReflow, snappySpring } from '../../lib/motion.ts';
import { Modal } from '../ui/modal.tsx';
import { Input } from '../ui/input.tsx';
import { Button } from '../ui/button.tsx';
interface Pulse {
  id: number;
  x: number;
  y: number;
  toX: number;
  toY: number;
  tone: number
 }
export function AssignmentCard({ item, index, onEdit }: {
  item: ReceiptItem;
  index: number;
  onEdit: () => void
 }) {

  const { state, dispatch } = useApp();
  const reduced = useReducedMotion();
  const card = useRef<HTMLElement>(null);
  const amount = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const personSearchInput = useRef<HTMLInputElement>(null);

  const assigned = state.assignments[item.id] ?? [];
  const everyone = assigned.length === state.participants.length;
  const largeTable = state.participants.length > 7;
  const selectedPeople = state.participants.filter(person => assigned.includes(person.id));
  const matchingPeople = state.participants.filter(person => person.name.toLocaleLowerCase().includes(personSearch.trim().toLocaleLowerCase()));

  const portions = assigned.length ? allocate(item.amount, Array.from({ length: assigned.length }, () => 1)) : [];

  const min = portions.length ? Math.min(...portions) : 0;
  const max = portions.length ? Math.max(...portions) : 0;
  const portionLabel = assigned.length === 1 ? selectedPeople[0]?.name : min === max ? `${formatMoney(min, state.receipt.currency)} each` : `${formatMoney(min, state.receipt.currency)}–${formatMoney(max, state.receipt.currency)} each`;

  function clearSelection() {
    for (const personId of assigned) dispatch({ type: 'TOGGLE_ASSIGNMENT', itemId: item.id, personId });
  }

  function shareEveryone() {
    if (everyone) clearSelection();
    else dispatch({ type: 'ASSIGN_EVERYONE', itemId: item.id });
  }

  function toggle(event: React.MouseEvent<HTMLButtonElement>, personId: string, tone: number) {

    if (!assigned.includes(personId) && !reduced && card.current && amount.current) {

      const frame = card.current.getBoundingClientRect();
      const target = amount.current.getBoundingClientRect();
      const start = event.currentTarget.getBoundingClientRect();
      const pulse = { id: ++sequence.current, x: start.left + start.width / 2 - frame.left, y: start.top + start.height / 2 - frame.top, toX: target.right - frame.left - 12, toY: target.top + target.height / 2 - frame.top, tone };

      setPulses(old => [...old.slice(-6), pulse]);

    }

    dispatch({ type: 'TOGGLE_ASSIGNMENT', itemId: item.id, personId });

  }

  return <motion.article ref={card} className={`assignment-card ${largeTable ? 'large-table' : ''} ${assigned.length ? 'assigned' : 'unassigned'}`} data-item-id={item.id} data-unassigned={!assigned.length} aria-labelledby={`assignment-title-${item.id}`} layout transition={itemReflow}>
    <div className="assignment-card-top">
      <div className="assignment-item-label">
        <span className="assignment-index">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <h2 id={`assignment-title-${item.id}`} tabIndex={-1}>
            {item.name}
          </h2>
          <span className="assignment-card-state">
            {assigned.length ? <>
              <Check size={11} />
              {assigned.length === 1 ? 'CLAIMED' : `SHARED BY ${assigned.length}`}
            </> : 'WHO HAD THIS?'}
            {item.quantity > 1 && ` · QTY ${item.quantity} · LINE TOTAL`}
          </span>
        </div>
      </div>
      <div className="assignment-amount" ref={amount}>
        <NumberTicker value={item.amount} currency={state.receipt.currency} />
        <button onClick={onEdit} aria-label={`Edit ${item.name}`} className="assignment-edit">
          <Pencil size={13} />
        </button>
      </div>
    </div>
    <div className="assignment-chips" role="group" aria-label={`Who ordered ${item.name}?`}>
      {largeTable ? <button className="choose-people-button" onClick={() => { setPersonSearch(''); setPickerOpen(true); }} aria-label={`Choose people for ${item.name}`}><Users size={17} /><span>{assigned.length ? `Edit ${assigned.length} ${assigned.length === 1 ? 'person' : 'people'}` : 'Choose people'}</span><ArrowRight size={16} /></button> : state.participants.map(person => <motion.button key={person.id} className={`assign-chip ${assigned.includes(person.id) ? 'selected' : ''}`} data-tone={person.tone} aria-pressed={assigned.includes(person.id)} onClick={event => toggle(event, person.id, person.tone)} whileTap={reduced ? undefined : { scale: .94 }} transition={snappySpring}>
        <Avatar person={person} size="small" />
        <span>
          {person.name}
        </span>
        {assigned.includes(person.id) && <motion.span initial={{ scale: reduced ? 1 : .5 }} animate={{ scale: 1 }} transition={snappySpring}>
          <Check size={12} />
        </motion.span>}
      </motion.button>)}
      <button className={`everyone-chip ${everyone ? 'selected' : ''}`} aria-pressed={everyone} onClick={shareEveryone} aria-label={`Share ${item.name} with everyone`}>
        <Users size={14} />
        <span>Everyone</span>
        {everyone && <Check size={12} />}
      </button>
    </div>
    {largeTable && assigned.length > 0 && <p className="assignment-selected-names" title={selectedPeople.map(person => person.name).join(', ')}>{everyone ? 'The whole table' : <>{selectedPeople.slice(0, 3).map(person => person.name).join(', ')}{selectedPeople.length > 3 && ` + ${selectedPeople.length - 3} more`}</>}</p>}
    <AnimatePresence initial={false}>
      {assigned.length > 0 && <motion.div key="portion" className="assignment-portion" initial={{ height: reduced ? 'auto' : 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: reduced ? 'auto' : 0, opacity: 0 }} transition={{ duration: reduced ? .1 : .18 }}>
        <div className="assignment-dots" aria-hidden="true">
          {state.participants.filter(person => assigned.includes(person.id)).map(person => <motion.span layout key={person.id} data-tone={person.tone} initial={{ scale: .5 }} animate={{ scale: 1 }} />)}
        </div>
        <span>
          {portionLabel}
        </span>
        {min !== max && <span className="odd-cent-label">CENTS KEPT EXACT</span>}
        <button className="assignment-clear" onClick={clearSelection} aria-label={`Clear people from ${item.name}`}>Clear</button>
      </motion.div>}
    </AnimatePresence>
    {largeTable && <Modal open={pickerOpen} onOpenChange={setPickerOpen} title={`Who had ${item.name}?`} description="Choose everyone who shared this item. Tap a selected name to remove it." className="assignment-picker">
      <div className="picker-item-total"><span>ITEM TOTAL{item.quantity > 1 ? ` · QTY ${item.quantity}` : ''}</span><strong>{formatMoney(item.amount, state.receipt.currency)}</strong></div>
      <div className="assignment-search">
        <Search size={18} aria-hidden="true" />
        <Input ref={personSearchInput} type="search" placeholder="Find a person…" aria-label="Find a person" value={personSearch} onChange={event => setPersonSearch(event.target.value)} />
        {personSearch && <button aria-label="Clear person search" onClick={() => { setPersonSearch(''); personSearchInput.current?.focus(); }}><X size={17} /></button>}
      </div>
      <div className="picker-quick-actions"><button aria-pressed={everyone} onClick={shareEveryone}><Users size={16} />{everyone ? 'Remove everyone' : `Everyone (${state.participants.length})`}</button><button onClick={clearSelection} disabled={!assigned.length}>Clear selection</button></div>
      <div className="picker-people" role="group" aria-label={`People sharing ${item.name}`}>
        {matchingPeople.map(person => <button key={person.id} className={`picker-person ${assigned.includes(person.id) ? 'selected' : ''}`} data-tone={person.tone} aria-pressed={assigned.includes(person.id)} aria-label={person.name} onClick={() => dispatch({ type: 'TOGGLE_ASSIGNMENT', itemId: item.id, personId: person.id })}>
          <Avatar person={person} size="small" /><span>{person.name}</span><span className="picker-person-share">{assigned.includes(person.id) ? formatMoney(portions[selectedPeople.findIndex(selected => selected.id === person.id)] ?? 0, state.receipt.currency) : ''}</span><span className="picker-check" aria-hidden="true">{assigned.includes(person.id) && <Check size={14} />}</span>
        </button>)}
      </div>
      {!matchingPeople.length && <p className="picker-no-results" role="status">No one by that name. Clear the search to see your table.</p>}
      <div className="picker-footer"><p role="status" aria-live="polite">{assigned.length ? `${assigned.length} ${assigned.length === 1 ? 'person' : 'people'} selected${assigned.length > 1 ? ` · ${portionLabel}` : ''}` : 'No one selected yet.'}</p><Button size="large" onClick={() => setPickerOpen(false)} aria-label="Done choosing people">Done<Check size={18} /></Button></div>
    </Modal>}
    {pulses.map(pulse => <motion.span key={pulse.id} className="allocation-pulse" data-tone={pulse.tone} aria-hidden="true" initial={{ x: pulse.x, y: pulse.y, scale: .5, opacity: 1 }} animate={{ x: [pulse.x, (pulse.x + pulse.toX) / 2, pulse.toX], y: [pulse.y, pulse.y - 35, pulse.toY], scale: [.5, 1.6, .25], opacity: [1, 1, 0] }} transition={{ duration: .36, ease: [.22, 1, .36, 1] }} onAnimationComplete={() => setPulses(old => old.filter(value => value.id !== pulse.id))} />)}
  </motion.article>;
}
