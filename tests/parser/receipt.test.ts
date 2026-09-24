import { describe, test } from 'vitest';
import { cases } from '../cases.ts';
describe('Deterministic receipt parser and monetary input', () => {
  for (const item of cases.filter(item => item.category === 'parser')) test(item.name, item.run);
});
