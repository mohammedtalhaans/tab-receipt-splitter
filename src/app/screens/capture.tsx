import { useRef } from 'react';
import { Camera, ImagePlus, Sun, Crop, MoveUpRight, ArrowRight, PenLine, Smartphone } from 'lucide-react';
import { useApp } from '../context.tsx';
import { Button } from '../../components/ui/button.tsx';
import { PageHeading, PrivacyLine, Notice } from '../../components/ui/common.tsx';
import { FileUpload as DesktopFileUpload } from '../../components/aceternity-inspired/file-upload.tsx';
import { FocusGlow } from '../../components/aceternity-inspired/focus-glow.tsx';
import { BorderBeam } from '../../components/magic/border-beam.tsx';
export default function Capture() {

  const { scanner, dispatch } = useApp();
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  const inApp = /Instagram|TikTok|FBAN|FBAV|Bytedance/i.test(navigator.userAgent);

  const select = (file?: File) => {
    if (file) void scanner.start(file);
  };

  return <div className="capture-screen">
    <PageHeading eyebrow="01 / THE PAPERWORK" title={<>Let’s see<br />that receipt.</>}>Take a photo or choose one you already have. You’ll check the items before splitting.</PageHeading>
    {inApp && <Notice title="Works better in your usual browser" kind="info">
      <p>For camera and sharing, use this app’s menu to open in Safari or Chrome. You can still try it here.</p>
    </Notice>}
    <input ref={camera} className="sr-only" tabIndex={-1} type="file" accept="image/*" capture="environment" aria-label="Take a receipt photo" onChange={event => {
      select(event.target.files?.[0]);
      event.target.value = '';
    }} />
    <input ref={library} className="sr-only" tabIndex={-1} type="file" accept="image/*" aria-label="Choose a receipt image" onChange={event => {
      select(event.target.files?.[0]);
      event.target.value = '';
    }} />
    <FocusGlow className="capture-zone">
      <div className="capture-camera">
        <div className="camera-reticle">
          <span />
          <Camera size={36} strokeWidth={1.5} />
          <span />
        </div>
        <div className="mono capture-zone-label">YOUR NEXT PERFECTLY FAIR SPLIT</div>
        <Button size="large" onClick={() => camera.current?.click()}>
          <Camera size={20} />Take photo<ArrowRight size={19} className="button-end" />
        </Button>
        <Button variant="secondary" onClick={() => library.current?.click()}>
          <ImagePlus size={19} />Choose from library</Button>
      </div>
      <div className="desktop-upload">
        <DesktopFileUpload onFile={file => select(file)} openPicker={() => library.current?.click()} />
        <Button className="desktop-camera-button" variant="ghost" onClick={() => camera.current?.click()}>
          <Camera size={17} />Use camera instead</Button>
      </div>
      <BorderBeam />
    </FocusGlow>
    <p className="capture-file-note">One receipt at a time · up to 25 MB<br />JPEG, PNG or a photo your browser can open. English receipts work best.</p>
    <div className="capture-tips">
      <div>
        <Crop />
        <span>Whole receipt<br />visible</span>
      </div>
      <div>
        <MoveUpRight />
        <span>Keep it reasonably<br />straight</span>
      </div>
      <div>
        <Sun />
        <span>Good<br />lighting</span>
      </div>
    </div>
    <div className="capture-manual-option">
      <div><PenLine size={20} /><span><strong>No photo? Still easy.</strong><small>Type the items and prices from your receipt.</small></span></div>
      <Button variant="secondary" onClick={() => {
        scanner.clear();
        dispatch({ type: 'MANUAL' });
      }}>
        Enter items manually<ArrowRight size={17} /></Button>
    </div>
    <div className="capture-footer"><PrivacyLine /></div>
    <details className="quiet-details">
      <summary>
        <Smartphone size={15} />Just exploring?</summary>
      <p>Try reading a sample photo with the same reader your own receipt will use. The first scan can take a little longer.</p>
      <Button variant="secondary" onClick={() => void scanner.scanSample()}>Scan sample with real OCR<ArrowRight size={16} />
      </Button>
    </details>
  </div>;
}
