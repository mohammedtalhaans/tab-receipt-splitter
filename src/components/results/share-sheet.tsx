import { config } from '../../lib/config.ts';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Download, Copy, Check, ShieldCheck, ExternalLink, RotateCcw, ImageOff } from 'lucide-react';
import { useApp } from '../../app/context.tsx';
import { Modal } from '../ui/modal.tsx';
import { Button } from '../ui/button.tsx';
import { ReceiptSkeleton } from '../ui/skeleton.tsx';
import { Notice } from '../ui/common.tsx';
import { buildSummary, copySummary, downloadImage } from '../../features/sharing/summary.ts';
import { formatMoney } from '../../lib/money.ts';

export function ShareSheet({ open, onOpenChange, intent = 'share' }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent?: 'share' | 'save'
}) {
  const { split, state, notify } = useApp();
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [imageError, setImageError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [downloadRequested, setDownloadRequested] = useState(false);
  const copyField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open || !split) return;
    let stopped = false;
    let ownedUrl: string | null = null;
    setUrl(null);
    setBlob(null);
    setImageError('');
    setActionError('');
    setCopied(false);
    setManualCopy(false);
    setBusy(false);
    setDownloadRequested(false);

    void import('../../features/sharing/export-image.ts')
      .then(module => module.createShareImage(state.receipt.label, state.receipt.currency, split))
      .then(result => {
        if (stopped) return;
        ownedUrl = URL.createObjectURL(result);
        setBlob(result);
        setUrl(ownedUrl);
      }).catch(error => {
        if (!stopped) setImageError(error instanceof Error ? error.message : 'The image could not be created. Your text summary is still ready.');
      });

    return () => {
      stopped = true;
      if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    };
  }, [open, split, state.receipt.label, state.receipt.currency, attempt]);

  useEffect(() => {
    if (manualCopy) {
      copyField.current?.focus();
      copyField.current?.select();
    }
  }, [manualCopy]);

  if (!split) return null;
  const text = buildSummary(state.receipt.label, state.receipt.currency, split);
  const hasNativeShare = typeof navigator.share === 'function';

  async function copy() {
    if (await copySummary(text)) {
      setCopied(true);
      setManualCopy(false);
      notify('Summary copied. Send it to the table.');
    } else setManualCopy(true);
  }

  // Prepare the file before the click; native share needs that click's user activation.
  async function share() {
    if (!navigator.share || busy) return;
    setBusy(true);
    setActionError('');
    try {
      const file = blob ? new File([blob], `${config.brand}-split.png`, { type: 'image/png' }) : null;
      let canShareFile = false;
      try { canShareFile = !!file && !!navigator.canShare?.({ files: [file] }); }
      catch { /* A browser may expose canShare without accepting file queries. Text still works. */ }
      const data: ShareData = canShareFile && file
        ? { files: [file], title: state.receipt.label, text: `${formatMoney(split!.total, state.receipt.currency)} sorted with ${config.brand}.` }
        : { title: state.receipt.label, text };
      await navigator.share(data);
    } catch (error) {
      if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) {
        setActionError('Sharing did not open. You can save the image or copy the summary below.');
      }
    } finally { setBusy(false); }
  }

  function save() {
    if (!url) return;
    setActionError('');
    try {
      downloadImage(url, state.receipt.label);
      setDownloadRequested(true);
      notify('Image ready. Check your downloads or open it below to save.');
    } catch {
      setActionError('The download could not start. Open the image below, then use your browser’s save option.');
    }
  }

  return <Modal open={open} onOpenChange={onOpenChange} title={intent === 'save' ? 'Keep a copy.' : 'Pass it around.'} description="Names, amounts and the table total. Your receipt photo and item details stay private." className="share-modal">
    <div className="share-summary-strip"><span>{split.people.length} {split.people.length === 1 ? 'person' : 'people'} · {state.receipt.currency}</span><strong>{formatMoney(split.total, state.receipt.currency)}</strong></div>
    {actionError && <Notice kind="warning" title={actionError} />}
    <div className="share-actions">
      {intent === 'share' && hasNativeShare && <Button size="large" disabled={busy || (!blob && !imageError)} onClick={() => void share()}>
        <Share2 size={19} />{busy ? 'Opening share…' : !blob && !imageError ? 'Making your share card…' : imageError ? 'Share text summary' : 'Share with the table'}
      </Button>}
      <Button size={intent === 'save' || !hasNativeShare ? 'large' : 'default'} variant={intent === 'save' || !hasNativeShare ? 'primary' : 'secondary'} disabled={!url || busy} onClick={save}>
        <Download size={18} />{url ? 'Save image' : imageError ? 'Image unavailable' : 'Preparing image…'}
      </Button>
      <Button variant="ghost" onClick={() => void copy()}>
        {copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copied' : 'Copy summary'}
      </Button>
    </div>
    {downloadRequested && <p className="share-download-help" role="status">Look in Downloads. On a phone, you can also open the image below and save it to Photos.</p>}
    {manualCopy && <label className="field">Select and copy this summary<textarea ref={copyField} aria-label="Split summary to copy" value={text} readOnly rows={8} />
      <small className="field-hint">Press and hold to select, or use Ctrl/Cmd + C.</small>
    </label>}
    {!hasNativeShare && <p className="share-browser-note">Save the image or copy the text, then send it in your group chat.</p>}
    <div className="share-preview-heading"><span>YOUR SHARE CARD</span>{url && <a href={url} target="_blank" rel="noopener noreferrer">Open full image<ExternalLink size={14} /></a>}</div>
    <motion.div layoutId="final-receipt" className={`share-card-preview${imageError ? ' has-error' : ''}`} tabIndex={url ? 0 : undefined} role={url ? 'region' : undefined} aria-label={url ? 'Share card preview. Scroll to see the whole image.' : undefined}>
      {url ? <img src={url} alt={`Share card for ${state.receipt.label}: ${formatMoney(split.total, state.receipt.currency)}, split between ${split.people.length} ${split.people.length === 1 ? 'person' : 'people'}.`} /> : imageError ? <div className="share-image-error"><ImageOff size={28} /><strong>The text summary is ready.</strong><p>{imageError}</p><Button variant="secondary" onClick={() => setAttempt(value => value + 1)}><RotateCcw size={16} />Try creating the image again</Button></div> : <><ReceiptSkeleton /><span className="sr-only" role="status">Creating your share image</span></>}
    </motion.div>
    {url && <p className="share-preview-help">Scroll the preview to see everyone. The saved image includes the whole table.</p>}
    <p className="share-privacy"><ShieldCheck size={15} />Created on this device. Shared only when you choose.</p>
  </Modal>;
}
