import type { OCRResult, Participant } from '../types/index.ts';
export const demoRows = [
  'NORTH & EMBER',
  'A VERY GOOD DINNER',
  '--------------------------------',
  'Burrata                    18.00',
  'Sourdough                   9.00',
  'Ribeye                     46.00',
  'Rigatoni                   28.00',
  'Market fish                34.00',
  'Truffle fries              12.00',
  'Green salad                10.00',
  '2 x House red              24.00',
  'Sparkling water             8.00',
  'Tiramisu                   16.00',
  '--------------------------------',
  'SUBTOTAL                  205.00',
  'Service charge 10%         20.50',
  'GST included               20.50',
  'TOTAL AUD                 225.50',
  '--------------------------------',
  'GOOD FOOD. GOOD COMPANY.',
  'Synthetic receipt / sample only',
];
export function demoOCR(): OCRResult {

  return {
    text: demoRows.join('\n'), lines: demoRows.map((text, index) => ({
      text, confidence: 96,
      bbox: { x0: 65, y0: 80 + index * 45, x1: 635, y1: 110 + index * 45 }
    })), width: 700, height: 1120, confidence: 96, durationMs: 0
  };
}
export const demoPeople: Participant[] = [
  { id: 'demo-you', name: 'You', tone: 0 },
  { id: 'demo-maya', name: 'Maya', tone: 1 },
  { id: 'demo-leo', name: 'Leo', tone: 2 },
  { id: 'demo-nina', name: 'Nina', tone: 3 },
  { id: 'demo-theo', name: 'Theo', tone: 4 },
];
