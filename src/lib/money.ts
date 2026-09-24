import type { Currency, MinorUnits } from '../types/index.ts';

export const MAX_MONEY = 100_000_000;
export const currencies: Currency[] = ['AUD', 'USD', 'EUR', 'GBP', 'NZD', 'CAD'];
export const currencySymbols: Record<Currency, string> = { AUD: '$', USD: '$', EUR: '€', GBP: '£', NZD: '$', CAD: '$' };
const formatters = new Map<Currency, Intl.NumberFormat>();
export function assertMoney(value: number, label = 'Amount'): asserts value is MinorUnits {

  if (!Number.isSafeInteger(value) || Math.abs(value) > MAX_MONEY) {

    throw new Error(`${label} must be whole cents and no more than 1,000,000.00.`);

  }
}
export function sumMoney(values: readonly number[]): MinorUnits {

  const result = values.reduce((sum, value) => {
    assertMoney(value);
    return sum + value;
  }, 0);

  assertMoney(result, 'Total');

  return result;
}
/** Parse a user-entered amount without parseFloat, decimal multiplication, or rounding. */
export function parseMoney(input: string): MinorUnits | null {

  let value = input.trim().replace(/\u2212/g, '-').replace(/[\u00a0\u202f]/g, ' ');

  let negative = false;

  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1);
  }

  value = value.replace(/(?:AUD|USD|NZD|CAD|EUR|GBP|US\$|NZ\$|A\$|C\$|[$€£])/gi, '').trim();

  if (value.startsWith('-') || value.endsWith('-')) {
    negative = true;
    value = value.replace(/^-\s*|\s*-$/g, '');
  }

  value = value.replace(/^\+/, '').trim();

  if (!/^\d[\d., '\u2019]*$/.test(value)) return null;

  value = value.replace(/[ '\u2019]/g, '');
  // The final separator is decimal only when followed by one or two digits.

  const match = value.match(/^(.*?)(?:([.,])(\d{1,2}))?$/);

  if (!match) return null;

  let whole = match[1] ?? '';

  const fraction = match[3] ?? '';

  if (/[.,]/.test(whole)) {

    if (!/^\d{1,3}(?:[.,]\d{3})+$/.test(whole)) return null;
    // Mixed thousands separators are not silently accepted.

    if (whole.includes(',') && whole.includes('.')) return null;

    if (match[2] && whole.includes(match[2])) return null;

    whole = whole.replace(/[.,]/g, '');

  }

  if (!/^\d+$/.test(whole)) return null;

  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));

  if (!Number.isSafeInteger(amount) || amount > MAX_MONEY) return null;

  return (negative ? -1 : 1) * amount;
}
/** Decimal input representation; exact division used only at this display boundary. */
export function moneyInput(value: MinorUnits): string {

  assertMoney(value);

  const abs = Math.abs(value);

  return `${value < 0 ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}
export function formatMoney(value: MinorUnits, currency: Currency = 'AUD'): string {

  if (!formatters.has(currency)) formatters.set(currency, new Intl.NumberFormat('en-AU', {
    style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }));

  return formatters.get(currency)!.format(value / 100);
}
export function percentageOf(amount: MinorUnits, basisPoints: number): MinorUnits {

  assertMoney(amount);

  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) throw new Error('Choose a tip between 0% and 100%.');
  // Half-up to the nearest cent, computed entirely with integer arithmetic.

  const sign = amount < 0 ? -1 : 1;

  return sign * Number((BigInt(Math.abs(amount)) * BigInt(basisPoints) + 5000n) / 10000n);
}
