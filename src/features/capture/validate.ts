export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export function validateFile(file: Pick<File, 'type' | 'size' | 'name'>): string | null {

  if (file.size === 0) return 'This photo is empty. Choose another one.';

  if (file.size > MAX_FILE_BYTES) return 'This photo is over 25 MB. Choose a smaller photo or screenshot.';

  const supported = /^image\/(?:jpeg|png|webp|avif|heic|heif)$/i.test(file.type);

  const extensionFallback = !file.type && /\.(?:jpe?g|png|webp|avif|heic|heif)$/i.test(file.name);

  if (!supported && !extensionFallback) return 'Choose a JPEG, PNG, WebP, AVIF, or a photo your browser can open. PDFs and SVGs aren’t supported.';

  return null;
}
/** Header-only dimensions avoid decoding obviously oversized PNG/JPEG photos. */
export async function inspectDimensions(file: Blob): Promise<{
  width: number;
  height: number
 } | null> {

  const data = new DataView(await file.slice(0, 262144).arrayBuffer());

  if (data.byteLength >= 24 && data.getUint32(0) === 0x89504e47) return { width: data.getUint32(16), height: data.getUint32(20) };

  if (data.byteLength < 4 || data.getUint16(0) !== 0xffd8) return null;

  let offset = 2;

  while (offset + 9 < data.byteLength) {

    if (data.getUint8(offset) !== 0xff) {
      offset++;
      continue;
    }

    const marker = data.getUint8(offset + 1);

    if (marker === 0xda || marker === 0xd9) break;

    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {

      return { width: data.getUint16(offset + 7), height: data.getUint16(offset + 5) };

    }

    const length = data.getUint16(offset + 2);

    if (length < 2) break;

    offset += length + 2;

  }

  return null;
}
