/** Dependency-free runner for the SAME assertion cases registered with Vitest.
 * This is useful offline; it is not a substitute for the full typecheck/E2E release gate. */
import { cases } from '../tests/cases.ts';
let failures = 0;
const start = performance.now();
for (const item of cases) {
  try { item.run(); console.log(`PASS [${item.category}] ${item.name}`); }
  catch (error) { failures++; console.error(`FAIL [${item.category}] ${item.name}\n${error.stack}`); }
}
console.log(`\n${cases.length - failures}/${cases.length} cases passed in ${Math.round(performance.now() - start)}ms. Includes 5,500 seeded invariant scenarios.`);
process.exitCode = failures ? 1 : 0;
