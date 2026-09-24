import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseMoney, percentageOf, sumMoney } from '../src/lib/money.ts';
import { parseReceipt } from '../src/features/parser/parse-receipt.ts';
import { allocate } from '../src/features/splitting/allocate.ts';
import { calculateSplit, calculatedReceiptTotal, reconciliation, previewSubtotals } from '../src/features/splitting/engine.ts';
import { initialState, reducer, canEnter } from '../src/app/state.ts';
import { demoOCR } from '../src/test-data/demo.ts';
import { validateFile } from '../src/features/capture/validate.ts';
import type { Participant, Receipt, TipSettings } from '../src/types/index.ts';
export interface TestCase {
  category: 'parser' | 'splitting' | 'state' | 'capture';
  name: string;
  run: () => void
 }
export const cases: TestCase[] = [];
function test(category: TestCase['category'], name: string, run: () => void) {
  cases.push({ category, name, run });
}
const people: Participant[] = [{ id: 'a', name: 'Alex', tone: 0 }, { id: 'b', name: 'Bo', tone: 1 }, { id: 'c', name: 'Cam', tone: 2 }];
const none: TipSettings = { mode: 'none', basisPoints: 1500, customAmount: 0 };
function bill(amounts: number[], extras: Receipt['extras'] = []): Receipt {

  const receipt: Receipt = { id: 't', label: 'Test table', currency: 'AUD', items: amounts.map((amount, index) => ({ id: `i${index}`, name: `Item ${index}`, amount, quantity: 1, confidence: 'good' })), extras, totalSource: 'confirmed', warnings: [] };

  receipt.total = calculatedReceiptTotal(receipt);
  return receipt;
}
for (const [input, expected] of [['12.00', 1200], ['$12.00', 1200], ['€12,00', 1200], ['-4.50', -450], ['-$4.50', -450], ['$ -4.50', -450], ['(4.50)', -450], ['4.50-', -450], ['1,234.56', 123456], ['1.234,56', 123456], ['12', 1200], ['0.01', 1], ['12.5', 1250], ['AUD 12.00', 1200], ['1 234,56', 123456]] as const) {

  test('parser', `money parses ${input} into exact minor units`, () => assert.equal(parseMoney(input), expected));
}
for (const input of ['hello', 'NaN', 'Infinity', '1.2.3', '1,23,45', '--4.50', '4.5050', '1000001.00', '12%']) {

  test('parser', `money rejects malformed amount ${input}`, () => assert.equal(parseMoney(input), null));
}
test('parser', 'normal receipt with total', () => {
  const r = parseReceipt('BISTRO\nBurger 18.00\nFries 9.00\nTOTAL 27.00');
  assert.equal(r.items.length, 2);
  assert.equal(r.items[0]?.amount, 1800);
  assert.equal(r.total, 2700);
  assert.equal(r.label, 'BISTRO');
  assert.equal(reconciliation(r).matched, true);
});
test('parser', 'quantity prefix stores the line total, not unit price multiplication', () => {
  const r = parseReceipt('CAFE\n2 x Latte 9.00\n3 Croissant 15.00\nTOTAL 24.00');
  assert.deepEqual(r.items.map(i => [i.name, i.quantity, i.amount]), [['Latte', 2, 900], ['Croissant', 3, 1500]]);
});
test('parser', 'unit and extended prices use the final column', () => {
  const r = parseReceipt('CAFE\n2 x Latte @ 4.50 9.00\nTOTAL 9.00');
  assert.equal(r.items[0]?.amount, 900);
  assert.equal(r.items[0]?.name, 'Latte');
});
test('parser', 'decimal comma and euro currency', () => {
  const r = parseReceipt('BISTRO\nPasta €12,00\nSalade €8,50\nTOTAL €20,50');
  assert.equal(r.currency, 'EUR');
  assert.equal(reconciliation(r).matched, true);
});
test('parser', 'pound symbol detected', () => assert.equal(parseReceipt('Tea £3.50\nTOTAL £3.50').currency, 'GBP'));
test('parser', 'explicit currencies override the configured dollar default', () => assert.equal(parseReceipt('Burger 10.00\nTOTAL USD 10.00').currency, 'USD'));
test('parser', 'ambiguous dollar retains the user currency', () => assert.equal(parseReceipt('Burger $10.00\nTOTAL $10.00', [], 'CAD').currency, 'CAD'));
test('parser', 'subtotal is not an item or the grand total', () => {
  const r = parseReceipt('Noodles 12.00\nSUB TOTAL 12.00\nTax 1.20\nGRAND TOTAL 13.20');
  assert.equal(r.items.length, 1);
  assert.equal(r.subtotal, 1200);
  assert.equal(r.total, 1320);
});
test('parser', 'service surcharge discount and actual gratuity', () => {
  const r = parseReceipt('Bowl 20.00\nService charge 2.00\nCard surcharge 0.50\nDiscount -4.50\nTip 1.00\nTOTAL 19.00');
  assert.deepEqual(r.extras.map(e => e.kind), ['service', 'surcharge', 'discount', 'tip']);
  assert.equal(reconciliation(r).matched, true);
});
test('parser', 'positive printed discount is a credit', () => {
  const r = parseReceipt('Burger 20.00\nDiscount 4.50\nTOTAL 15.50');
  assert.equal(r.extras[0]?.amount, -450);
  assert.equal(reconciliation(r).matched, true);
});
test('parser', 'explicit included tax is not added twice', () => {
  const r = parseReceipt('Dinner 55.00\nGST included 5.00\nTOTAL 55.00');
  assert.equal(r.extras[0]?.included, true);
  assert.equal(calculatedReceiptTotal(r), 5500);
});
test('parser', 'grand total including GST remains the final total', () => {
  const r = parseReceipt('Dinner 55.00\nGST included 5.00\nTOTAL incl. GST 55.00');
  assert.equal(r.total, 5500);
  assert.equal(r.extras.length, 1);
  assert.equal(reconciliation(r).matched, true);
});
test('parser', 'total tax summary stays separate from the grand total', () => {
  const r = parseReceipt('Dinner 50.00\nTOTAL TAX 5.00\nTOTAL INCLUDING TAX 55.00');
  assert.equal(r.total, 5500);
  assert.equal(r.extras[0]?.amount, 500);
  assert.equal(r.extras[0]?.included, false);
  assert.equal(reconciliation(r).matched, true);
});
test('parser', 'negative final total is flagged instead of becoming a discount', () => {
  const r = parseReceipt('Dinner 55.00\nTOTAL -55.00');
  assert.equal(r.total, undefined);
  assert.equal(r.extras.length, 0);
  assert.ok(r.warnings.some(w => w.includes('Refund receipts')));
});
test('parser', 'implicit GST inclusion requires an exact mathematical match', () => {
  const r = parseReceipt('Dinner 55.00\nGST 5.00\nTOTAL 55.00');
  assert.equal(r.extras[0]?.included, true);
  assert.ok(r.warnings.some(w => w.includes('Tax appears')));
});
test('parser', 'exclusive tax stays exclusive', () => {
  const r = parseReceipt('Dinner 50.00\nTax 5.00\nTOTAL 55.00');
  assert.equal(r.extras[0]?.included, false);
  assert.equal(calculatedReceiptTotal(r), 5500);
});
test('parser', 'missing total is not fabricated', () => {
  const r = parseReceipt('Burger 18.00\nFries 9.00');
  assert.equal(r.total, undefined);
  assert.equal(r.totalSource, 'missing');
  assert.equal(reconciliation(r).matched, false);
});
test('parser', 'duplicate lines are retained and marked for checking', () => {
  const r = parseReceipt('Beer 9.00\nBeer 9.00\nTOTAL 18.00');
  assert.equal(r.items.length, 2);
  assert.notEqual(r.items[0]?.id, r.items[1]?.id);
  assert.equal(r.items[1]?.confidence, 'check');
});
test('parser', 'weird spacing and OCR O/I repairs are flagged', () => {
  const r = parseReceipt('Burger        18.OO\nFries\t9. 00\nTOTAL 27.00');
  assert.equal(r.items[0]?.amount, 1800);
  assert.equal(r.items[0]?.confidence, 'check');
  assert.equal(r.items[1]?.amount, 900);
});
test('parser', 'actual low OCR confidence appears as a check state', () => {
  const r = parseReceipt('Steak 46.00\nTOTAL 46.00', [{ text: 'Steak 46.00', confidence: 62 }]);
  assert.equal(r.items[0]?.confidence, 'check');
});
test('parser', 'payment and suggested-tip lines do not become items', () => {
  const r = parseReceipt('Pasta 24.00\nTOTAL 24.00\nVISA 24.00\nCash 30.00\nChange 6.00\n15% 3.60\nSuggested tip 4.80');
  assert.equal(r.items.length, 1);
  assert.equal(r.extras.length, 0);
});
test('parser', 'price on its own line attaches to the preceding label', () => {
  const r = parseReceipt('CAFE\nSourdough\n9.00\nTOTAL\n9.00');
  assert.equal(r.items[0]?.name, 'Sourdough');
  assert.equal(r.total, 900);
});
test('parser', 'demo has ten items and an exactly matched 225.50 bill', () => {
  const data = demoOCR();
  const r = parseReceipt(data.text, data.lines);
  assert.equal(r.items.length, 10);
  assert.equal(r.total, 22550);
  assert.equal(reconciliation(r).matched, true);
});
test('parser', 'zero cents is a real price', () => {
  const r = parseReceipt('Water 0.00\nTOTAL 0.00');
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0]?.amount, 0);
});

