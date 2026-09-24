import { describe, it, expect } from 'vitest';
import { initialState, reducer } from '../../src/app/state.ts';
import { calculateSplit } from '../../src/features/splitting/engine.ts';
import type { AppState, Participant } from '../../src/types/index.ts';

const people: Participant[] = [{ id:'a', name:'Alex', tone:0 }, { id:'b', name:'Bea', tone:1 }, { id:'c', name:'Cam', tone:2 }];
function bill(): AppState {
  return { ...initialState(), participants:people, receipt:{ id:'r', label:'Table', currency:'AUD', items:[{ id:'i', name:'Shared item', amount:1, quantity:1, confidence:'good' }], extras:[], total:1, totalSource:'confirmed', warnings:[] }, assignments:{ i:['a','b','c'] } };
}
describe('undoing a participant removal', () => {
  it('restores table order, previous claims, and the original odd-cent recipient', () => {
    const original = bill();
    const removed = reducer(original, { type:'REMOVE_PERSON', id:'a' });
    const restored = reducer(removed, { type:'RESTORE_PERSON', person:people[0]!, index:0, itemIds:['i'] });
    expect(restored.participants.map(p => p.id)).toEqual(['a','b','c']);
    const split = calculateSplit(restored.receipt, restored.participants, restored.assignments, restored.tip);
    expect(split.people.map(p => p.total)).toEqual([1,0,0]);
    expect(split.total).toBe(1);
  });
  it('restores only existing items, without duplicate claims or changing other people', () => {
    const removed = reducer(bill(), { type:'REMOVE_PERSON', id:'b' });
    const restored = reducer(removed, { type:'RESTORE_PERSON', person:people[1]!, index:1, itemIds:['i','i','deleted-item'] });
    expect(restored.participants.map(p => p.id)).toEqual(['a','b','c']);
    expect(restored.assignments.i).toEqual(['a','c','b']);
    expect(restored.assignments['deleted-item']).toBeUndefined();
    expect(reducer(restored, { type:'RESTORE_PERSON', person:people[1]!, index:1, itemIds:['i'] })).toBe(restored);
  });
  it('rejects restoration into a duplicate name or a full table', () => {
    const removed = reducer(bill(), { type:'REMOVE_PERSON', id:'b' });
    const duplicate = reducer(removed, { type:'ADD_PERSON', person:{ id:'d', name:'BEA', tone:1 } });
    expect(reducer(duplicate, { type:'RESTORE_PERSON', person:people[1]!, index:1, itemIds:['i'] })).toBe(duplicate);
    const full = { ...removed, participants:Array.from({ length:20 }, (_, i) => ({ id:`p${i}`, name:`Person ${i}`, tone:0 })) };
    expect(reducer(full, { type:'RESTORE_PERSON', person:people[1]!, index:1, itemIds:['i'] })).toBe(full);
  });
});
