import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { initialState, reducer } from './state.ts';
import type { Action } from './state.ts';
import type { AppState, SplitResult } from '../types/index.ts';
import { useScanner } from '../features/ocr/use-scanner.ts';
import { additionalTip, assignmentCount, calculateSplit, previewSubtotals, reconciliation } from '../features/splitting/engine.ts';
interface AppContextValue {

  state: AppState;
  dispatch: Dispatch<Action>;
  scanner: ReturnType<typeof useScanner>;

  receiptCheck: ReturnType<typeof reconciliation>;
  runningTotals: number[];
  assigned: number;
  tipAmount: number;

  split: SplitResult | null;
  calculationError: string | null;

  notify: (message: string) => void;
  toast: string | null;

  aboutOpen: boolean;
  setAboutOpen: (open: boolean) => void;

  resetOpen: boolean;
  setResetOpen: (open: boolean) => void;
  reset: () => void;
  registerOverlay: (dismiss: () => void) => () => void;
  dismissOverlay: () => boolean;
  getOverlayOpener: () => HTMLElement | null;
}
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: {
  children: ReactNode
 }) {

  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const scanner = useScanner(dispatch);

  const [toast, setToast] = useState<string | null>(null);

  const [aboutOpen, setAboutOpen] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlays = useRef<(() => void)[]>([]);
  const lastControl = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const rememberControl = (event: MouseEvent) => {
      if (event.target instanceof Element) lastControl.current = event.target.closest<HTMLElement>('button, a, summary, input, [role="button"]');
    };
    document.addEventListener('click', rememberControl, true);
    return () => document.removeEventListener('click', rememberControl, true);
  }, []);
  const getOverlayOpener = useCallback(() => lastControl.current?.isConnected ? lastControl.current : document.activeElement instanceof HTMLElement ? document.activeElement : null, []);
  const registerOverlay = useCallback((dismiss: () => void) => {
    // On the first screen there is no earlier app entry for Back to dismiss a sheet.
    const position = history.state?.tabFlow;
    const homeGuard = overlays.current.length === 0 && position?.stage === 'home' && position.index === 0;
    if (homeGuard) history.pushState({ tabFlow: { ...position, index: 1 }, tabOverlay: true }, '');
    overlays.current.push(dismiss);
    return () => {
      overlays.current = overlays.current.filter(entry => entry !== dismiss);
      if (homeGuard && history.state?.tabOverlay && !overlays.current.length) history.back();
    };
  }, []);
  const dismissOverlay = useCallback(() => {
    const dismiss = overlays.current.at(-1);
    if (!dismiss) return false;
    dismiss();
    return true;
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const receiptCheck = useMemo(() => reconciliation(state.receipt), [state.receipt]);

  const runningTotals = useMemo(() => previewSubtotals(state.receipt, state.participants, state.assignments), [state.receipt, state.participants, state.assignments]);

  const assigned = useMemo(() => assignmentCount(state.receipt, state.assignments, state.participants), [state.receipt, state.assignments, state.participants]);

  const tipAmount = useMemo(() => {
    try {
      return additionalTip(state.receipt, state.tip);
    } catch {
      return 0;
    }
  }, [state.receipt, state.tip]);

  const calculation = useMemo(() => {

    if (!state.receipt.items.length || !state.participants.length || assigned !== state.receipt.items.length || !receiptCheck.matched) return { split: null, error: null };

    try {
      return { split: calculateSplit(state.receipt, state.participants, state.assignments, state.tip, state.distribution), error: null };
    }
    catch (error) {
      return { split: null, error: error instanceof Error ? error.message : 'Check the amounts before continuing.' };
    }

  }, [state.receipt, state.participants, state.assignments, state.tip, state.distribution, assigned, receiptCheck.matched]);

  const notify = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  };

  const reset = () => {
    scanner.clear();
    dispatch({ type: 'RESET' });
    setResetOpen(false);
    setToast(null);
  };

  return <Context.Provider value={{ state, dispatch, scanner, receiptCheck, runningTotals, assigned, tipAmount, split: calculation.split, calculationError: calculation.error, notify, toast, aboutOpen, setAboutOpen, resetOpen, setResetOpen, reset, registerOverlay, dismissOverlay, getOverlayOpener }}>
    {children}
  </Context.Provider>;
}
export function useApp(): AppContextValue {
  const value = useContext(Context);
  if (!value) throw new Error('App context is missing.');
  return value;
}
