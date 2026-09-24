import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Users, Plus, Search, X, RefreshCw, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../context.tsx';
import type { ReceiptItem } from '../../types/index.ts';
import { PageHeading, BottomAction, Avatar, Notice } from '../../components/ui/common.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Progress } from '../../components/ui/progress.tsx';
import { Modal } from '../../components/ui/modal.tsx';
import { NumberTicker } from '../../components/magic/number-ticker.tsx';
import { AssignmentCard } from '../../components/assignment/assignment-card.tsx';
import { ItemEditor } from '../../components/receipt/editors.tsx';
import { Input } from '../../components/ui/input.tsx';
import '../../styles/assignment-polish.css';
export default function Assign() {

  const { state, dispatch, assigned, runningTotals, receiptCheck } = useApp();
  const reduced = useReducedMotion();
  const [item, setItem] = useState<ReceiptItem | null>(null);
  const [remainingOpen, setRemainingOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Snapshot the work queue. A first claim must not make a dish disappear while
  // someone is still adding its other sharers. Refresh is always explicit.
  const [queue, setQueue] = useState<string[] | null>(null);
  const [focusItem, setFocusItem] = useState<string | null>(null);
  const lastItem = useRef<string | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const remaining = state.receipt.items.length - assigned;
  const pendingItems = state.receipt.items.filter(receiptItem => !state.assignments[receiptItem.id]?.length);
  const search = query.trim().toLocaleLowerCase();
  const visibleItems = state.receipt.items.map((receiptItem, index) => ({ receiptItem, index })).filter(({ receiptItem }) => (!queue || queue.includes(receiptItem.id)) && (!search || receiptItem.name.toLocaleLowerCase().includes(search)));
  const queueHasClaimed = queue?.some(id => state.assignments[id]?.length);

  useEffect(() => {
    if (!focusItem) return;
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById(`assignment-title-${focusItem}`);
      heading?.focus({ preventScroll: true });
      heading?.closest('article')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
      setFocusItem(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusItem, reduced]);

  const nextUnassigned = () => {
    const lastIndex = state.receipt.items.findIndex(receiptItem => receiptItem.id === lastItem.current);
    const next = pendingItems.find(receiptItem => state.receipt.items.indexOf(receiptItem) > lastIndex) ?? pendingItems[0];
    if (!next) return;
    setQuery('');
    if (queue) setQueue(pendingItems.map(receiptItem => receiptItem.id));
    lastItem.current = next.id;
    setFocusItem(next.id);
  };

  return <div className="assign-screen">
    <PageHeading eyebrow="04 / CLAIM THE GOOD STUFF" title={<>Who had<br />
      <span className="accent">what?</span>
    </>}>{state.participants.length > 7 ? 'Choose who had each dish. Shared plates can have a few names.' : 'Tap a name. Sharing? Tap a few.'}</PageHeading>
    <div className="assignment-dashboard">
    <div className="running-rail-wrap">
      <div className="section-label">
        <span>THE TABLE · BEFORE EXTRAS</span>
        <button className="assignment-people-link" onClick={() => dispatch({ type: 'GO', stage: 'people' })}>
          <Plus size={14} />People</button>
      </div>
      <div className="running-rail" tabIndex={0} aria-label="Each person’s assigned item subtotal">
        {state.participants.map((person, index) => <motion.div key={person.id} className="running-person" layout>
          <Avatar person={person} size="small" />
          <div>
            <span>
              {person.name}
            </span>
            <NumberTicker value={runningTotals[index] ?? 0} currency={state.receipt.currency} />
          </div>
        </motion.div>)}
      </div>
    </div>
    <div className="assignment-progress">
      <div>
        <strong aria-live="polite" aria-atomic="true">
          {assigned}
          <span> / {state.receipt.items.length} items assigned</span>
        </strong>
        {remaining ? <button onClick={nextUnassigned}>Find next<ChevronDown size={14} />
        </button> : <span className="success-text">All claimed.</span>}
      </div>
      <Progress value={assigned / state.receipt.items.length} label={`${assigned} of ${state.receipt.items.length} items assigned`} />
    </div>
    </div>
    <div className="assignment-tools">
      <div className="assignment-search">
        <Search size={18} aria-hidden="true" />
        <Input ref={searchInput} type="search" aria-label="Find an item" placeholder="Find an item…" value={query} onChange={event => setQuery(event.target.value)} />
        {query && <button aria-label="Clear item search" onClick={() => { setQuery(''); searchInput.current?.focus(); }}><X size={17} /></button>}
      </div>
      <div className="assignment-filter-row" role="group" aria-label="Items to show">
        <button aria-pressed={queue === null} onClick={() => setQueue(null)}>All items <span>{state.receipt.items.length}</span></button>
        <button aria-pressed={queue !== null} onClick={() => setQueue(pendingItems.map(receiptItem => receiptItem.id))}>To claim <span>{remaining}</span></button>
      </div>
      {queue !== null && <div className="assignment-queue-note">
        <p>Items stay here while you choose their sharers.</p>
        {queueHasClaimed && <button onClick={() => setQueue(pendingItems.map(receiptItem => receiptItem.id))}><RefreshCw size={14} />Refresh list</button>}
      </div>}
      {query && <p className="assignment-search-status" role="status">{visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'} found{queue ? ' in your claim list' : ''}.</p>}
    </div>
    {!receiptCheck.matched && <Notice kind="warning" title="An item changed the receipt total." action={<Button variant="secondary" onClick={() => dispatch({ type: 'GO', stage: 'review' })}>Check the total<ArrowRight size={16} />
    </Button>}>Your assignments are safe. Check the updated total before continuing.</Notice>}
    <div className="assignment-list" onFocusCapture={event => {
      const card = (event.target as HTMLElement).closest<HTMLElement>('[data-item-id]');
      if (card?.dataset.itemId) lastItem.current = card.dataset.itemId;
    }}>
      {visibleItems.map(({ receiptItem, index }) => <AssignmentCard key={receiptItem.id} item={receiptItem} index={index} onEdit={() => setItem(receiptItem)} />)}
    </div>
    {!visibleItems.length && <div className="assignment-empty">
      {search ? <Search size={24} /> : <Check size={26} />}
      <h2>{search ? 'No dish by that name.' : remaining ? 'This list is all claimed.' : 'Every dish has a name.'}</h2>
      <p>{search ? 'Try a shorter name, or clear your search to see the receipt.' : 'You can review any item and change its sharers.'}</p>
      <Button variant="secondary" onClick={() => { setQuery(''); setQueue(null); searchInput.current?.focus(); }}>{search ? 'Clear filters' : 'Show all items'}</Button>
    </div>}
    {remaining > 0 && <Button variant="ghost" className="fill" onClick={() => setRemainingOpen(true)}>
      <Users size={16} />Share all {remaining} remaining items</Button>}
    <BottomAction note={remaining ? `${remaining} ${remaining === 1 ? 'item still needs' : 'items still need'} a name.` : 'Every item claimed. Every cent kept.'}>
      <Button size="large" disabled={remaining > 0 || !receiptCheck.matched} onClick={() => dispatch({ type: 'GO', stage: 'extras' })}>On to the finishing touches<ArrowRight size={20} className="button-end" />
      </Button>
    </BottomAction>
    <ItemEditor open={!!item} onOpenChange={open => {
      if (!open) setItem(null);
    }} item={item} />
    <Modal open={remainingOpen} onOpenChange={setRemainingOpen} title={`Share ${remaining} remaining ${remaining === 1 ? 'item' : 'items'}?`} description="This assigns only the unclaimed items to everyone. Your other choices stay exactly as they are.">
      <Button size="large" onClick={() => {
        dispatch({ type: 'ASSIGN_REMAINING' });
        setRemainingOpen(false);
      }}>Yes, these are for the table<Users size={18} />
      </Button>
      <Button variant="ghost" className="fill" onClick={() => setRemainingOpen(false)}>Keep assigning individually</Button>
    </Modal>
  </div>;
}
