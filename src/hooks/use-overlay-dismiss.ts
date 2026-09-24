import { useCallback, useEffect, useRef } from 'react';
import { useApp } from '../app/context.tsx';

/** Browser Back dismisses the top sheet before leaving its screen. */
export function useOverlayDismiss(open: boolean, onOpenChange: (open: boolean) => void) {
  const { registerOverlay, getOverlayOpener } = useApp();
  const callback = useRef(onOpenChange);
  const wasOpen = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const openedStage = useRef<string | null>(null);
  if (open && !wasOpen.current) {
    opener.current = getOverlayOpener();
    openedStage.current = document.querySelector('.stage-screen:not([aria-hidden="true"])')?.getAttribute('data-stage') ?? null;
  }
  wasOpen.current = open;
  callback.current = onOpenChange;
  useEffect(() => open ? registerOverlay(() => callback.current(false)) : undefined, [open, registerOverlay]);
  // These controlled sheets have no Radix Trigger; restore the actual opener.
  return useCallback((event: Event) => {
    event.preventDefault();
    const currentStage = document.querySelector('.stage-screen:not([aria-hidden="true"])')?.getAttribute('data-stage') ?? null;
    if (currentStage === openedStage.current && opener.current?.isConnected && !opener.current.closest('[inert]')) opener.current.focus({ preventScroll: true });
  }, []);
}
