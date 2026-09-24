import { describe, test } from 'vitest';
import { cases } from '../cases.ts';
describe('State and capture invariants', () => {
  for (const item of cases.filter(item => item.category === 'state' || item.category === 'capture')) test(item.name, item.run);
});
