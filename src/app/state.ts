import type { AppStage, AppState, OCRResult, Participant, Receipt, ReceiptExtra, ReceiptItem, ScanState, TipSettings, ExtraDistribution, Currency } from '../types/index.ts';
import { assignmentCount, calculateSplit, reconciliation } from '../features/splitting/engine.ts';
import { assertMoney } from '../lib/money.ts';

export function emptyReceipt(): Receipt {

  return { id: 'manual-receipt', label: 'Dinner with friends', currency: 'AUD', items: [], extras: [], totalSource: 'missing', warnings: [] };
}
export const emptyScan: ScanState = { phase: 'preparing', progress: null, status: 'Preparing image', imageUrl: null, width: 0, height: 0, result: null, error: null, sample: false };
export function initialState(): AppState {

  return { stage: 'home', receipt: emptyReceipt(), participants: [], assignments: {}, tip: { mode: 'none', basisPoints: 1500, customAmount: 0 }, distribution: 'proportional', scan: { ...emptyScan }, demo: false };
}
export type Action =
  | {
    type: 'GO';
    stage: AppStage
   }
  | {
    type: 'RESET'
   }
  | {
    type: 'MANUAL'
   }
  | {
    type: 'SCAN_START';
    imageUrl: string;
    sample: boolean
   }
  | {
    type: 'SCAN_UPDATE';
    scan: Partial<ScanState>
   }
  | {
    type: 'SCAN_DONE';
    receipt: Receipt;
    result: OCRResult;
    people?: Participant[]
   }
  | {
    type: 'RECEIPT_META';
    label?: string;
    currency?: Currency;
    total?: number;
    clearTotal?: boolean
   }
  | {
    type: 'CONFIRM_TOTAL';
    total: number
   }
  | {
    type: 'SAVE_ITEM';
    item: ReceiptItem
   }
  | {
    type: 'DELETE_ITEM';
    id: string
   }
  | {
    type: 'CONFIRM_ITEM';
    id: string
   }
  | {
    type: 'ADD_PERSON';
    person: Participant
   }
  | {
    type: 'RENAME_PERSON';
    id: string;
    name: string
   }
  | {
    type: 'REMOVE_PERSON';
    id: string
   }
  | {
    type: 'RESTORE_PERSON';
    person: Participant;
    index: number;
    itemIds: string[]
   }
  | {
    type: 'TOGGLE_ASSIGNMENT';
    itemId: string;
    personId: string
   }
  | {
    type: 'ASSIGN_EVERYONE';
    itemId: string
   }
  | {
    type: 'ASSIGN_REMAINING'
   }
  | {
    type: 'SAVE_EXTRA';
    extra: ReceiptExtra
   }
  | {
    type: 'DELETE_EXTRA';
    id: string
   }
  | {
    type: 'SET_TIP';
    tip: TipSettings
   }
  | {
    type: 'SET_DISTRIBUTION';
    distribution: ExtraDistribution
   };
