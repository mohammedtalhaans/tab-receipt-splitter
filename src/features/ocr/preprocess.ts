import { config } from '../../lib/config.ts';
import { inspectDimensions, validateFile } from '../capture/validate.ts';
export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number
 }
function abortError(): DOMException {
  return new DOMException('Scan cancelled', 'AbortError');
}

export async function prepareImage(file: File, signal: AbortSignal, rotate = 0): Promise<PreparedImage> {

  const invalid = validateFile(file);
  if (invalid) throw new Error(invalid);

  const size = await inspectDimensions(file);

  if (signal.aborted) throw abortError();

  if (size && size.width * size.height > config.maxImagePixels) throw new Error('This image has too many pixels. Choose a smaller photo or screenshot.');

  if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function') {

    try {
      return await inWorker(file, signal, rotate);
    }
    catch (error) {
      if (signal.aborted) throw abortError();
      if (error instanceof Error && error.message.includes('too many pixels')) throw error;
    }

  }

  return fallback(file, signal, rotate);
}
function inWorker(file: File, signal: AbortSignal, rotate: number): Promise<PreparedImage> {

  return new Promise((resolve, reject) => {

    const worker = new Worker(new URL('./preprocess.worker.ts', import.meta.url), { type: 'module' });

    const finish = () => {
      worker.terminate();
      signal.removeEventListener('abort', cancel);
    };

    const cancel = () => {
      finish();
      reject(abortError());
    };

    signal.addEventListener('abort', cancel, { once: true });

    worker.onerror = () => {
      finish();
      reject(new Error('Image preparation is unavailable in this worker.'));
    };

    worker.onmessage = (event: MessageEvent<PreparedImage & {
      error?: string
     }>) => {

      finish();
      if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data);

    };

    worker.postMessage({ file, longEdge: config.maxLongEdge, rotate });

  });
}
async function fallback(file: File, signal: AbortSignal, rotate: number): Promise<PreparedImage> {

  const url = URL.createObjectURL(file);

  const image = new Image();
  image.decoding = 'async';

  let canvas: HTMLCanvasElement | null = null;

  try {

    image.src = url;

    await new Promise<void>((resolve, reject) => {

      const cancel = () => {
        image.src = '';
        reject(abortError());
      };

      const clean = () => signal.removeEventListener('abort', cancel);

      signal.addEventListener('abort', cancel, { once: true });

      image.onload = () => {
        clean();
        resolve();
      };

      image.onerror = () => {
        clean();
        reject(new Error('This browser can’t open this photo. Try a JPEG, PNG, or screenshot.'));
      };

    });

    if (signal.aborted) throw abortError();

    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > config.maxImagePixels) throw new Error('This image has too many pixels. Choose a smaller photo.');

    const ratio = Math.min(1, config.maxLongEdge / Math.max(image.naturalWidth, image.naturalHeight));

    const width = Math.max(1, Math.round(image.naturalWidth * ratio));

    const height = Math.max(1, Math.round(image.naturalHeight * ratio));

    const sideways = Math.abs(rotate % 180) === 90;

    canvas = document.createElement('canvas');
    canvas.width = sideways ? height : width;
    canvas.height = sideways ? width : height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image editing isn’t available in this browser. Enter the receipt manually.');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotate * Math.PI / 180);
    // Canvas filters avoid a large synchronous pixel loop on older mobile browsers.

    ctx.filter = 'grayscale(1) contrast(1.2) brightness(1.04)';

    ctx.drawImage(image, -width / 2, -height / 2, width, height);

    if (signal.aborted) throw abortError();

    const blob = await new Promise<Blob>((resolve, reject) => canvas!.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not prepare the image. Try a smaller photo.')), 'image/png'));

    return { blob, width: canvas.width, height: canvas.height };

  } finally {
    URL.revokeObjectURL(url);
    image.src = '';
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
}
