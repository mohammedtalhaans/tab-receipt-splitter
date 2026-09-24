import type { Assignments, ExtraDistribution, Participant, PersonResult, Receipt, SplitResult, TipSettings } from '../../types/index.ts';
import { assertMoney, percentageOf, sumMoney } from '../../lib/money.ts';
import { allocate } from './allocate.ts';

export function itemTotal(receipt: Receipt): number {
  return sumMoney(receipt.items.map(item => item.amount));
}
export function extraTotal(receipt: Receipt): number {
  return sumMoney(receipt.extras.filter(extra => !extra.included).map(extra => extra.amount));
}
export function calculatedReceiptTotal(receipt: Receipt): number {
  return sumMoney([itemTotal(receipt), extraTotal(receipt)]);
}
export function reconciliation(receipt: Receipt) {

  const calculated = calculatedReceiptTotal(receipt);

  const difference = receipt.total === undefined ? null : calculated - receipt.total;

  return { calculated, expected: receipt.total, difference, matched: difference === 0 };
}
export function additionalTip(receipt: Receipt, tip: TipSettings): number {

  if (tip.mode === 'none') return 0;

  if (tip.mode === 'percent') return percentageOf(itemTotal(receipt), tip.basisPoints);

  assertMoney(tip.customAmount, 'Tip');

  if (tip.customAmount < 0) throw new Error('A tip cannot be negative.');

  return tip.customAmount;
}
export function assignmentCount(receipt: Receipt, assignments: Assignments, people: Participant[]): number {

  const valid = new Set(people.map(person => person.id));

  return receipt.items.filter(item => assignments[item.id]?.some(id => valid.has(id))).length;
}
/** Also used for the live running totals before every item is assigned. */
export function previewSubtotals(receipt: Receipt, participants: Participant[], assignments: Assignments): number[] {

  const totals = participants.map(() => 0);

  for (const item of receipt.items) {

    const ids = new Set(assignments[item.id] ?? []);

    const indexes = participants.map((person, index) => ids.has(person.id) ? index : -1).filter(index => index !== -1);

    if (!indexes.length) continue;

    const shares = allocate(item.amount, indexes.map(() => 1));

    indexes.forEach((index, slot) => {
      totals[index] = (totals[index] ?? 0) + (shares[slot] ?? 0);
    });

  }

  return totals;
}
export function calculateSplit(receipt: Receipt, participants: Participant[], assignments: Assignments, tip: TipSettings, distribution: ExtraDistribution = 'proportional'): SplitResult {

  if (!receipt.items.length) throw new Error('Add at least one item.');

  if (!participants.length) throw new Error('Add someone at the table.');

  if (new Set(participants.map(person => person.id)).size !== participants.length) throw new Error('Participant IDs must be unique.');

  if (new Set(receipt.items.map(item => item.id)).size !== receipt.items.length) throw new Error('Item IDs must be unique.');

  if (new Set(receipt.extras.map(extra => extra.id)).size !== receipt.extras.length) throw new Error('Extra IDs must be unique.');

  if (!reconciliation(receipt).matched) throw new Error('Check the receipt total before calculating.');

  const people: PersonResult[] = participants.map(participant => ({ participant, items: [], extras: [], subtotal: 0, total: 0 }));

  const knownIds = new Set(participants.map(person => person.id));

  for (const item of receipt.items) {

    assertMoney(item.amount, 'Item price');

    if (item.amount < 0) throw new Error('Put discounts in Extras, not item prices.');

    const ids = assignments[item.id] ?? [];

    if (!ids.length) throw new Error('Assign every item before calculating.');

    if (new Set(ids).size !== ids.length || ids.some(id => !knownIds.has(id))) throw new Error('An item has an invalid participant. Reassign it.');

    const selected = people.filter(person => ids.includes(person.participant.id));

    const shares = allocate(item.amount, selected.map(() => 1));

    selected.forEach((person, index) => {

      const amount = shares[index] ?? 0;

      person.items.push({ id: item.id, label: item.name, amount, kind: 'item', shared: selected.length > 1 });

      person.subtotal += amount;

      person.total += amount;

    });

  }

  const tipTotal = additionalTip(receipt, tip);

  const extras = [...receipt.extras.filter(extra => !extra.included)];

  if (tipTotal !== 0) extras.push({ id: '__additional_tip__', kind: 'tip', label: 'Added tip', amount: tipTotal, included: false });

  const weights = people.map(person => distribution === 'even' ? 1 : person.subtotal);

  for (const extra of extras) {

    assertMoney(extra.amount, extra.label);

    if (extra.kind === 'discount' && extra.amount > 0) throw new Error('A discount must reduce the bill.');

    const shares = allocate(extra.amount, weights);

    people.forEach((person, index) => {

      const amount = shares[index] ?? 0;

      person.extras.push({ id: extra.id, label: extra.label, amount, kind: extra.kind, shared: true });

      person.total += amount;

    });

  }

  people.forEach(person => {

    assertMoney(person.total, 'Person total');

    if (person.total < 0) throw new Error('The discount is larger than someone’s share. Reduce it or split extras proportionally.');

  });

  const receiptTotal = calculatedReceiptTotal(receipt);

  const total = sumMoney([receiptTotal, tipTotal]);

  if (total < 0) throw new Error('The bill total cannot be negative.');

  const difference = sumMoney(people.map(person => person.total)) - total;

  if (difference !== 0) throw new Error('The split did not balance. Nothing has been shared.');

  return { people, itemTotal: itemTotal(receipt), extrasTotal: extraTotal(receipt), tipTotal, receiptTotal, total, difference, reconciled: true };
}
