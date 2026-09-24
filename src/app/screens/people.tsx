import { useState, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Plus, X, Pencil, Users, Undo2, UserPlus } from 'lucide-react';
import { useApp } from '../context.tsx';
import type { Participant } from '../../types/index.ts';
import { PageHeading, BottomAction, Avatar, Notice } from '../../components/ui/common.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { Modal } from '../../components/ui/modal.tsx';
import { config } from '../../lib/config.ts';
import { uniqueId, personTone } from '../../lib/utils.ts';
import { snappySpring } from '../../lib/motion.ts';
import '../../styles/assignment-polish.css';
export default function People() {

  const { state, dispatch, notify } = useApp();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Participant | null>(null);
  const [newName, setNewName] = useState('');
  const [removed, setRemoved] = useState<{ person: Participant; index: number; itemIds: string[] } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const isFull = state.participants.length >= config.maxPeople;
  const undoIssue = removed && (isFull ? 'Remove a name to make room before undoing.' : state.participants.some(person => person.name.toLocaleLowerCase() === removed.person.name.toLocaleLowerCase()) ? `Rename the new ${removed.person.name} before undoing.` : '');

  const validName = (value: string, exceptId?: string) => {
    if (!value.trim()) return 'A first name or nickname will do.';
    if (state.participants.some(person => person.id !== exceptId && person.name.toLocaleLowerCase() === value.trim().toLocaleLowerCase())) return 'That name is already here. Try a nickname so you can tell them apart.';
    return '';
  };

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (isFull) return;
    const issue = validName(name);
    if (issue) {
      setError(issue);
      return;
    }
    dispatch({ type: 'ADD_PERSON', person: { id: uniqueId('person'), name: name.trim(), tone: personTone(name) } });
    setName('');
    setError('');
    input.current?.focus();
  }

  function remove(person: Participant, index: number) {
    const itemIds = state.receipt.items.filter(item => state.assignments[item.id]?.includes(person.id)).map(item => item.id);
    setRemoved({ person, index, itemIds });
    dispatch({ type: 'REMOVE_PERSON', id: person.id });
    setError('');
    requestAnimationFrame(() => undoButton.current?.focus());
  }

  function undoRemove() {
    if (!removed || undoIssue) return;
    dispatch({ type: 'RESTORE_PERSON', ...removed });
    const personId = removed.person.id;
    notify(`${removed.person.name} restored with their item selections.`);
    setRemoved(null);
    requestAnimationFrame(() => document.getElementById(`rename-${personId}`)?.focus());
  }

  function rename(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const issue = validName(newName, editing.id);
    if (issue) {
      setError(issue);
      return;
    }
    dispatch({ type: 'RENAME_PERSON', id: editing.id, name: newName });
    setEditing(null);
    setError('');
  }

  return <div className="people-screen">
    <PageHeading eyebrow="03 / GOOD COMPANY" title={<>Who’s at<br />the table?</>}>First names. Nicknames. Your favourite people.</PageHeading>
    <form className="people-form" onSubmit={add}>
      <label className="sr-only" htmlFor="person-name">Person’s name</label>
      <Input ref={input} id="person-name" placeholder="Add a name…" value={name} onChange={event => {
        setName(event.target.value);
        setError('');
      }} autoComplete="off" maxLength={32} enterKeyHint="done" aria-invalid={!!error && !editing} aria-describedby={error && !editing ? 'person-name-error' : 'people-entry-hint'} disabled={isFull} />
      <Button type="submit" size="icon" aria-label="Add person" disabled={isFull}>
        <Plus size={22} />
      </Button>
    </form>
    <div className="people-entry-help">
      <p id="people-entry-hint">{isFull ? 'Full house. This table has room for 20 people.' : 'Press Enter to add a name. Up to 20 people.'}</p>
      {!state.participants.some(person => person.name.toLocaleLowerCase() === 'you') && !isFull && <Button variant="ghost" size="small" onClick={() => {
        dispatch({ type: 'ADD_PERSON', person: { id: uniqueId('person'), name: 'You', tone: personTone('You') } });
        setError('');
        input.current?.focus();
      }}><UserPlus size={15} />Add yourself</Button>}
    </div>
    {error && !editing && <div id="person-name-error"><Notice kind="error" title={error} /></div>}
    {removed && <div className="people-undo" role="status">
      <div><strong>{removed.person.name} removed.</strong><p>{undoIssue || (removed.itemIds.length ? `${removed.itemIds.length} item ${removed.itemIds.length === 1 ? 'selection' : 'selections'} can be restored.` : 'Changed your mind? Bring them back.')}</p></div>
      <Button ref={undoButton} variant="secondary" size="small" onClick={undoRemove} disabled={!!undoIssue} aria-label={`Undo removal of ${removed.person.name}`}><Undo2 size={16} />Undo</Button>
    </div>}
    <div className="table-panel">
      <div className="table-panel-top">
        <span className="mono">TABLE FOR</span>
        <motion.span key={state.participants.length} initial={{ scale: reduced ? 1 : .8 }} animate={{ scale: 1 }} transition={snappySpring}>
          {String(state.participants.length).padStart(2, '0')}
        </motion.span>
        <Users size={19} />
      </div>
      <div className="people-rail">
        <AnimatePresence initial={false}>
          {state.participants.map((person, index) => <motion.div className="person-pill" key={person.id} layout initial={{ opacity: 0, scale: reduced ? 1 : .6, y: reduced ? 0 : 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: reduced ? 1 : .7 }} transition={snappySpring} data-tone={person.tone}>
            <button id={`rename-${person.id}`} className="person-pill-main" onClick={() => {
              setEditing(person);
              setNewName(person.name);
              setError('');
            }} aria-label={`Rename ${person.name}`}>
              <Avatar person={person} />
              <span>
                {person.name}
              </span>
              <Pencil size={13} />
            </button>
            <button className="person-remove" aria-label={`Remove ${person.name}`} onClick={() => remove(person, index)}>
              <X size={15} />
            </button>
          </motion.div>)}
        </AnimatePresence>
        {!state.participants.length && <div className="people-empty">
          <div className="empty-seat" />
          <div className="empty-seat" />
          <div className="empty-seat" />
          <p>Save a seat.<br />
            <span>Your people will appear here.</span>
          </p>
        </div>}
      </div>
      <div className="table-panel-bottom">
        <span className="tiny-cross">+</span>
        {state.participants.length ? 'Tap a name to edit it. No accounts or invites needed.' : 'No accounts. No invites. Just names.'}
      </div>
    </div>
    {state.demo && <p className="muted small center">Meet the sample table. Change any name, or add your own.</p>}
    <BottomAction note={state.participants.length >= config.maxPeople ? 'This table has room for up to 20 people.' : 'You can come back and add someone.'}>
      <Button size="large" disabled={!state.participants.length} onClick={() => dispatch({ type: 'GO', stage: 'assign' })}>That’s everyone<ArrowRight size={20} className="button-end" />
      </Button>
    </BottomAction>
    <Modal open={!!editing} onOpenChange={open => {
      if (!open) {
        setEditing(null);
        setError('');
      }
    }} title="A name for the table." description="Changing a name keeps their item assignments.">
      <form className="form-stack" onSubmit={rename}>
        <label className="field">Name<Input value={newName} onChange={event => {
          setNewName(event.target.value);
          setError('');
        }} maxLength={32} autoComplete="off" aria-invalid={!!error} aria-describedby={error ? 'person-rename-error' : undefined} />
        </label>
        {error && <div id="person-rename-error"><Notice kind="error" title={error} /></div>}
        <Button size="large" type="submit">Save name<ArrowRight size={18} />
        </Button>
      </form>
    </Modal>
  </div>;
}
