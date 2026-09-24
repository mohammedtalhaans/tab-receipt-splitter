/// <reference lib="webworker" />
import { normalizePixels } from './pixels.ts';
const scope = self as unknown as DedicatedWorkerGlobalScope;
scope.onmessage = async (event: MessageEvent<{
  file: Blob;
  longEdge: number;
  rotate: number
 }>) => {

  let bitmap: ImageBitmap | null = null;

  try {

    const { file, longEdge, rotate } = event.data;

    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    if (bitmap.width * bitmap.height > 60_000_000) throw new Error('This image has too many pixels. Choose a smaller photo or screenshot.');

    const ratio = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));

    const width = Math.max(1, Math.round(bitmap.width * ratio));

    const height = Math.max(1, Math.round(bitmap.height * ratio));

    const sideways = Math.abs(rotate % 180) === 90;

    const canvas = new OffscreenCanvas(sideways ? height : width, sideways ? width : height);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) throw new Error('Your browser could not prepare this photo. Try another photo or enter manually.');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotate * Math.PI / 180);

    ctx.drawImage(bitmap, -width / 2, -height / 2, width, height);

    bitmap.close();
    bitmap = null;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);

    normalizePixels(pixels.data);

    ctx.putImageData(pixels, 0, 0);

    const blob = await canvas.convertToBlob({ type: 'image/png' });

    scope.postMessage({ blob, width: canvas.width, height: canvas.height });

    canvas.width = 1;
    canvas.height = 1;

  } catch (error) {

    scope.postMessage({ error: error instanceof Error ? error.message : 'This browser could not open the photo.' });

  } finally {
    bitmap?.close();
  }
};
