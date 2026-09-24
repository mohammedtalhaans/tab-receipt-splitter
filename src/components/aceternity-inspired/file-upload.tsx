/** Original, dependency-free desktop drop target. See THIRD_PARTY_NOTICES.md. */
import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDownToLine, ReceiptText } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { snappySpring } from '../../lib/motion.ts';
export function FileUpload({ onFile, openPicker }: {
  onFile: (file: File) => void;
  openPicker: () => void
 }) {

  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const reduced = useReducedMotion();

  return <div className={`drop-zone ${active ? 'drag-active' : ''}`} onDragEnter={event => {
    event.preventDefault();
    depth.current++;
    setActive(true);
  }} onDragLeave={event => {
    event.preventDefault();
    depth.current--;
    if (depth.current <= 0) {
      depth.current = 0;
      setActive(false);
    }
  }} onDragOver={event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }} onDrop={event => {
    event.preventDefault();
    depth.current = 0;
    setActive(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }}>
    <div className="drop-grid" aria-hidden="true" />
    <motion.div className="drop-paper" animate={{ y: active && !reduced ? -8 : 0, rotate: active && !reduced ? -4 : 0 }} transition={snappySpring}>
      <ReceiptText size={34} strokeWidth={1.2} />
    </motion.div>
    <h3>
      {active ? 'Let it drop.' : 'Drop a receipt here.'}
    </h3>
    <p>One photo. Everything stays on your device.</p>
    <Button variant="secondary" onClick={openPicker}>
      <ArrowDownToLine size={17} />Choose a photo</Button>
    <span className="drop-note">JPEG, PNG, WebP, AVIF · up to 25 MB</span>
  </div>;
}
