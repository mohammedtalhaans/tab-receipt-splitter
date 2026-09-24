import type { OCRLine, OCRResult } from '../../types/index.ts';
import { assetUrl } from '../../lib/config.ts';
import type { PreparedImage } from './preprocess.ts';

export interface OCRProgress {
  phase: 'loading' | 'reading';
  progress: number | null;
  status: string
 }
/** This module (and Tesseract) is only imported after a photo is selected. */
export async function recognize(image: PreparedImage, signal: AbortSignal, onProgress: (progress: OCRProgress) => void): Promise<OCRResult> {

  if (typeof WebAssembly === 'undefined' || typeof Worker === 'undefined') throw new Error('Local scanning isn’t supported here. You can still enter items manually.');

  const { createWorker, PSM } = await import('tesseract.js');

  if (signal.aborted) throw new DOMException('Scan cancelled', 'AbortError');

  const started = performance.now();

  const pendingWorker = createWorker('eng', 1, {
    workerPath: assetUrl('ocr/worker.min.js'),
    corePath: assetUrl('ocr/core'),
    langPath: assetUrl('ocr/lang'),
    workerBlobURL: false,
    cacheMethod: 'none',
    logger: event => {

      if (signal.aborted) return;

      const reading = event.status === 'recognizing text';

      onProgress({
        phase: reading ? 'reading' : 'loading', progress: reading ? Math.max(0, Math.min(1, event.progress)) : null,
        status: reading ? 'Reading text' : 'Loading the on-device reader'
      });

    },
  });

  let worker: Awaited<typeof pendingWorker> | null = null;

  let rejectAbort: ((reason: DOMException) => void) | null = null;

  const cancelled = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });

  const cancel = () => {

    rejectAbort?.(new DOMException('Scan cancelled', 'AbortError'));

    if (worker) void worker.terminate();
    else void pendingWorker.then(created => created.terminate()).catch(() => undefined);

  };

  signal.addEventListener('abort', cancel, { once: true });

  try {

    worker = await Promise.race([pendingWorker, cancelled]);

    if (signal.aborted) throw new DOMException('Scan cancelled', 'AbortError');

    await Promise.race([worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK, preserve_interword_spaces: '1', user_defined_dpi: '300' }), cancelled]);

    const { data } = await Promise.race([worker.recognize(image.blob, {}, { text: true, blocks: true }), cancelled]);

    const lines: OCRLine[] = [];

    for (const block of data.blocks ?? []) for (const paragraph of block.paragraphs) for (const line of paragraph.lines) {

      lines.push({ text: line.text.trim(), confidence: line.confidence, bbox: { ...line.bbox } });

    }

    return { text: data.text, confidence: data.confidence, lines, width: image.width, height: image.height, durationMs: performance.now() - started };

  } finally {

    signal.removeEventListener('abort', cancel);

    if (worker && !signal.aborted) await worker.terminate();

  }
}
