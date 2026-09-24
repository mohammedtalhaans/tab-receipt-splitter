import { ArrowRight, Camera, ScanLine, PenLine } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../context.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Notice, PrivacyLine, SourceLink } from '../../components/ui/common.tsx';
import { HeroReceipt } from '../../components/receipt/hero-receipt.tsx';
import { screenTransition } from '../../lib/motion.ts';
export default function Home() {

  const { scanner, dispatch, state, setResetOpen, shareLinkError, dismissShareLinkError } = useApp();
  const reduced = useReducedMotion();

  return <div className="home-screen">
    {shareLinkError && <Notice kind="warning" title="This split link couldn’t be opened." action={<Button variant="ghost" onClick={dismissShareLinkError}>Continue without it</Button>}><p>{shareLinkError}</p></Notice>}
    <div className="home-copy">
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={screenTransition}>
        <div className="eyebrow home-eyebrow">
          <span className="tiny-cross">+</span> FOR THE END OF A GOOD NIGHT</div>
        <h1 tabIndex={-1} data-stage-heading>Who ordered<br />
          <span>what?</span>
          <span className="title-asterisk" aria-hidden="true">*</span>
        </h1>
        <p className="home-description">Scan a receipt. Choose who had what.<br />Everyone pays their share.</p>
      </motion.div>
      {state.receipt.items.length > 0 ? <div className="home-resume">
        <span>Your current split is still here</span>
        <strong>{state.receipt.label}</strong>
        <Button size="large" onClick={() => dispatch({ type: 'GO', stage: 'review' })}>Continue this split<ArrowRight size={19} /></Button>
        <button className="home-manual" onClick={() => setResetOpen(true)}>Start a fresh split</button>
      </div> : <><div className="home-actions">
        <Button size="large" onClick={() => dispatch({ type: 'GO', stage: 'capture' })}>
          <Camera size={21} />Scan receipt<ArrowRight className="button-end" size={20} />
        </Button>
        <Button size="large" variant="secondary" onClick={() => void scanner.demo()}>
          <ScanLine size={20} />Try demo
        </Button>
      </div>
      <div className="home-entry-options">
        <span>Try a sample bill, or use your own.</span>
        <button className="home-manual" onClick={() => { scanner.clear(); dispatch({ type: 'MANUAL' }); }}>
          <PenLine size={15} />Enter items manually
        </button>
      </div>
      </>}
      <div className="home-privacy">
        <PrivacyLine />
        <span>No sign-up. No receipt uploads.</span>
      </div>
    </div>
    <HeroReceipt />
    <div className="home-bottom">
      <p>
        <span className="tiny-cross">*</span> Split the receipt. <span className="muted">Not the bill equally.</span>
      </p>
      <SourceLink />
    </div>
  </div>;
}
