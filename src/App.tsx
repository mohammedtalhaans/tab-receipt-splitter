import { Component, forwardRef, useEffect, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, motion, MotionConfig, useIsPresent, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Github, Info, LockKeyhole, ScanLine, ShieldCheck, RotateCcw, Heart } from 'lucide-react';
import { AppProvider, useApp } from './app/context.tsx';
import { canEnter } from './app/state.ts';
import type { AppStage } from './types/index.ts';
import { Brand } from './components/ui/common.tsx';
import { Button } from './components/ui/button.tsx';
import { Modal } from './components/ui/modal.tsx';
import { Confirm as ConfirmDialog } from './components/ui/confirm.tsx';
import { Hint } from './components/ui/tooltip.tsx';
import { Separator } from './components/ui/separator.tsx';
import { usePageVisibility } from './hooks/use-page-visibility.ts';
import { useFlowNavigation } from './hooks/use-flow-navigation.ts';
import { config } from './lib/config.ts';
import { screenTransition } from './lib/motion.ts';
import Home from './app/screens/home.tsx';
import Capture from './app/screens/capture.tsx';
import Processing from './app/screens/processing.tsx';
import Review from './app/screens/review.tsx';
import People from './app/screens/people.tsx';
import Assign from './app/screens/assign.tsx';
import Extras from './app/screens/extras.tsx';
import Results from './app/screens/results.tsx';
const steps: {
  stage: AppStage;
  label: string;
  short: string;
 }[] = [{ stage: 'capture', label: 'Get the receipt', short: 'Receipt' }, { stage: 'review', label: 'Check the items', short: 'Check items' }, { stage: 'people', label: 'Meet the table', short: 'People' }, { stage: 'assign', label: 'Who had what?', short: 'Who had what?' }, { stage: 'extras', label: 'Finishing touches', short: 'Extras' }, { stage: 'results', label: 'All sorted', short: 'Results' }];