test('splitting', 'single-person item', () => assert.deepEqual(allocate(4600, [1]), [4600]));
test('splitting', 'two-person shared item', () => assert.deepEqual(allocate(1200, [1, 1]), [600, 600]));
test('splitting', 'odd cent and tie break follow participant order', () => assert.deepEqual(allocate(101, [1, 1]), [51, 50]));
test('splitting', 'three-way division', () => assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33]));
test('splitting', 'negative amount retains exact sign', () => assert.deepEqual(allocate(-101, [1, 1]), [-51, -50]));
test('splitting', 'zero-value extra allocates no money', () => assert.deepEqual(allocate(0, [1, 2, 3]), [0, 0, 0]));
test('splitting', 'zero weights fall back to equal shares', () => assert.deepEqual(allocate(100, [0, 0, 0]), [34, 33, 33]));
test('splitting', 'largest fractional remainders receive the extra cents', () => assert.deepEqual(allocate(7, [1, 2, 3]), [1, 2, 4]));
test('splitting', 'negative weights and decimal cents rejected', () => {
  assert.throws(() => allocate(100, [-1, 2]));
  assert.throws(() => allocate(1.2, [1, 1]));
});
test('splitting', 'percentage tipping rounds half-up in integer arithmetic', () => {
  assert.equal(percentageOf(105, 1000), 11);
  assert.equal(percentageOf(20500, 1500), 3075);
});
test('splitting', 'proportional service charge', () => {
  const r = bill([1000, 3000], [{ id: 'svc', kind: 'service', label: 'Service', amount: 400, included: false }]);
  const result = calculateSplit(r, people.slice(0, 2), { i0: ['a'], i1: ['b'] }, none);
  assert.deepEqual(result.people.map(p => p.total), [1100, 3300]);
});
test('splitting', 'proportional tip uses item subtotal, not fees', () => {
  const r = bill([1000, 3000], [{ id: 'svc', kind: 'service', label: 'Service', amount: 400, included: false }]);
  const result = calculateSplit(r, people.slice(0, 2), { i0: ['a'], i1: ['b'] }, { mode: 'percent', basisPoints: 1000, customAmount: 0 });
  assert.equal(result.tipTotal, 400);
  assert.deepEqual(result.people.map(p => p.total), [1200, 3600]);
});
test('splitting', 'discount allocation reduces shares proportionally', () => {
  const r = bill([1000, 3000], [{ id: 'd', kind: 'discount', label: 'Discount', amount: -400, included: false }]);
  const result = calculateSplit(r, people.slice(0, 2), { i0: ['a'], i1: ['b'] }, none);
  assert.deepEqual(result.people.map(p => p.total), [900, 2700]);
});
test('splitting', 'even extras include all table participants explicitly', () => {
  const r = bill([1000, 3000], [{ id: 'svc', kind: 'service', label: 'Service', amount: 400, included: false }]);
  const result = calculateSplit(r, people.slice(0, 2), { i0: ['a'], i1: ['b'] }, none, 'even');
  assert.deepEqual(result.people.map(p => p.total), [1200, 3200]);
});
test('splitting', 'unassigned item blocks results', () => assert.throws(() => calculateSplit(bill([100]), people, {}, none), /Assign every item/));
test('splitting', 'unknown participant blocks results', () => assert.throws(() => calculateSplit(bill([100]), people, { i0: ['missing'] }, none), /invalid participant/));
test('splitting', 'duplicate assignments do not duplicate money', () => assert.throws(() => calculateSplit(bill([100]), people, { i0: ['a', 'a'] }, none), /invalid participant/));
test('splitting', 'mismatch blocks final calculation', () => {
  const r = bill([100]);
  r.total = 101;
  assert.throws(() => calculateSplit(r, people, { i0: ['a'] }, none), /receipt total/);
});
test('splitting', 'inclusive taxes are explanatory, not allocated again', () => {
  const r = bill([5500], [{ id: 'gst', kind: 'tax', label: 'GST included', amount: 500, included: true }]);
  const result = calculateSplit(r, people, { i0: ['a', 'b', 'c'] }, none);
  assert.equal(result.total, 5500);
  assert.equal(result.extrasTotal, 0);
});
test('splitting', 'zero-order participant receives no proportional extras', () => {
  const r = bill([2000], [{ id: 'svc', kind: 'service', label: 'Service', amount: 200, included: false }]);
  const result = calculateSplit(r, people, { i0: ['a'] }, none);
  assert.deepEqual(result.people.map(p => p.total), [2200, 0, 0]);
});
test('splitting', 'excessive discounts never produce negative final balances', () => {
  const r = bill([100, 900], [{ id: 'd', kind: 'discount', label: 'Discount', amount: -500, included: false }]);
  assert.throws(() => calculateSplit(r, people.slice(0, 2), { i0: ['a'], i1: ['b'] }, none, 'even'), /larger than/);
});
test('splitting', 'running subtotals agree with final item shares', () => {
  const r = bill([101, 503]);
  const assignments = { i0: ['a', 'b'], i1: ['a', 'b', 'c'] };
  const preview = previewSubtotals(r, people, assignments);
  const result = calculateSplit(r, people, assignments, none);
  assert.deepEqual(preview, result.people.map(p => p.subtotal));
});
test('splitting', 'a zero-value meal can still be split', () => {
  const result = calculateSplit(bill([0]), people, { i0: ['a', 'b', 'c'] }, none);
  assert.equal(result.total, 0);
  assert.ok(result.reconciled);
});
test('splitting', '5,000 seeded allocation cases preserve sums and quotas', () => {

  let seed = 87241;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };

  for (let i = 0; i < 5000; i++) {

    const n = 1 + random() % 20;
    const amount = (random() % 1_000_000) * (i % 3 === 0 ? -1 : 1);

    const weights = Array.from({ length: n }, () => random() % 10000);

    const shares = allocate(amount, weights);
    assert.equal(sumMoney(shares), amount);
    assert.equal(shares.length, n);

    const denominator = weights.reduce((a, b) => a + b, 0) || n;

    shares.forEach((share, index) => {
      const weight = weights.reduce((a, b) => a + b, 0) ? weights[index]! : 1;
      const base = Number(BigInt(Math.abs(amount)) * BigInt(weight) / BigInt(denominator));
      assert.ok(Math.abs(share) === base || Math.abs(share) === base + 1);
    });

  }
});
test('splitting', '500 seeded complete bills reconcile with mixed extras and tips', () => {

  for (let i = 1; i <= 500; i++) {

    const amounts = [100 + i * 3, 211 + i * 7, 501 + i];

    const r = bill(amounts, [{ id: 'svc', kind: 'service', label: 'Service', amount: 37 + i, included: false }, { id: 'discount', kind: 'discount', label: 'Discount', amount: -12, included: false }]);

    const result = calculateSplit(r, people, { i0: ['a', 'b'], i1: ['b', 'c'], i2: ['a', 'b', 'c'] }, { mode: 'percent', basisPoints: 1500, customAmount: 0 });

    assert.equal(result.people.reduce((sum, person) => sum + person.total, 0), result.total);

    assert.equal(result.total, r.total! + percentageOf(amounts.reduce((a, b) => a + b, 0), 1500));

    assert.equal(result.difference, 0);

  }
});

