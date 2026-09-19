import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solarToLunar, lunarToSolar, leapMonthOf, lunarMonthLength } from './lunar.ts';

const iso = (o: { year: number; month: number; day: number } | null) =>
  o ? `${o.year}-${String(o.month).padStart(2, '0')}-${String(o.day).padStart(2, '0')}` : 'null';

// 설날과 추석은 온 나라가 아는 날짜다. 이 엔진에 대고 확인할 수 있는
// 몇 안 되는 외부 기준점이고, 표를 베끼지 않았다는 증거이기도 하다.
test('설날(음력 1월 1일)이 달력과 맞는다', () => {
  const cases: [number, string][] = [
    [1998, '1998-01-28'],
    [2000, '2000-02-05'],
    [2010, '2010-02-14'],
    [2020, '2020-01-25'],
    [2023, '2023-01-22'],
    [2024, '2024-02-10'],
    [2025, '2025-01-29'],
    [2026, '2026-02-17'],
  ];
  for (const [y, want] of cases) {
    assert.equal(iso(lunarToSolar(y, 1, 1)), want, `${y}년 설날`);
  }
});

test('추석(음력 8월 15일)이 달력과 맞는다', () => {
  const cases: [number, string][] = [
    [2020, '2020-10-01'],
    [2023, '2023-09-29'],
    [2024, '2024-09-17'],
    [2025, '2025-10-06'],
    [2026, '2026-09-25'],
  ];
  for (const [y, want] of cases) {
    assert.equal(iso(lunarToSolar(y, 8, 15)), want, `${y}년 추석`);
  }
});

test('윤달이 든 해와 그 번호가 맞는다', () => {
  const cases: [number, number][] = [
    [2012, 3],
    [2014, 9],
    [2017, 5],
    [2020, 4],
    [2023, 2],
    [2025, 6],
  ];
  for (const [y, want] of cases) assert.equal(leapMonthOf(y), want, `${y}년 윤달`);
});

test('윤달이 없는 해는 없다고 한다', () => {
  for (const y of [2018, 2019, 2021, 2022, 2024, 2026]) {
    assert.equal(leapMonthOf(y), null, `${y}년`);
  }
});

test('양력에서 음력으로 갔다 돌아와도 같은 날', () => {
  // 1930년은 이 앱이 받는 가장 이른 해다. 경계를 같이 본다.
  for (const s of ['1930-01-01', '1975-06-11', '1988-02-17', '2026-09-19', '2026-12-31']) {
    const [y, m, d] = s.split('-').map(Number);
    const l = solarToLunar(y, m, d);
    assert.equal(iso(lunarToSolar(l.year, l.month, l.day, l.leap)), s, s);
  }
});

test('하루씩 걸어도 음력 날짜가 끊기지 않는다', () => {
  // 윤2월이 든 2023년 한 해. 달이 바뀔 때마다 1일로 떨어지고,
  // 그 외에는 꼭 하루씩 오른다.
  let prev = solarToLunar(2023, 1, 1);
  const start = Date.UTC(2023, 0, 1);
  for (let i = 1; i < 365; i += 1) {
    const t = new Date(start + i * 86400000);
    const cur = solarToLunar(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    if (cur.day === 1) {
      // 달이 넘어갔다면 앞 달의 마지막 날은 29일이나 30일이어야 한다
      assert.ok(prev.day === 29 || prev.day === 30, `달 끝이 ${prev.day}일`);
    } else {
      assert.equal(cur.day, prev.day + 1, `${t.toISOString().slice(0, 10)}`);
    }
    prev = cur;
  }
});

test('달의 길이는 29일이나 30일뿐이다', () => {
  for (let y = 1930; y <= 2030; y += 1) {
    for (let m = 1; m <= 12; m += 1) {
      const n = lunarMonthLength(y, m);
      assert.ok(n === 29 || n === 30, `${y}년 ${m}월이 ${n}일`);
    }
    const leap = leapMonthOf(y);
    if (leap !== null) {
      const n = lunarMonthLength(y, leap, true);
      assert.ok(n === 29 || n === 30, `${y}년 윤${leap}월이 ${n}일`);
    }
  }
});

test('한 해는 12달이거나 13달이고, 윤달은 많아야 하나', () => {
  for (let y = 1930; y <= 2030; y += 1) {
    let count = 0;
    for (let m = 1; m <= 12; m += 1) if (lunarMonthLength(y, m) !== null) count += 1;
    assert.equal(count, 12, `${y}년 평달 수`);
    const leap = leapMonthOf(y);
    if (leap !== null) assert.ok(leap >= 1 && leap <= 12, `${y}년 윤${leap}월`);
  }
});

test('없는 날짜는 null 로 돌려준다', () => {
  // 2024년은 윤달이 없다
  assert.equal(lunarToSolar(2024, 5, 1, true), null);
  // 29일로 끝나는 달의 30일
  const short = (() => {
    for (let m = 1; m <= 12; m += 1) if (lunarMonthLength(2024, m) === 29) return m;
    return 1;
  })();
  assert.equal(lunarToSolar(2024, short, 30), null);
  assert.equal(lunarToSolar(2024, 13, 1), null);
  assert.equal(lunarToSolar(2024, 1, 31), null);
});

test('윤달과 같은 번호의 평달은 서로 다른 날이다', () => {
  // 2023년 2월과 윤2월. 같은 번호지만 한 달 차이여야 한다.
  const plain = lunarToSolar(2023, 2, 1, false)!;
  const leap = lunarToSolar(2023, 2, 1, true)!;
  const gap =
    Date.UTC(leap.year, leap.month - 1, leap.day) - Date.UTC(plain.year, plain.month - 1, plain.day);
  const days = gap / 86400000;
  assert.ok(days === 29 || days === 30, `${days}일 차이`);
});
