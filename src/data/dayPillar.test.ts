import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DAY_PILLAR, dayPillarKey, dayPillarOf } from './dayPillar.ts';

// 육십갑자는 천간 열과 지지 열둘이 짝수는 짝수끼리, 홀수는 홀수끼리 붙어서
// 예순 가지가 된다. 백스무 가지가 아니다. 표를 손으로 적었으니 그 예순이
// 하나도 안 빠졌는지, 없는 조합을 넣지는 않았는지 기계가 센다.
const 육십갑자: string[] = [];
for (let i = 0; i < 60; i += 1) 육십갑자.push(dayPillarKey(i % 10, i % 12));

test('예순 칸이 하나도 안 빠졌다', () => {
  const 없는것 = 육십갑자.filter((k) => !DAY_PILLAR[k]);
  assert.deepEqual(없는것, []);
  assert.equal(Object.keys(DAY_PILLAR).length, 60);
});

test('없는 조합은 표에도 없다', () => {
  const 있어야할것 = new Set(육십갑자);
  const 군더더기 = Object.keys(DAY_PILLAR).filter((k) => !있어야할것.has(k));
  assert.deepEqual(군더더기, []);
  // 갑축(0,1)은 육십갑자에 없는 짝이다. 있는 척하면 안 된다.
  assert.equal(dayPillarOf(0, 1), null);
  assert.ok(dayPillarOf(0, 0));
});

test('네 칸이 다 차 있다', () => {
  const 빈칸: string[] = [];
  for (const [k, v] of Object.entries(DAY_PILLAR)) {
    for (const f of ['nick', 'line', 'strong', 'watch'] as const) {
      if (!v[f] || v[f].trim().length < 6) 빈칸.push(`${k}.${f}`);
    }
  }
  assert.deepEqual(빈칸, []);
});

// 예순 가지를 적어놓고 열 가지 말만 돌려 쓰면 늘리나 마나다.
test('예순 사람이 서로 다른 말을 받는다', () => {
  for (const f of ['nick', 'line', 'strong', 'watch'] as const) {
    const seen = new Map<string, string>();
    const 겹침: string[] = [];
    for (const [k, v] of Object.entries(DAY_PILLAR)) {
      const before = seen.get(v[f]);
      if (before) 겹침.push(`${f}: ${before} 와 ${k} 가 같아요 - ${v[f]}`);
      seen.set(v[f], k);
    }
    assert.deepEqual(겹침, []);
  }
});

// 좋은 말만 적으면 '나를 봤다' 는 느낌이 안 생긴다. watch 는 늘 발목을
// 말해야 한다. '쉬워요' 로 끝나는지로 본다.
test('예순 칸 모두 발목 잡히는 데를 말한다', () => {
  const 안된것 = Object.entries(DAY_PILLAR)
    .filter(([, v]) => !/쉬워요[.]$/.test(v.watch))
    .map(([k]) => k);
  assert.deepEqual(안된것, []);
});

test('별명이 사람을 가리킨다', () => {
  const 안된것 = Object.entries(DAY_PILLAR)
    .filter(([, v]) => !v.nick.endsWith('사람'))
    .map(([k]) => k);
  assert.deepEqual(안된것, []);
});
