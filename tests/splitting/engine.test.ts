import { describe, test } from 'vitest';
import { cases } from '../cases.ts';
describe('Exact-cent split engine', () => {
  for (const item of cases.filter(item => item.category === 'splitting')) test(item.name, item.run);
});