export function canEnter(state: AppState, stage: AppStage): boolean {

  if (['home', 'capture', 'review'].includes(stage)) return true;

  if (stage === 'processing') return false; // Only SCAN_START enters processing.

  if (!state.receipt.items.length || !reconciliation(state.receipt).matched) return false;

  if (stage === 'people') return true;

  if (!state.participants.length) return false;

  if (stage === 'assign') return true;

  if (assignmentCount(state.receipt, state.assignments, state.participants) !== state.receipt.items.length) return false;

  if (stage === 'extras') return true;

  try {
    return calculateSplit(state.receipt, state.participants, state.assignments, state.tip, state.distribution).reconciled;
  } catch {
    return false;
  }
}
function validAmount(amount: number): boolean {
  try {
    assertMoney(amount);
    return true;
  } catch {
    return false;
  }
}
export function reducer(state: AppState, action: Action): AppState {

  switch (action.type) {
    case 'RESET': return initialState();
    case 'GO': return canEnter(state, action.stage) ? { ...state, stage: action.stage } : state;
    case 'MANUAL': return { ...initialState(), stage: 'review', participants: state.participants };
    case 'SCAN_START': return { ...state, stage: 'processing', demo: action.sample, scan: { ...emptyScan, imageUrl: action.imageUrl, sample: action.sample } };
    case 'SCAN_UPDATE': return { ...state, scan: { ...state.scan, ...action.scan } };
    case 'SCAN_DONE': return {
      ...state, receipt: action.receipt, assignments: {}, participants: action.people ?? state.participants,
      tip: { mode: 'none', basisPoints: 1500, customAmount: 0 }, scan: { ...state.scan, result: action.result, phase: 'ready', progress: 1, status: 'Receipt ready', error: null }
    };
    case 'RECEIPT_META': {

      if (action.total !== undefined && (!validAmount(action.total) || action.total < 0)) return state;

      return {
        ...state, receipt: {
          ...state.receipt,
          ...(action.label !== undefined ? { label: action.label.trim().slice(0, 64) || 'Dinner with friends' } : {}),
          ...(action.currency ? { currency: action.currency } : {}),
          ...(action.total !== undefined ? { total: action.total, totalSource: 'confirmed' as const } : {}),
          ...(action.clearTotal ? { total: undefined, totalSource: 'missing' as const } : {}),
        }
      };

    }
    case 'CONFIRM_TOTAL': return validAmount(action.total) && action.total >= 0 ? { ...state, receipt: { ...state.receipt, total: action.total, totalSource: 'confirmed' } } : state;
    case 'SAVE_ITEM': {

      if (!action.item.name.trim() || !validAmount(action.item.amount) || action.item.amount < 0) return state;

      const exists = state.receipt.items.some(item => item.id === action.item.id);

      if (!exists && state.receipt.items.length >= 500) return state;

      const item = { ...action.item, name: action.item.name.trim().slice(0, 100), confidence: 'good' as const };

      return { ...state, receipt: { ...state.receipt, items: exists ? state.receipt.items.map(old => old.id === item.id ? item : old) : [...state.receipt.items, item] } };

    }
    case 'DELETE_ITEM': {

      const assignments = { ...state.assignments };
      delete assignments[action.id];

      return { ...state, assignments, receipt: { ...state.receipt, items: state.receipt.items.filter(item => item.id !== action.id) } };

    }
    case 'CONFIRM_ITEM': return { ...state, receipt: { ...state.receipt, items: state.receipt.items.map(item => item.id === action.id ? { ...item, confidence: 'good' } : item) } };
    case 'ADD_PERSON': {

      const name = action.person.name.trim().slice(0, 32);

      if (!name || state.participants.length >= 20 || state.participants.some(person => person.id === action.person.id || person.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return state;

      return { ...state, participants: [...state.participants, { ...action.person, name }] };

    }
    case 'RENAME_PERSON': {

      const name = action.name.trim().slice(0, 32);

      if (!name || state.participants.some(person => person.id !== action.id && person.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return state;

      return { ...state, participants: state.participants.map(person => person.id === action.id ? { ...person, name } : person) };

    }
    case 'REMOVE_PERSON': return { ...state, participants: state.participants.filter(person => person.id !== action.id), assignments: Object.fromEntries(Object.entries(state.assignments).map(([itemId, ids]) => [itemId, ids.filter(id => id !== action.id)])) };
    case 'RESTORE_PERSON': {
      const name = action.person.name.trim().slice(0, 32);
      if (!name || !Number.isInteger(action.index) || action.index < 0 || state.participants.length >= 20 || state.participants.some(person => person.id === action.person.id || person.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return state;
      const participants = [...state.participants];
      // Restore original table order: this is also the exact-cent tie-break order.
      participants.splice(Math.min(action.index, participants.length), 0, { ...action.person, name });
      const assignments = { ...state.assignments };
      const existingItems = new Set(state.receipt.items.map(item => item.id));
      for (const itemId of new Set(action.itemIds)) {
        if (existingItems.has(itemId)) assignments[itemId] = [...new Set([...(assignments[itemId] ?? []), action.person.id])];
      }
      return { ...state, participants, assignments };
    }
    case 'TOGGLE_ASSIGNMENT': {

      if (!state.receipt.items.some(item => item.id === action.itemId) || !state.participants.some(person => person.id === action.personId)) return state;

      const current = state.assignments[action.itemId] ?? [];

      return { ...state, assignments: { ...state.assignments, [action.itemId]: current.includes(action.personId) ? current.filter(id => id !== action.personId) : [...current, action.personId] } };

    }
    case 'ASSIGN_EVERYONE': return { ...state, assignments: { ...state.assignments, [action.itemId]: state.participants.map(person => person.id) } };
    case 'ASSIGN_REMAINING': return { ...state, assignments: { ...state.assignments, ...Object.fromEntries(state.receipt.items.filter(item => !(state.assignments[item.id]?.length)).map(item => [item.id, state.participants.map(person => person.id)])) } };
    case 'SAVE_EXTRA': {

      if (!validAmount(action.extra.amount) || !action.extra.label.trim()) return state;

      const extra = { ...action.extra, label: action.extra.label.trim().slice(0, 64), amount: action.extra.kind === 'discount' ? -Math.abs(action.extra.amount) : action.extra.amount };

      return { ...state, receipt: { ...state.receipt, extras: state.receipt.extras.some(old => old.id === extra.id) ? state.receipt.extras.map(old => old.id === extra.id ? extra : old) : [...state.receipt.extras, extra] } };

    }
    case 'DELETE_EXTRA': return { ...state, receipt: { ...state.receipt, extras: state.receipt.extras.filter(extra => extra.id !== action.id) } };
    case 'SET_TIP': return { ...state, tip: action.tip };
    case 'SET_DISTRIBUTION': return { ...state, distribution: action.distribution };
  }
}
export const previousStage: Partial<Record<AppStage, AppStage>> = { capture: 'home', processing: 'capture', review: 'capture', people: 'review', assign: 'people', extras: 'assign', results: 'extras' };
