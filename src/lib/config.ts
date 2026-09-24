function validLink(value: string | undefined): string {

  if (!value) return '';

  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}
export const config = {
  brand: 'tab',
  tagline: 'Split the receipt. Not the bill equally.',
  repositoryUrl: validLink(import.meta.env?.VITE_REPOSITORY_URL),
  creatorUrl: validLink(import.meta.env?.VITE_CREATOR_URL),
  creatorSocialUrl: validLink(import.meta.env?.VITE_CREATOR_SOCIAL_URL),
  defaultCurrency: 'AUD' as const,
  maxPeople: 20,
  maxFileBytes: 25 * 1024 * 1024,
  maxImagePixels: 60_000_000,
  maxLongEdge: 2200,
  scanTimeoutMs: 120_000,
};
export function assetUrl(path: string): string {

  return new URL(`${import.meta.env?.BASE_URL ?? './'}${path.replace(/^\//, '')}`, document.baseURI).href;
}
