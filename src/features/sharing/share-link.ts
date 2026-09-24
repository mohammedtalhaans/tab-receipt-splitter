import type { AppState, Assignments, Currency, ExtraDistribution, Participant, Receipt, ReceiptExtra, ReceiptItem, SplitResult, TipSettings } from '../../types/index.ts';
import { initialState } from '../../app/state.ts';
import { calculateSplit } from '../splitting/engine.ts';
import { assertMoney, currencies } from '../../lib/money.ts';
import { personTone } from '../../lib/utils.ts';

// The fragment never forms part of an HTTP request. Keep the payload small and
// structurally bounded because opening a link is an untrusted input boundary.
const MAX_LINK_LENGTH = 1_000_000;
const MAX_ITEMS = 500;
const MAX_EXTRAS = 500;
const extraKinds = new Set(['tax', 'service', 'surcharge', 'discount', 'tip', 'adjustment']);
const tipModes = new Set(['none', 'percent', 'custom']);
const distributions = new Set(['proportional', 'even']);

type PayloadV1 = {
  v: 1;
  label: string;
  currency: Currency;
  total: number;
  items: Array<[name: string, amount: number, quantity: number]>;
  extras: Array<[kind: string, label: string, amount: number, included: boolean]>;
  people: string[];
  // One ordered list of participant indexes per receipt line. This preserves
  // the original table order used for largest-remainder ties.
  claims: number[][];
  tip: [mode: string, basisPoints: number, customAmount: number];
  distribution: string;
};

export type ShareLinkRead =
  | { status: 'none' }
  | { status: 'valid'; state: AppState }
  | { status: 'invalid'; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function validMoney(value: unknown, label: string): value is number {
  if (!Number.isSafeInteger(value)) return false;
  try { assertMoney(value as number, label); return true; } catch { return false; }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value) || value.length > MAX_LINK_LENGTH) throw new Error('This split link is too long or incomplete.');
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function parsePayload(value: unknown): PayloadV1 {
  if (!isRecord(value) || value.v !== 1) throw new Error('This split link is not supported.');
  if (typeof value.label !== 'string' || !value.label.trim() || value.label.length > 64) throw new Error('The shared receipt name is invalid.');
  if (typeof value.currency !== 'string' || !currencies.includes(value.currency as Currency)) throw new Error('The shared currency is invalid.');
  if (!validMoney(value.total, 'Receipt total') || (value.total as number) < 0) throw new Error('The shared receipt total is invalid.');
  if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > MAX_ITEMS) throw new Error('The shared item list is invalid.');
  if (!Array.isArray(value.extras) || value.extras.length > MAX_EXTRAS) throw new Error('The shared charges are invalid.');
  if (!Array.isArray(value.people) || value.people.length < 1 || value.people.length > 20) throw new Error('The shared people list is invalid.');
  if (!Array.isArray(value.claims) || value.claims.length !== value.items.length) throw new Error('The shared item assignments are incomplete.');
  if (!Array.isArray(value.tip) || value.tip.length !== 3 || !tipModes.has(value.tip[0] as string)) throw new Error('The shared tip is invalid.');
  if (!Number.isSafeInteger(value.tip[1]) || (value.tip[1] as number) < 0 || (value.tip[1] as number) > 10000 || !validMoney(value.tip[2], 'Tip') || (value.tip[2] as number) < 0) throw new Error('The shared tip amount is invalid.');
  if (typeof value.distribution !== 'string' || !distributions.has(value.distribution)) throw new Error('The shared extra split is invalid.');

  const people = value.people.map(name => {
    if (typeof name !== 'string' || !name.trim() || name.length > 32) throw new Error('A shared person name is invalid.');
    return name;
  });
  const normalizedPeople = people.map(name => name.trim().toLocaleLowerCase());
  if (new Set(normalizedPeople).size !== normalizedPeople.length) throw new Error('The shared list contains duplicate people.');

  const items = value.items.map(line => {
    if (!Array.isArray(line) || line.length !== 3 || typeof line[0] !== 'string' || !line[0].trim() || line[0].length > 100 || !validMoney(line[1], 'Item price') || (line[1] as number) < 0 || !Number.isSafeInteger(line[2]) || (line[2] as number) < 1 || (line[2] as number) > 99) throw new Error('A shared receipt item is invalid.');
    return [line[0], line[1], line[2]] as [string, number, number];
  });
  const extras = value.extras.map(line => {
    if (!Array.isArray(line) || line.length !== 4 || typeof line[0] !== 'string' || !extraKinds.has(line[0]) || typeof line[1] !== 'string' || !line[1].trim() || line[1].length > 100 || !validMoney(line[2], 'Charge amount') || typeof line[3] !== 'boolean' || line[0] === 'discount' && (line[2] as number) > 0) throw new Error('A shared receipt charge is invalid.');
    return [line[0], line[1], line[2], line[3]] as [string, string, number, boolean];
  });
  const claims = value.claims.map(line => {
    if (!Array.isArray(line) || line.length < 1 || line.length > people.length || line.some((index: unknown) => !Number.isInteger(index) || (index as number) < 0 || (index as number) >= people.length) || new Set(line).size !== line.length) throw new Error('A shared item assignment is invalid.');
    return line as number[];
  });

  return {
    v: 1,
    label: value.label,
    currency: value.currency as Currency,
    total: value.total,
    items,
    extras,
    people,
    claims,
    tip: value.tip as [string, number, number],
    distribution: value.distribution,
  };
}

