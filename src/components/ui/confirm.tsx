// Adapted shadcn/ui Alert Dialog (MIT).
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from './button.tsx';
import { useOverlayDismiss } from '../../hooks/use-overlay-dismiss.ts';
export function Confirm({ open, onOpenChange, title, description, actionLabel, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: () => void
 }) {

  const restoreFocus = useOverlayDismiss(open, onOpenChange);
  return <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="modal-overlay" />
      <div className="modal-positioner dialog">
        <AlertDialog.Content className="modal-content confirm-dialog" onCloseAutoFocus={restoreFocus}>
          <AlertDialog.Title asChild>
            <h2>
              {title}
            </h2>
          </AlertDialog.Title>
          <AlertDialog.Description className="muted">
            {description}
          </AlertDialog.Description>
          <div className="button-row">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Keep this split</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="danger" onClick={onConfirm}>
                {actionLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </div>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}
