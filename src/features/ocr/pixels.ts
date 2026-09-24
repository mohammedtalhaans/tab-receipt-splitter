/** Deterministic grayscale and percentile contrast normalization, shared by both paths. */
export function normalizePixels(data: Uint8ClampedArray, enhance = true): void {

  const histogram = new Uint32Array(256);

  for (let i = 0; i < data.length; i += 4) {

    const luminance = Math.round(0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0));

    histogram[luminance] = (histogram[luminance] ?? 0) + 1;

  }

  const pixels = data.length / 4;

  let lower = 0, upper = 255, count = 0;

  for (let i = 0; i < 256; i++) {
    count += histogram[i] ?? 0;
    if (count >= pixels * 0.015) {
      lower = i;
      break;
    }
  }

  count = 0;

  for (let i = 255; i >= 0; i--) {
    count += histogram[i] ?? 0;
    if (count >= pixels * 0.015) {
      upper = i;
      break;
    }
  }

  const range = Math.max(80, upper - lower);

  for (let i = 0; i < data.length; i += 4) {

    const gray = Math.round(0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0));

    const normalized = enhance ? Math.max(0, Math.min(255, Math.round((gray - lower) * 255 / range))) : gray;

    data[i] = normalized;
    data[i + 1] = normalized;
    data[i + 2] = normalized;
    data[i + 3] = 255;

  }
}
