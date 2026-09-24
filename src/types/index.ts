/** All monetary numbers in the domain are safe integer minor units, never dollars. */
export type MinorUnits = number;
export type Currency = 'AUD' | 'USD' | 'EUR' | 'GBP' | 'NZD' | 'CAD';
export type AppStage = 'home' | 'capture' | 'processing' | 'review' | 'people' | 'assign' | 'extras' | 'results';
export type ConfidenceState = 'good' | 'check';
export type ExtraKind = 'tax' | 'service' | 'surcharge' | 'discount' | 'tip' | 'adjustment';
export interface ReceiptItem {

  id: string;

  name: string;

  amount: MinorUnits;

  quantity: number;

  confidence: ConfidenceState;

  sourceLine?: string;

  ocrConfidence?: number;
}
export interface ReceiptExtra {

  id: string;

  kind: ExtraKind;

  label: string;

  amount: MinorUnits;
  /** Informational taxes already contained in the prices are NOT added again. */

  included: boolean;
}
export interface Receipt {

  id: string;

  label: string;

  currency: Currency;

  items: ReceiptItem[];

  extras: ReceiptExtra[];

  subtotal?: MinorUnits;

  total?: MinorUnits;

  originalTotal?: MinorUnits;

  totalSource: 'detected' | 'confirmed' | 'missing';

  warnings: string[];
}
export interface Participant {
  id: string;
  name: string;
  tone: number
 }
export interface ItemAssignment {
  itemId: string;
  participantIds: string[]
 }
export type Assignments = Record<string, string[]>;
export interface AllocationLine {

  id: string;

  label: string;

  amount: MinorUnits;

  kind: 'item' | ExtraKind;

  shared: boolean;
}
export interface PersonResult {

  participant: Participant;

  items: AllocationLine[];

  extras: AllocationLine[];

  subtotal: MinorUnits;

  total: MinorUnits;
}
export interface SplitResult {

  people: PersonResult[];

  itemTotal: MinorUnits;

  extrasTotal: MinorUnits;

  tipTotal: MinorUnits;

  receiptTotal: MinorUnits;

  total: MinorUnits;

  difference: MinorUnits;

  reconciled: boolean;
}
export interface TipSettings {

  mode: 'none' | 'percent' | 'custom';
  /** 1500 means 15.00%; integer basis points avoid decimal arithmetic. */

  basisPoints: number;

  customAmount: MinorUnits;
}
export type ExtraDistribution = 'proportional' | 'even';
export interface OCRBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number
 }
export interface OCRLine {
  text: string;
  confidence: number;
  bbox?: OCRBox
 }
export interface OCRResult {

  text: string;

  lines: OCRLine[];

  width: number;

  height: number;

  confidence: number;

  durationMs: number;
}
export type ScanPhase = 'preparing' | 'loading' | 'reading' | 'finding' | 'checking' | 'ready' | 'error';
export interface ScanState {

  phase: ScanPhase;

  progress: number | null;

  status: string;

  imageUrl: string | null;

  width: number;

  height: number;

  result: OCRResult | null;

  error: string | null;

  sample: boolean;
}
export interface AppState {

  stage: AppStage;

  receipt: Receipt;

  participants: Participant[];

  assignments: Assignments;

  tip: TipSettings;

  distribution: ExtraDistribution;

  scan: ScanState;

  demo: boolean;
}
