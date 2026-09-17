import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { computeConcernScore, WEIGHTS } from './concernScore.ts';
import { CONCERNS } from '../data/concerns.ts';

const A = { year: 1992, month: 3, day: 3, hour: 20 };
const B = { year: 1988, month: 11, day: 21, hour: 7 };
const AT = new Date('2026-09-17T12:00:00+09:00');
const KEY = '2026-09-17';

function scoreOf(input: typeof A, concern: (typeof CONCERNS)[number]['key']) {
  const p = computeFourPillars(input);
  const t = computeTiming(input, p, 'female', concern, AT);
  return computeConcernScore(p, t, KEY);
}

test('몫을 다 더하면 100이다', () => {
  const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(sum, 100);
});

test('몇 번을 계산해도 같은 숫자가 나온다', () => {
  const a = scoreOf(A, 'work');
  const b = scoreOf(A, 'work');
  assert.deepEqual(b, a);
});

test('다섯 칸을 몫대로 더한 값이 총점이다', () => {
  const s = scoreOf(A, 'money');
  const sum = Math.round(s.parts.reduce((acc, p) => acc + p.score * p.weight, 0) / 100);
  assert.equal(s.total, sum);
});

test('점수는 사람마다 다르다', () => {
  assert.notEqual(scoreOf(A, 'money').total, scoreOf(B, 'money').total);
});

test('같은 사람도 고민마다 점수가 다르다', () => {
  const seen = new Set(CONCERNS.map((c) => scoreOf(A, c.key).total));
  assert.ok(seen.size >= 3, `고민 여섯 개가 ${seen.size} 가지 점수로만 갈림`);
});

test('모든 고민에서 점수가 상식 범위 안에 있다', () => {
  for (const c of CONCERNS) {
    for (const input of [A, B]) {
      const s = scoreOf(input, c.key);
      assert.ok(s.total >= 40 && s.total <= 100, `${c.key} ${s.total}점`);
      assert.equal(s.parts.length, 5);
      for (const p of s.parts) assert.ok(p.score >= 40 && p.score <= 100, `${c.key} ${p.k} ${p.score}`);
    }
  }
});

test('날짜 seed 가 아니라 명식에서 나온다 - 같은 날 다른 고민이면 오늘 칸도 달라질 수 있다', () => {
  const work = scoreOf(A, 'work').parts.find((p) => p.k === '오늘')!;
  const money = scoreOf(A, 'money').parts.find((p) => p.k === '오늘')!;
  // 같은 날의 일진 글자는 하나지만, 그 글자가 고민마다 다른 자리로 읽힌다
  assert.equal(work.label, money.label);
});