function toAppState(payload: PayloadV1): AppState {
  const participants: Participant[] = payload.people.map((name, index) => ({ id: `shared-person-${index}`, name, tone: personTone(name) }));
  const items: ReceiptItem[] = payload.items.map(([name, amount, quantity], index) => ({ id: `shared-item-${index}`, name, amount, quantity, confidence: 'good' }));
  const extras: ReceiptExtra[] = payload.extras.map(([kind, label, amount, included], index) => ({ id: `shared-extra-${index}`, kind: kind as ReceiptExtra['kind'], label, amount, included }));
  const assignments: Assignments = Object.fromEntries(items.map((item, index) => [item.id, payload.claims[index]!.map(personIndex => participants[personIndex]!.id)]));
  const receipt: Receipt = { id: 'shared-link-receipt', label: payload.label, currency: payload.currency, items, extras, total: payload.total, totalSource: 'confirmed', warnings: [] };
  const tip: TipSettings = { mode: payload.tip[0] as TipSettings['mode'], basisPoints: payload.tip[1], customAmount: payload.tip[2] };
  const distribution = payload.distribution as ExtraDistribution;
  const calculated = calculateSplit(receipt, participants, assignments, tip, distribution);
  if (!calculated.reconciled) throw new Error('This shared split does not balance.');
  return { stage: 'results', receipt, participants, assignments, tip, distribution, scan: { ...initialState().scan }, demo: false };
}

export function createShareLink(state: AppState, split: SplitResult, href: string): string {
  if (!split.reconciled || !state.receipt.items.length || state.receipt.items.length > MAX_ITEMS || !state.participants.length || state.participants.length > 20 || state.receipt.extras.length > MAX_EXTRAS) throw new Error('This split is not ready to share as a link.');
  // A shared link is a new view-only copy. Do not carry local database IDs,
  // OCR text/confidence, original photos, browser routes, or creation times.
  const participantIndex = new Map(state.participants.map((person, index) => [person.id, index]));
  const payload: PayloadV1 = {
    v: 1,
    label: state.receipt.label.trim() || 'Dinner with friends',
    currency: state.receipt.currency,
    total: state.receipt.total!,
    items: state.receipt.items.map(item => [item.name, item.amount, item.quantity]),
    extras: state.receipt.extras.map(extra => [extra.kind, extra.label, extra.amount, extra.included]),
    people: state.participants.map(person => person.name),
    claims: state.receipt.items.map(item => (state.assignments[item.id] ?? []).map(id => {
      const index = participantIndex.get(id);
      if (index === undefined) throw new Error('Assign each item to someone before sharing.');
      return index;
    })),
    tip: [state.tip.mode, state.tip.basisPoints, state.tip.customAmount],
    distribution: state.distribution,
  };
  const json = JSON.stringify(payload);
  const encoded = toBase64Url(new TextEncoder().encode(json));
  if (encoded.length > MAX_LINK_LENGTH) throw new Error('This receipt is too large to fit in one link. Save the image or copy the summary instead.');
  const url = new URL(href);
  // Tracking/query parameters from a previous visit do not belong in a shared link.
  url.search = '';
  url.hash = `tab-split=${encoded}`;
  return url.href;
}

export function readSharedLink(hash: string): ShareLinkRead {
  if (!hash.startsWith('#tab-split=')) return { status: 'none' };
  try {
    const bytes = fromBase64Url(hash.slice('#tab-split='.length));
    const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const payload = parsePayload(JSON.parse(json) as unknown);
    return { status: 'valid', state: toAppState(payload) };
  } catch (error) {
    return { status: 'invalid', message: error instanceof Error ? error.message : 'This split link could not be opened.' };
  }
}