test('state', 'initial session is empty and in memory only', () => {
  const s = initialState();
  assert.equal(s.stage, 'home');
  assert.equal(s.participants.length, 0);
  assert.equal(s.receipt.items.length, 0);
});
test('state', 'workflow guards prevent jumping to unearned results', () => {
  const s = initialState();
  assert.equal(canEnter(s, 'results'), false);
  assert.equal(reducer(s, { type: 'GO', stage: 'results' }).stage, 'home');
});
test('state', 'removing a person cleans every assignment', () => {
  let s = { ...initialState(), receipt: bill([100]), participants: people, assignments: { i0: ['a', 'b'] } };
  s = reducer(s, { type: 'REMOVE_PERSON', id: 'a' }) as typeof s;
  assert.deepEqual(s.assignments.i0, ['b']);
  assert.equal(s.participants.length, 2);
});
test('state', 'duplicate and blank participant names are rejected', () => {
  let s = initialState();
  s = reducer(s, { type: 'ADD_PERSON', person: people[0]! });
  s = reducer(s, { type: 'ADD_PERSON', person: { id: 'd', name: ' ALEX ', tone: 1 } });
  s = reducer(s, { type: 'ADD_PERSON', person: { id: 'e', name: ' ', tone: 1 } });
  assert.equal(s.participants.length, 1);
});
test('state', 'delete item removes obsolete assignments', () => {
  const s = reducer({ ...initialState(), receipt: bill([100]), assignments: { i0: ['a'] } }, { type: 'DELETE_ITEM', id: 'i0' });
  assert.equal(s.receipt.items.length, 0);
  assert.equal(s.assignments.i0, undefined);
});
test('state', 'everyone shortcut assigns each person once', () => {
  const s = reducer({ ...initialState(), receipt: bill([101]), participants: people }, { type: 'ASSIGN_EVERYONE', itemId: 'i0' });
  assert.deepEqual(s.assignments.i0, ['a', 'b', 'c']);
});
test('state', 'reset destroys receipt, names, tip and assignments', () => {
  const s = reducer({ ...initialState(), receipt: bill([100]), participants: people, assignments: { i0: ['a'] } }, { type: 'RESET' });
  assert.deepEqual(s, initialState());
});
test('state', 'confirmed total preserves original OCR total', () => {
  const receipt = bill([100]);
  receipt.originalTotal = 101;
  const s = reducer({ ...initialState(), receipt }, { type: 'CONFIRM_TOTAL', total: 100 });
  assert.equal(s.receipt.originalTotal, 101);
  assert.equal(s.receipt.total, 100);
  assert.equal(s.receipt.totalSource, 'confirmed');
});
test('capture', 'non-image and executable SVG input rejected', () => {
  assert.ok(validateFile({ type: 'image/svg+xml', name: 'receipt.svg', size: 400 }));
  assert.ok(validateFile({ type: 'application/pdf', name: 'bill.pdf', size: 400 }));
});
test('capture', 'empty and oversized images rejected before decoding', () => {
  assert.ok(validateFile({ type: 'image/png', name: 'receipt.png', size: 0 }));
  assert.ok(validateFile({ type: 'image/jpeg', name: 'receipt.jpg', size: 26 * 1024 * 1024 }));
});
test('capture', 'native camera image and extension fallback accepted', () => {
  assert.equal(validateFile({ type: 'image/jpeg', name: 'image.jpg', size: 300000 }), null);
  assert.equal(validateFile({ type: '', name: 'receipt.HEIC', size: 300000 }), null);
});

