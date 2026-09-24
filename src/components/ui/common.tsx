import type { ReactNode } from 'react';
import { ArrowUpRight, Check, Github, Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import { motion, useReducedMotion, useIsPresent } from 'motion/react';
import { createPortal } from 'react-dom';
import { useApp } from '../../app/context.tsx';
import { config } from '../../lib/config.ts';
import { initials } from '../../lib/utils.ts';
import type { Participant } from '../../types/index.ts';
import { Button } from './button.tsx';
export function Brand({ compact = false }: {
  compact?: boolean
 }) {
  return <span className={`brand ${compact ? 'compact' : ''}`}>
    <span className="brand-icon" aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <path d="M9 5h14v24l-3.5-2-3.5 2-3.5-2L9 29V5Z" fill="currentColor" />
        <path d="M13 11h6m-6 5h6m-6 5h3" stroke="var(--thermal)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
    <span>{config.brand}<span className="brand-period">.</span>
    </span>
  </span>;
}
export function SourceLink({ label = 'View source', className = '' }: {
  label?: string;
  className?: string
 }) {

  const { setAboutOpen } = useApp();

  return config.repositoryUrl ? <a className={`source-link ${className}`} href={config.repositoryUrl} target="_blank" rel="noopener noreferrer">
    <Github size={17} />
    <span>
      {label}
    </span>
    <ArrowUpRight size={15} />
  </a> : <button className={`source-link ${className}`} onClick={() => setAboutOpen(true)}>
    <Info size={17} />
    <span>
      About {config.brand}
    </span>
    <ArrowUpRight size={15} />
  </button>;
}
export function PageHeading({ eyebrow, title, children, action }: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode
 }) {
  return <header className="page-heading">
    {eyebrow && <div className="eyebrow">
      {eyebrow}
    </div>}
    <div className="heading-row">
      <h1 tabIndex={-1} data-stage-heading>
        {title}
      </h1>
      {action}
    </div>
    {children && <p className="page-description">
      {children}
    </p>}
  </header>;
}
export function BottomAction({ children, note }: {
  children: ReactNode;
  note?: ReactNode
 }) {
  const present = useIsPresent();
  const host = document.getElementById("action-root") ?? document.body;
  return present ? createPortal(<div className="bottom-action">
    {note && <div className="action-note">
      {note}
    </div>}
    <div className="bottom-action-inner">
      {children}
    </div>
  </div>, host) : null;
}
export function PrivacyLine({ short = false }: {
  short?: boolean
 }) {
  const { setAboutOpen } = useApp();
  return <button className="privacy-line" onClick={() => setAboutOpen(true)}>
    <ShieldCheck size={15} />
    <span>
      {short ? 'On your device. Off the cloud.' : 'Receipt photos are processed on your device.'}
    </span>
  </button>;
}
export function Avatar({ person, size = 'normal' }: {
  person: Participant;
  size?: 'normal' | 'small' | 'large'
 }) {
  return <span className={`avatar avatar-${size}`} data-tone={person.tone} aria-hidden="true">
    {initials(person.name)}
  </span>;
}
export function Notice({ title, children, kind = 'info', action }: {
  title: string;
  children?: ReactNode;
  kind?: 'info' | 'warning' | 'error' | 'success';
  action?: ReactNode
 }) {

  const Icon = kind === 'success' ? Check : kind === 'error' || kind === 'warning' ? TriangleAlert : Info;

  return <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : undefined}>
    <Icon size={19} />
    <div>
      <strong>
        {title}
      </strong>
      {children && <div className="notice-body">
        {children}
      </div>}
      {action}
    </div>
  </div>;
}
export function EmptyReceipt({ onAdd }: {
  onAdd: () => void
 }) {

  const reduced = useReducedMotion();

  return <motion.div className="paper empty-receipt" initial={{ y: reduced ? 0 : 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
    <div className="eyebrow">YOUR TABLE STARTS HERE</div>
    <div className="empty-lines" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
    <h2>Start with the first bite.</h2>
    <p>Add the items and their line totals.<br />We’ll take care of the maths.</p>
    <Button variant="paper" onClick={onAdd}>Add your first item</Button>
  </motion.div>;
}