const screens = { home: Home, capture: Capture, processing: Processing, review: Review, people: People, assign: Assign, extras: Extras, results: Results };
const StageScreen = forwardRef<HTMLDivElement, { stage: AppStage }>(({ stage }, ref) => {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  const Screen = screens[stage];
  return <motion.div ref={ref} data-stage={stage} className="stage-screen" inert={!present} aria-hidden={!present || undefined} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, filter: 'blur(2px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={reduced ? { duration: .1 } : screenTransition}>
    <Screen />
  </motion.div>;
});
StageScreen.displayName = 'StageScreen';
function About() {

  const { aboutOpen, setAboutOpen } = useApp();

  return <Modal open={aboutOpen} onOpenChange={setAboutOpen} title="A fair split. A private one." description="A tiny tool for the end of a very good night.">
    <div className="about-content">
      <div className="about-seal">
        <ShieldCheck size={30} />
        <span>ON YOUR DEVICE.<br />OFF EVERYONE’S SERVERS.</span>
      </div>
      <h3>Your receipt stays yours.</h3>
      <p>Receipt photos and extracted receipt contents are processed locally and are never uploaded by this app.</p>
      <p>The app downloads static files, fonts and the OCR reader. Those are ordinary asset downloads, not uploads of your receipt. A split link puts names, items and amounts in its address so another browser can show the breakdown. The link is not encrypted or revocable; anyone who gets it can read those details. Your receipt photo is never included.</p>
      <div className="privacy-facts">
        <span>
          <Check size={15} />No accounts</span>
        <span>
          <Check size={15} />No analytics</span>
        <span>
        <Check size={15} />No automatic saves</span>
        <span>
          <Check size={15} />No paid APIs</span>
      </div>
      <p>Refresh or close the page to clear this session. A copied split link keeps working for anyone who has it; this app cannot revoke a link after it has been shared.</p>
      <Separator />
      <h3>Made in the open.</h3>
      <p>Local OCR with Tesseract.js. Deterministic parsing. Integer-only, exact-cent splitting. No server behind the curtain.</p>
      {config.repositoryUrl ? <a className="btn btn-secondary" href={config.repositoryUrl} target="_blank" rel="noopener noreferrer">
        <Github size={18} />View the source<ArrowUpRight size={16} />
      </a> : <div className="source-setup">
        <strong>Yours to use. Yours to remix.</strong>
        <p>The project is MIT-licensed, so you can use and adapt the source.</p>
      </div>}
      {config.creatorUrl && <a href={config.creatorUrl} target="_blank" rel="noopener noreferrer" className="creator-link">Meet the creator<ArrowUpRight size={15} />
      </a>}
      <p className="about-footnote">{config.brand} is a receipt helper, not a payment app. Check the receipt before paying. English OCR; AUD, USD, EUR, GBP, NZD and CAD.</p>
    </div>
  </Modal>;
}
function Shell() {

  const { state, dispatch, scanner, aboutOpen, setAboutOpen, resetOpen, setResetOpen, reset, toast, readOnlyShared } = useApp();
  const reduced = useReducedMotion();
  const [progressOpen, setProgressOpen] = useState(false);
  const back = useFlowNavigation();
  usePageVisibility();

  const isHome = state.stage === 'home';
  const step = state.stage === 'processing' ? 0 : steps.findIndex(entry => entry.stage === state.stage);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-stage="${state.stage}"] [data-stage-heading]`)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [state.stage]);

  const navigate = (stage: AppStage) => {
    if (state.stage === 'processing') scanner.cancel();
    setProgressOpen(false);
    dispatch({ type: 'GO', stage });
  };

  return <div className={`app-root ${isHome ? 'at-home' : 'in-flow'}`}>
    <a className="skip-link" href={readOnlyShared ? undefined : '#main-content'} tabIndex={readOnlyShared ? 0 : undefined} role={readOnlyShared ? 'link' : undefined} onClick={readOnlyShared ? event => { event.preventDefault(); document.getElementById('main-content')?.focus(); } : undefined}>Skip to the app</a>
    <header className="app-header">
      <div className="header-start">
        {!isHome && !readOnlyShared && <Hint label="Go back">
          <Button variant="ghost" size="icon" className="back-button" onClick={back} aria-label="Go back">
            <ArrowLeft size={19} />
          </Button>
        </Hint>}
        <button className="brand-button" aria-label={`${config.brand} home`} onClick={() => {
          if (!isHome && state.receipt.items.length) setResetOpen(true);
          else {
            if (state.stage === 'processing') scanner.clear();
            dispatch({ type: 'GO', stage: 'home' });
          }
        }}>
          <Brand />
        </button>
      </div>
      {!isHome && !readOnlyShared && <div className="header-step" aria-label={`Step ${step + 1} of 6`}>
        <span className="mono">
          {String(step + 1).padStart(2, '0')}
          <span> / 06</span>
        </span>
        <div aria-hidden="true">
          {steps.map((entry, index) => <span key={entry.stage} className={index <= step ? 'filled' : ''} />)}
        </div>
      </div>}
      {!isHome && !readOnlyShared && <button className="mobile-step-picker" aria-label={`Your progress: ${steps[step]?.short}, step ${step + 1} of 6`} aria-haspopup="dialog" aria-expanded={progressOpen} onClick={() => setProgressOpen(true)}>
        <span>{state.stage === 'processing' ? state.scan.phase === 'ready' ? 'Receipt ready' : state.scan.phase === 'error' ? 'Scan needs help' : 'Reading receipt' : steps[step]?.short}</span>
        <small>{step + 1} OF 6 <ChevronDown size={12} /></small>
      </button>}
      <div className="header-end">
        {readOnlyShared && <span className="shared-view-header">Shared · view only</span>}
        {isHome && <span className="header-privacy">
          <LockKeyhole size={13} />100% ON DEVICE</span>}
        <Hint label="About & privacy">
          <Button variant="ghost" size="icon" aria-label="About and privacy" aria-expanded={aboutOpen} onClick={() => setAboutOpen(true)}>
            <Info size={19} />
          </Button>
        </Hint>
      </div>
    </header>
    <div className={isHome ? 'home-workspace' : readOnlyShared ? 'core-workspace shared-readonly' : 'core-workspace'}>
      {!isHome && !readOnlyShared && <aside className="flow-aside">
        <div className="aside-caption">ONE RECEIPT.<br />EVERYONE’S SHARE.</div>
        <ol className="flow-steps">
          {steps.map((entry, index) => <li key={entry.stage} className={index === step ? 'current' : index < step ? 'completed' : ''} aria-current={index === step ? 'step' : undefined}>
            <button className="flow-step-control" disabled={index === step || !canEnter(state, entry.stage)} onClick={() => navigate(entry.stage)} aria-label={`Go to ${entry.short.toLowerCase()}`}>
            <span className="flow-step-number">
              {index < step ? <Check size={13} /> : String(index + 1).padStart(2, '0')}
            </span>
            <span>
              {entry.label}
            </span>
            </button>
            {index === step && <motion.i layoutId="active-step-dot" />}
          </li>)}
        </ol>
        <div className="aside-note">
          <ScanLine size={22} />
          <p>The only thing leaving<br />the table is the awkwardness.</p>
          <span className="mono">LOCAL OCR · EXACT CENTS</span>
        </div>
        <button className="aside-privacy" onClick={() => setAboutOpen(true)}>
          <ShieldCheck size={16} />
          <span>Private by design.<br />
            <small>Here’s how it works.</small>
          </span>
          <ArrowUpRight size={14} />
        </button>
      </aside>}
      {!isHome && readOnlyShared && <aside className="flow-aside shared-readonly-aside">
        <div className="aside-caption">SHARED WITH YOU</div>
        <div className="aside-note"><ShieldCheck size={22} /><p>A private copy of the split.<br />Explore each person’s items.</p><span className="mono">VIEW ONLY · NO RECEIPT PHOTO</span></div>
      </aside>}
      <main id="main-content" className="app-main">
        <AnimatePresence mode="popLayout" initial={false}>
          <StageScreen key={state.stage} stage={state.stage} />
        </AnimatePresence>
      </main>
    </div>
    <div id="action-root" />
    <AnimatePresence>
      {toast && <motion.div className="toast" key={toast} role="status" initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 5 }}>
        <span className="toast-check">
          <Check size={13} />
        </span>
        {toast}
      </motion.div>}
    </AnimatePresence>
    <About />
    <Modal open={progressOpen} onOpenChange={setProgressOpen} title="Your split, step by step." description="Go back to change anything. Your items and names stay with you.">
      <nav className="step-menu" aria-label="Split steps">
        {steps.map((entry, index) => <button key={entry.stage} className="flow-step-control" aria-current={index === step ? 'step' : undefined} disabled={index === step || !canEnter(state, entry.stage)} onClick={() => navigate(entry.stage)}>
          <span className="flow-step-number">{index < step ? <Check size={14} /> : index + 1}</span>
          <span>{entry.label}</span>
          {index !== step && canEnter(state, entry.stage) && <ArrowRight size={16} />}
        </button>)}
      </nav>
    </Modal>
    <ConfirmDialog open={resetOpen} onOpenChange={setResetOpen} title={readOnlyShared ? 'Start your own split?' : 'Start with a clean receipt?'} description={readOnlyShared ? 'This closes the shared view and starts a private split on this device. The original link still works for anyone who has it.' : 'This clears the current photo, people, assignments and totals from this session. Save or share the results first if you need them.'} actionLabel="Start a fresh split" onConfirm={reset} />
  </div>;
}
class ErrorBoundary extends Component<{
  children: ReactNode
 }, {
  failed: boolean
 }> {
  state = { failed: false }; static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* No receipt contents or errors are sent to a service. */ }
  render() {
    if (this.state.failed) return <main className="fatal-error">
      <Brand />
      <Heart size={36} />
      <h1>That didn’t go<br />according to plan.</h1>
      <p>Something went wrong in this browser. Your receipt hasn’t been uploaded. Restarting clears this session.</p>
      <Button size="large" onClick={() => window.location.reload()}>
        <RotateCcw size={18} />Restart {config.brand}</Button>
    </main>;
    return this.props.children;
  }
}
export default function App() {
  return <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <LayoutGroup id="tab-app">
          <Shell />
        </LayoutGroup>
      </AppProvider>
    </MotionConfig>
  </ErrorBoundary>;
}
