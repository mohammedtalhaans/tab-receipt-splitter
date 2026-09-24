import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function initials(name: string): string {

  return name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0] ?? '').join('').toLocaleUpperCase();
}
export function personTone(name: string): number {

  return Array.from(name.trim().toLocaleLowerCase()).reduce((hash, char) => ((hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0), 17) % 5;
}
let sequence = 0;
export function uniqueId(prefix: string): string {

  if (typeof globalThis.crypto?.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`;
  // Development on an HTTP LAN may not expose randomUUID. IDs are local only.

  const bytes = new Uint8Array(8);
  globalThis.crypto?.getRandomValues(bytes);

  return `${prefix}-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
