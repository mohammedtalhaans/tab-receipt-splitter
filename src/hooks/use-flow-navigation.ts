import { useEffect, useRef } from 'react';
import { useApp } from '../app/context.tsx';
import { canEnter, previousStage } from '../app/state.ts';
import type { AppStage } from '../types/index.ts';

const stages: AppStage[] = ['home', 'capture', 'review', 'people', 'assign', 'extras', 'results'];
type Position = { session: string; stage: AppStage; index: number };

/** History contains navigation only: never receipts, images, names or money. */
export function useFlowNavigation() {
  const app = useApp();
  const latest = useRef(app);
  latest.current = app;
  const session = useRef(`tab-${crypto.randomUUID()}`);
  const index = useRef(0);
  const applyingHistory = useRef(false);
  const restoringOverlay = useRef(false);
  const collapsingReset = useRef(false);

  useEffect(() => {
    const firstStage: AppStage = latest.current.readOnlyShared ? 'results' : 'home';
    history.replaceState({ tabFlow: { session: session.current, stage: firstStage, index: 0 } }, '');
    const pop = (event: PopStateEvent) => {
      // A shared link is a read-only snapshot. Browser Back leaves it as a document.
      if (latest.current.readOnlyShared) {
        if (latest.current.dismissOverlay()) {
          const position = event.state?.tabFlow as Position | undefined;
          const previousIndex = position?.session === session.current && Number.isInteger(position.index) ? position.index : 0;
          const delta = index.current - previousIndex;
          if (delta) { restoringOverlay.current = true; history.go(delta); }
        }
        return;
      }
      if (collapsingReset.current) {
        collapsingReset.current = false;
        history.replaceState({ tabFlow: { session: session.current, stage: 'home', index: 0 } }, '');
        return;
      }
      if (restoringOverlay.current) { restoringOverlay.current = false; return; }
      const position = event.state?.tabFlow as Position | undefined;
      const own = position?.session === session.current && stages.includes(position.stage) && Number.isInteger(position.index);
      const nextIndex = own ? position!.index : 0;
      if (latest.current.dismissOverlay()) {
        const delta = index.current - nextIndex;
        if (delta) { restoringOverlay.current = true; history.go(delta); }
        return;
      }
      if (latest.current.state.stage === 'processing') latest.current.scanner.cancel();
      const requested = own ? position!.stage : 'home';
      const destination = canEnter(latest.current.state, requested) ? requested : latest.current.state.receipt.items.length ? 'review' : 'home';
      index.current = nextIndex;
      if (destination !== requested) history.replaceState({ tabFlow: { session: session.current, stage: destination, index: nextIndex } }, '');
      if (destination !== latest.current.state.stage) {
        applyingHistory.current = true;
        latest.current.dispatch({ type: 'GO', stage: destination });
      }
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  useEffect(() => {
    if (app.state.stage === 'home' && !app.state.receipt.items.length) {
      // A fresh split must not revive old screens with an empty data model.
      if (index.current > 0) {
        const distance = index.current;
        session.current = `tab-${crypto.randomUUID()}`;
        index.current = 0;
        collapsingReset.current = true;
        applyingHistory.current = false;
        history.go(-distance);
        return;
      }
      history.replaceState({ tabFlow: { session: session.current, stage: 'home', index: index.current } }, '');
      applyingHistory.current = false;
      return;
    }
    if (applyingHistory.current) { applyingHistory.current = false; return; }
    const destination = app.state.stage === 'processing' ? 'capture' : app.state.stage;
    if (history.state?.tabFlow?.session === session.current && history.state.tabFlow.stage === destination) return;
    index.current += 1;
    history.pushState({ tabFlow: { session: session.current, stage: destination, index: index.current } }, '');
  }, [app.state.stage, app.state.receipt.items.length > 0]);

  return () => {
    if (app.dismissOverlay()) return;
    if (app.state.stage === 'processing') { app.scanner.cancel(); app.dispatch({ type: 'GO', stage: 'capture' }); return; }
    if (history.state?.tabFlow?.session === session.current && index.current > 0) { history.back(); return; }
    const destination = previousStage[app.state.stage];
    if (destination) app.dispatch({ type: 'GO', stage: destination });
  };
}
