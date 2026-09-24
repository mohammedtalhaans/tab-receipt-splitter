import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { Action } from '../../app/state.ts';
import { config, assetUrl } from '../../lib/config.ts';
import { parseReceipt } from '../parser/parse-receipt.ts';
import { demoOCR, demoPeople } from '../../test-data/demo.ts';

function pause(ms: number, signal: AbortSignal): Promise<void> {

  return new Promise((resolve, reject) => {

    const cancel = () => {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, ms);

    signal.addEventListener('abort', cancel, { once: true });

    if (signal.aborted) cancel();

  });
}
export function useScanner(dispatch: Dispatch<Action>) {

  const controller = useRef<AbortController | null>(null);

  const imageUrl = useRef<string | null>(null);

  const job = useRef(0);

  const releaseImage = useCallback(() => {
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    imageUrl.current = null;
  }, []);

  const cancel = useCallback(() => {
    job.current++;
    controller.current?.abort();
    controller.current = null;
  }, []);

  const clear = useCallback(() => {
    cancel();
    releaseImage();
  }, [cancel, releaseImage]);

  useEffect(() => clear, [clear]);


  const start = useCallback(async (file: File, rotate = 0) => {

    clear();

    const currentJob = ++job.current;

    const abort = new AbortController();
    controller.current = abort;

    const initialUrl = URL.createObjectURL(file);
    imageUrl.current = initialUrl;

    dispatch({ type: 'SCAN_START', imageUrl: initialUrl, sample: false });

    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, config.scanTimeoutMs);

    try {

      const { prepareImage } = await import('./preprocess.ts');

      const prepared = await prepareImage(file, abort.signal, rotate);

      if (currentJob !== job.current) return;

      releaseImage();
      imageUrl.current = URL.createObjectURL(prepared.blob);

      dispatch({ type: 'SCAN_UPDATE', scan: { imageUrl: imageUrl.current, width: prepared.width, height: prepared.height, phase: 'loading', status: 'Loading the on-device reader' } });

      const { recognize } = await import('./recognize.ts');

      const result = await recognize(prepared, abort.signal, progress => {

        if (currentJob === job.current) dispatch({ type: 'SCAN_UPDATE', scan: progress });

      });

      if (currentJob !== job.current || abort.signal.aborted) return;

      dispatch({ type: 'SCAN_UPDATE', scan: { phase: 'finding', status: 'Finding items', progress: null, result } });
      // Yield a frame; the boxes shown from this point are REAL returned OCR boxes.

      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

      const receipt = parseReceipt(result.text, result.lines, config.defaultCurrency);

      if (!receipt.items.length) throw new Error('We couldn’t find priced items in this photo. Try a straighter, brighter photo, or enter the items manually.');

      if (currentJob !== job.current || abort.signal.aborted) return;

      dispatch({ type: 'SCAN_UPDATE', scan: { phase: 'checking', status: 'Checking total', progress: null } });

      dispatch({ type: 'SCAN_DONE', receipt, result });

    } catch (error) {

      if (currentJob !== job.current) return;

      if (abort.signal.aborted && !timedOut) return;

      dispatch({ type: 'SCAN_UPDATE', scan: { phase: 'error', progress: null, error: timedOut ? 'This scan is taking too long. Try a smaller, clearer photo, or enter the items manually.' : error instanceof Error ? error.message : 'We couldn’t make sense of this one. Try another photo or enter manually.' } });

    } finally {
      clearTimeout(timeout);
    }

  }, [clear, dispatch, releaseImage]);


  const demo = useCallback(async () => {

    clear();
    const currentJob = ++job.current;

    const abort = new AbortController();
    controller.current = abort;

    dispatch({ type: 'SCAN_START', imageUrl: assetUrl('demo/receipt.svg'), sample: true });

    try {

      dispatch({ type: 'SCAN_UPDATE', scan: { width: 700, height: 1120, status: 'Opening a sample receipt' } });

      await pause(280, abort.signal);

      dispatch({ type: 'SCAN_UPDATE', scan: { phase: 'reading', status: 'Sample scan playback', progress: null } });

      await pause(500, abort.signal);

      const result = demoOCR();

      dispatch({ type: 'SCAN_UPDATE', scan: { phase: 'finding', status: 'Finding sample items', result } });

      await pause(280, abort.signal);

      if (currentJob !== job.current) return;

      dispatch({ type: 'SCAN_DONE', receipt: parseReceipt(result.text, result.lines), result, people: demoPeople.map(person => ({ ...person })) });

    } catch { /* Cancellation is an expected interaction, not an error. */ }

  }, [clear, dispatch]);


  const scanSample = useCallback(async () => {

    clear();
    const currentJob = ++job.current;
    const abort = new AbortController();
    controller.current = abort;

    dispatch({ type: 'SCAN_START', imageUrl: assetUrl('demo/receipt.png'), sample: false });
    dispatch({ type: 'SCAN_UPDATE', scan: { phase: 'loading', status: 'Opening the sample photo' } });

    try {

      const response = await fetch(assetUrl('demo/receipt.png'), { signal: abort.signal });

      if (!response.ok) throw new Error('Could not open the local sample.');

      const blob = await response.blob();

      if (currentJob !== job.current || abort.signal.aborted) return;

      await start(new File([blob], 'sample-receipt.png', { type: 'image/png' }));

    } catch {

      if (currentJob !== job.current || abort.signal.aborted) return;

      dispatch({ type: 'SCAN_UPDATE', scan: { phase: 'error', error: 'Could not load the sample photo. Choose a photo or enter manually.' } });

    }

  }, [clear, dispatch, start]);

  return { start, demo, scanSample, cancel, clear };
}
