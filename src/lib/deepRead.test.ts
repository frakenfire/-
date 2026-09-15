import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';

const INPUT = { year: 1992, month: 3, day: 3, hour: 20 };
const P = computeFourPillars(INPUT);

function read(at: Date, concern: ConcernKey = 'work', gender: 'male' | 'female' = 'female') {
  const t = computeTiming(INPUT, P, gender, concern, at);
  return { t, r: buildDeepRead(P, t, concern, 'stay') };
}

test('같은 달 안에서는 같은 답이 나온다', () => {
  const a = read(new Date('2026-09-15T09:00:00+09:00'));
  const b = read(new Date('2026-09-15T21:30:00+09:00'));
  assert.deepEqual(a.r, b.r);
});

test('달이 바뀌면 답이 바뀐다', () => {
  // 열두 달을 돌면서 이번 달 풀이가 몇 가지로 갈리는지 본다.
  const heads = new Set<string>();
  const subs = new Set<string>();
  const acts = new Set<string>();
  for (let m = 0; m < 12; m += 1) {
    const { r } = read(new Date(Date.UTC(2026, m, 15, 3)));
    heads.add(r.slots[0].outer);
    subs.add(r.sub);
    acts.add(r.actions.join('|'));
  }
  assert.ok(subs.size >= 5, `이번 달 문장이 ${subs.size}가지뿐`);
  assert.ok(heads.size >= 5, `달 풀이가 ${heads.size}가지뿐`);
  assert.ok(acts.size >= 5, `할 일이 ${acts.size}가지뿐`);
});

test('해가 바뀌면 올해 줄이 바뀐다', () => {
  const y26 = read(new Date('2026-06-15T12:00:00+09:00')).r.yearLines[0];
  const y27 = read(new Date('2027-06-15T12:00:00+09:00')).r.yearLines[0];
  assert.notEqual(y26.label, y27.label);
  assert.notEqual(y26.v, y27.v);
});

test('고민이 다르면 답도 다르다', () => {
  const at = new Date('2026-09-15T12:00:00+09:00');
  const seen = new Set<string>();
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, at);
    const r = buildDeepRead(P, t, c.key, null);
    seen.add(r.sub + r.slots[0].inner);
  }
  assert.equal(seen.size, CONCERNS.length);
});

test('연애는 남녀가 보는 자리가 다르다', () => {
  const at = new Date('2026-09-15T12:00:00+09:00');
  const f = computeTiming(INPUT, P, 'female', 'love', at);
  const m = computeTiming(INPUT, P, 'male', 'love', at);
  assert.notDeepEqual(f.favor, m.favor);
});

test('모든 고민에서 문장이 비지 않는다', () => {
  const at = new Date('2026-11-20T12:00:00+09:00');
  for (const c of CONCERNS) {
    for (const o of c.options) {
      const t = computeTiming(INPUT, P, 'male', c.key, at);
      const r = buildDeepRead(P, t, c.key, o.key);
      assert.ok(r.headline.length > 4, `${c.key}/${o.key} 결론 비었음`);
      assert.ok(r.sub.length > 10);
      assert.ok(r.situationLine.length > 10);
      assert.equal(r.actions.length, 3);
      assert.ok(r.actions.every((a) => a.length > 5));
      assert.ok(r.slots.length >= 2);
      assert.ok(r.slots.every((s) => s.outer && s.inner && s.note));
      assert.equal(r.yearLines.length, 2);
      assert.ok(r.daeunLine.length > 20);
      assert.ok(r.why.length === 5);
    }
  }
});

test('할 일에 같은 문장이 두 번 나오지 않는다', () => {
  for (let m = 0; m < 12; m += 1) {
    const { r } = read(new Date(Date.UTC(2026, m, 15, 3)), 'money');
    assert.equal(new Set(r.actions).size, r.actions.length, `${m + 1}월에 중복`);
  }
});
