import { config } from '../../lib/config.ts';
import type { Currency, SplitResult } from '../../types/index.ts';
import { formatMoney } from '../../lib/money.ts';
export function buildSummary(label: string, currency: Currency, split: SplitResult): string {

  return `${label.trim() || 'Dinner with friends'}\n${formatMoney(split.total, currency)} sorted · ${currency}\n\n${split.people.map(person => `${person.participant.name}: ${formatMoney(person.total, currency)}`).join('\n')}\n\nEvery cent accounted for.\nSplit with ${config.brand} · Free & open source`;
}
export async function copySummary(text: string): Promise<boolean> {

  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
export function downloadImage(url: string, label: string): void {

  const anchor = document.createElement('a');
  anchor.href = url;

  anchor.download = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || config.brand}-split.png`;

  try {
    document.body.appendChild(anchor);
    anchor.click();
  } finally { anchor.remove(); }
}