// Ground-truth parsing is distinct from image recognition; both are recorded.
const fixtureManifest = JSON.parse(readFileSync(new URL('./fixtures/manifest.json', import.meta.url), 'utf8')) as { name: string; groundTruth: string; itemCount: number; totalMinor: number }[];
for (const fixture of fixtureManifest) {
  test('parser', `synthetic ${fixture.name} ground truth parses and reconciles`, () => {
    const text = readFileSync(new URL(`./fixtures/${fixture.groundTruth}`, import.meta.url), 'utf8');
    const receipt = parseReceipt(text);
    assert.equal(receipt.items.length, fixture.itemCount);
    assert.equal(receipt.total, fixture.totalMinor);
    assert.equal(reconciliation(receipt).matched, true);
  });
}
test('parser', 'real native OCR observation: unreadable dim total stays unconfirmed', () => {
  const text = readFileSync(new URL('./fixtures/observations/dim-native.txt', import.meta.url), 'utf8');
  const receipt = parseReceipt(text);
  assert.equal(receipt.items.length, 10);
  assert.equal(receipt.total, undefined);
  assert.equal(reconciliation(receipt).matched, false);
});
test('parser', 'real native OCR observation: crumpled eight-cent error is not hidden', () => {
  const text = readFileSync(new URL('./fixtures/observations/crumpled-native.txt', import.meta.url), 'utf8');
  const receipt = parseReceipt(text);
  assert.equal(receipt.items.length, 10);
  assert.equal(reconciliation(receipt).difference, 8);
  assert.equal(reconciliation(receipt).matched, false);
});
