import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDaeun, daeunStartAge, isYangYearStem } from './daeun.ts';
import { computeFourPillars } from './fourPillars.ts';

const NOW = new Date('2026-09-15T12:00:00+09:00');

test('양년 남자는 순행, 양년 여자는 역행', () => {
  // 1984년은 갑자년 — 갑은 양간
  const input = { year: 1984, month: 6, day: 15, hour: 10 };
  const p = computeFourPillars(input);
  assert.equal(isYangYearStem(p.year.stem), true);
  assert.equal(computeDaeun(input, p, 'male', NOW).forward, true);
  assert.equal(computeDaeun(input, p, 'female', NOW).forward, false);
});

test('음년 남자는 역행, 음년 여자는 순행', () => {
  // 1985년은 을축년 — 을은 음간
  const input = { year: 1985, month: 6, day: 15, hour: 10 };
  const p = computeFourPillars(input);
  assert.equal(isYangYearStem(p.year.stem), false);
  assert.equal(computeDaeun(input, p, 'male', NOW).forward, false);
  assert.equal(computeDaeun(input, p, 'female', NOW).forward, true);
});

test('대운수는 1에서 10 사이', () => {
  for (const [y, m, d] of [
    [1970, 1, 3],
    [1988, 2, 4],
    [1995, 7, 22],
    [2001, 11, 30],
    [2010, 5, 5],
  ] as const) {
    const input = { year: y, month: m, day: d, hour: 9 };
    for (const forward of [true, false]) {
      const age = daeunStartAge(input, forward);
      assert.ok(age >= 1 && age <= 10, `${y}-${m}-${d} ${forward} → ${age}`);
    }
  }
});

test('순행과 역행의 대운수를 더하면 한 절기 길이(약 10)가 된다', () => {
  // 절입에서 절입까지는 약 30일. 3일이 1년이니 두 방향의 합은 10 언저리다.
  const input = { year: 1993, month: 4, day: 18, hour: 14 };
  const sum = daeunStartAge(input, true) + daeunStartAge(input, false);
  assert.ok(sum >= 9 && sum <= 11, `합이 ${sum}`);
});

test('대운 기둥은 월주에서 한 칸씩 옮겨간다', () => {
  const input = { year: 1990, month: 8, day: 8, hour: 7 };
  const p = computeFourPillars(input);
  const set = computeDaeun(input, p, 'male', NOW);
  const step = set.forward ? 1 : -1;
  set.pillars.forEach((pillar, i) => {
    const expected = (((p.month.ganzhi + step * (i + 1)) % 60) + 60) % 60;
    assert.equal(pillar.ganzhi, expected);
  });
});

test('대운은 열 해씩 이어지고 지금 대운이 잡힌다', () => {
  const input = { year: 1992, month: 3, day: 3, hour: 20 };
  const p = computeFourPillars(input);
  const set = computeDaeun(input, p, 'female', NOW);
  assert.equal(set.pillars.length, 10);
  set.pillars.forEach((pillar, i) => {
    assert.equal(pillar.endAge - pillar.startAge, 9);
    if (i > 0) assert.equal(pillar.startAge, set.pillars[i - 1].endAge + 1);
  });
  assert.ok(set.age >= 33 && set.age <= 35, `만 나이 ${set.age}`);
  assert.ok(set.current, '서른 넘은 사람은 대운 안에 있다');
  assert.ok(set.yearsToNext !== null && set.yearsToNext >= 1 && set.yearsToNext <= 10);
});

test('시각을 몰라도 대운이 나온다', () => {
  const input = { year: 1988, month: 9, day: 12, hour: null };
  const p = computeFourPillars(input);
  const set = computeDaeun(input, p, 'male', NOW);
  assert.ok(set.startAge >= 1 && set.startAge <= 10);
  assert.equal(set.pillars.length, 10);
});
