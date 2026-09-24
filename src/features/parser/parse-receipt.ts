import type { Currency, ExtraKind, OCRLine, Receipt, ReceiptExtra, ReceiptItem } from '../../types/index.ts';
import { parseMoney, sumMoney } from '../../lib/money.ts';

// A decimal price must contain exactly two fractional digits; names, phones,
// percentages, and dates are not prices. O/I substitutions are allowed ONLY
// inside price tokens and always cause a visible review flag.
const pricePattern = /(?:[-−]\s*)?(?:(?:AUD|USD|NZD|CAD|EUR|GBP)\s*|(?:US|NZ|A|C)?[$€£]\s*)?(?:[-−]\s*)?(?:\d{1,3}(?:[., '\u2019]\d{3})+|[\dOIol]+)[.,]\s*[\dOoIl]{2}(?:\s*[-−])?(?!\d)/g;
const payment = /^(?:cash\b|change\b|visa\b|master\s*card\b|amex\b|eftpos\b|credit\s*card\b|debit\b|card\b|tender(?:ed)?\b|paid\b|amount\s*paid\b|auth(?:orization)?\b|approved\b|balance\s*paid\b|tip\s*(?:suggestion|guide)|suggested\s*(?:tip|gratuity)|\d+(?:[.,]\d+)?\s*%)/i;
const subTotalPattern = /^(?:sub\s*total|subtotal|net\s*total)\b/i;
const grandTotalPattern = /^(?:grand\s*total|t[o0]tal(?:\s*(?:due|incl\.?|inc\.?|amount))?|amount\s*(?:due|payable)|balance\s*due|to\s*pay)\b/i;
// "TOTAL incl GST" is the amount to pay; "TOTAL GST" is a tax summary.
const extraSummaryPattern = /^t[o0]tal\s+(?:gst|vat|tax(?:es)?|service|surcharge|discount|savings|tip|gratuity|rounding)\b/i;
const ignoredText = /(?:thank\s*you|come\s*again|www\.|https?:|\bABN\b|\bVAT\s*(?:ID|NO)\b|\b(?:tel|phone|table|server|check|order|receipt|invoice)\s*[:#\d]|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b)/i;
const onlyDecoration = /^[\s*=_.\-~•:]+$/;
function detectCurrency(text: string, fallback: Currency): Currency {

  if (/\bAUD\b|A\$/.test(text)) return 'AUD';

  if (/\bNZD\b|NZ\$/.test(text)) return 'NZD';

  if (/\bCAD\b|C\$/.test(text)) return 'CAD';

  if (/\bUSD\b|US\$/.test(text)) return 'USD';

  if (/€|\bEUR\b/.test(text)) return 'EUR';

  if (/£|\bGBP\b/.test(text)) return 'GBP';

  return fallback;
}
function extraKind(name: string, amount: number): ExtraKind | null {

  if (/discount|coupon|promo\b|savings|\bcomp(?:limentary)?\b/i.test(name) || amount < 0) return 'discount';

  if (/\bgst\b|\bvat\b|\btax(?:es)?\b/i.test(name)) return 'tax';

  if (/service\s*(?:charge|fee)?|\bsvc\b|\bsrv\b/i.test(name)) return 'service';

  if (/surcharge|card\s*fee|processing\s*fee/i.test(name)) return 'surcharge';

  if (/^(?:tip|gratuity)\b/i.test(name)) return 'tip';

  if (/round(?:ing)?\b|adjustment/i.test(name)) return 'adjustment';

  return null;
}
function readableName(value: string): string {

  return value.replace(/\s+/g, ' ').replace(/^[\s*|:]+|[\s@:*|.\-]+$/g, '').trim().slice(0, 100);
}
export function parseReceipt(text: string, ocrLines: OCRLine[] = [], fallback: Currency = 'AUD'): Receipt {

  const cleanText = text.replace(/\r/g, '').replace(/[\u00a0\u202f\t]/g, ' ');

  const rawLines = cleanText.split('\n').map(line => line.trim()).filter(Boolean);

  const items: ReceiptItem[] = [];

  const extras: ReceiptExtra[] = [];

  const warnings: string[] = [];

  let total: number | undefined;

  let subtotal: number | undefined;

  let pendingName = '';

  let label = '';

  let sequence = 0;

  let ignoredNegative = false;

  const confidenceByText = new Map(ocrLines.map(line => [line.text.trim().replace(/\s+/g, ' '), line.confidence]));


  for (const raw of rawLines.slice(0, 1500)) {

    if (onlyDecoration.test(raw)) continue;

    const prices = [...raw.matchAll(pricePattern)];

    if (!prices.length) {

      if (ignoredText.test(raw) || payment.test(raw) || /^\d|^[^\p{L}]*$/u.test(raw)) {
        pendingName = '';
        continue;
      }

      if (!label && !subTotalPattern.test(raw) && !grandTotalPattern.test(raw) && !extraKind(raw, 0)) label = readableName(raw);

      pendingName = readableName(raw);

      continue;

    }

    const token = prices.at(-1)!;

    const tokenStart = token.index ?? 0;
    // Reject tokens embedded inside a telephone/date/identifier, or followed by %.

    if ((tokenStart > 0 && /[\d/]/.test(raw[tokenStart - 1] ?? '')) || /^\s*%/.test(raw.slice(tokenStart + token[0].length))) {
      pendingName = '';
      continue;
    }

    let sourceName = raw.slice(0, prices[0]?.index ?? tokenStart).trim();

    if (!sourceName) sourceName = pendingName;

    pendingName = '';

    if (!sourceName || ignoredText.test(sourceName)) continue;

    let name = readableName(sourceName);

    const normalizedPrice = token[0].replace(/[Oo]/g, '0').replace(/[Il]/g, '1').replace(/\s+/g, '');

    const amount = parseMoney(normalizedPrice);

    if (amount === null) {
      warnings.push('A price could not be read. Compare the items with your photo.');
      continue;
    }

    const kind = extraKind(name, amount);
    // Card fees are extras; ordinary card-payment lines are not.

    if (payment.test(name) && kind !== 'surcharge' && kind !== 'discount') continue;

    if (subTotalPattern.test(name)) {
      subtotal = amount;
      continue;
    }

    if (grandTotalPattern.test(name) && !extraSummaryPattern.test(name)) {

      if (amount >= 0) total = amount;
      else ignoredNegative = true;

      continue;

    }

    if (kind) {

      if (/suggest|optional|recommended/i.test(name)) continue;

      extras.push({
        id: `extra-${++sequence}`, kind, label: name, amount: kind === 'discount' ? -Math.abs(amount) : amount,
        included: /\binc(?:l(?:uded|usive)?)?\b|included\s*in|of\s*which/i.test(name)
      });

      continue;

    }

    if (/^\d+(?:[.,]\d+)?\s*%/.test(name)) continue;

    const quantityMatch = name.match(/^(\d{1,3})\s*(?:[x×]\s*|\s+)(.+)$/i);

    let quantity = 1;

    if (quantityMatch) {
      quantity = Number(quantityMatch[1]);
      name = readableName(quantityMatch[2] ?? name);
    }

    if (!name || !/\p{L}/u.test(name)) continue;

    const confidence = confidenceByText.get(raw.replace(/\s+/g, ' '));

    const repaired = /[OoIl]/.test(token[0]);

    const duplicate = items.some(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase() && item.amount === amount);

    const uncertain = repaired || (confidence !== undefined && confidence < 78) || quantity < 1 || duplicate;

    items.push({ id: `item-${++sequence}`, name, amount, quantity: Math.max(1, quantity), confidence: uncertain ? 'check' : 'good', sourceLine: raw, ocrConfidence: confidence });

  }

  if (items.length > 500) {
    items.length = 500;
    warnings.push('Only the first 500 items were kept. Check this long receipt carefully.');
  }
  // Some receipts print GST without saying "included". Infer inclusion only
  // when that single interpretation exactly matches the printed grand total.

  const taxCandidates = extras.filter(extra => extra.kind === 'tax' && !extra.included);

  if (total !== undefined && taxCandidates.length) {

    const itemSum = sumMoney(items.map(item => item.amount));

    const withoutTaxes = sumMoney([itemSum, ...extras.filter(extra => !extra.included && extra.kind !== 'tax').map(extra => extra.amount)]);

    const withTaxes = sumMoney([withoutTaxes, ...taxCandidates.map(extra => extra.amount)]);

    if (withoutTaxes === total && withTaxes !== total) {

      taxCandidates.forEach(extra => {
        extra.included = true;
      });

      warnings.push('Tax appears to be included in the prices. Please check the tax setting.');

    }

  }

  if (items.some(item => item.confidence === 'check')) warnings.push('A few lines need a closer look. Repeated items are kept, not silently removed.');

  if (total === undefined) warnings.push('No final total was found. Enter the printed total or confirm the calculated one.');

  if (ignoredNegative) warnings.push('Refund receipts are not supported. Enter the amounts you need to split manually.');

  return {
    id: 'receipt-parsed', label: label || 'Dinner with friends', currency: detectCurrency(cleanText, fallback), items, extras, subtotal, total, originalTotal: total,
    totalSource: total === undefined ? 'missing' : 'detected', warnings: [...new Set(warnings)]
  };
}
