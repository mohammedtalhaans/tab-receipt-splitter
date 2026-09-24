import { assertMoney, sumMoney } from '../../lib/money.ts';

/**
 * Hamilton / largest-remainder apportionment with exact BigInt products.
 * Negative amounts allocate their absolute magnitude, then restore the sign.
 * Ties follow the input order, making each result reproducible.
 */
export function allocate(amount: number, weights: readonly number[]): number[] {

  assertMoney(amount);

  if (!weights.length) {
    if (amount === 0) return [];
    throw new Error('Add a person before splitting.');
  }

  weights.forEach(weight => {
    assertMoney(weight, 'Weight');
    if (weight < 0) throw new Error('Allocation weights cannot be negative.');
  });

  let safeWeights = [...weights];

  let totalWeight = sumMoney(safeWeights);

  if (totalWeight === 0) {
    safeWeights = weights.map(() => 1);
    totalWeight = weights.length;
  }

  const magnitude = BigInt(Math.abs(amount));

  const denominator = BigInt(totalWeight);

  const shares = safeWeights.map((weight, index) => {

    const product = magnitude * BigInt(weight);

    return { index, quotient: Number(product / denominator), remainder: product % denominator };

  });

  let spare = Math.abs(amount) - shares.reduce((sum, share) => sum + share.quotient, 0);

  const ranked = [...shares].sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1);

  for (const share of ranked) {
    if (spare-- <= 0) break;
    share.quotient += 1;
  }

  const sign = amount < 0 ? -1 : 1;

  return shares.map(share => share.quotient === 0 ? 0 : share.quotient * sign);
}
