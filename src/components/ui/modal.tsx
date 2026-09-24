// shadcn/ui Dialog / Sheet, MIT. Radix preserves focus, dismissal and keyboard behavior.
import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './button.tsx';
import { softSpring } from '../../lib/motion.ts';
import { useOverlayDismiss } from '../../hooks/use-overlay-dismiss.ts';
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  onOpenAutoFocus?: (event: Event) => void;
  variant?: 'dialog' | 'sheet'
 }
export function Modal({ open, onOpenChange, title, description, children, className = '', variant = 'sheet', onOpenAutoFocus }: ModalProps) {

  const reduced = useReducedMotion();
  const restoreFocus = useOverlayDismiss(open, onOpenChange);

  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <AnimatePresence>
      {open && <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay forceMount asChild>
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} />
        </DialogPrimitive.Overlay>
        <div className={`modal-positioner ${variant}`}>
          <DialogPrimitive.Content forceMount asChild onOpenAutoFocus={onOpenAutoFocus} onCloseAutoFocus={restoreFocus} {...(!description ? { "aria-describedby": undefined } : {})}>
            <motion.section className={`modal-content ${className}`} initial={{ opacity: 0, y: reduced ? 0 : 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 20 }} transition={reduced ? { duration: 0.12 } : softSpring}>
              <div className="modal-handle" aria-hidden="true" />
              <div className="modal-heading">
                <div>
                  <DialogPrimitive.Title asChild>
                    <h2>
                      {title}
                    </h2>
                  </DialogPrimitive.Title>
                  {description && <DialogPrimitive.Description className="muted">
                    {description}
                  </DialogPrimitive.Description>}
                </div>
                <DialogPrimitive.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Close dialog">
                    <X size={20} />
                  </Button>
                </DialogPrimitive.Close>
              </div>
              <div className="modal-body">
                {children}
              </div>
            </motion.section>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>}
    </AnimatePresence>
  </DialogPrimitive.Root>;
}
