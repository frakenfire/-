import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONCERNS } from '../concerns.ts';
import { TEN_GOD_KO, type TenGod } from '../../lib/tenGods.ts';
import { dayActOf } from './index.ts';

// 오늘 할 것과 하지 말 것은 고른 상황마다 따로 쓴다. 고민 단위 한 벌을 돌려쓰던
// 때는 '나가는 게 너무 많아요' 를 고른 사람에게 새 돈벌이를 찾으라는 말이 나갔다.
const GODS = Object.keys(TEN_GOD_KO) as TenGod[];

test('스물네 상황 x 열 칸이 다 차 있고, 한 고민 안에서 같은 문장이 없다', () => {
  let cells = 0;
  for (const c of CONCERNS) {
    const seen = new Map<string, string>();
    for (const o of c.options) {
      for (const g of GODS) {
        const a = dayActOf(c.key, o.key, g);
        assert.ok(a, `${c.key}/${o.key}/${g} 칸이 없어요`);
        cells += 1;
        for (const [k, t] of Object.entries(a)) {
          assert.ok(t.length >= 12, `${c.key}/${o.key}/${g}.${k} 너무 짧아요: ${t}`);
          const prev = seen.get(t);
          assert.ok(!prev, `${c.key}: '${t}' 가 ${prev} 와 ${o.key}/${g}.${k} 에 두 번 있어요`);
          seen.set(t, `${o.key}/${g}.${k}`);
        }
      }
    }
  }
  assert.equal(cells, 240);
});

test('까닭은 두 문장이다 - 오늘 왜 그런지, 그러면 무엇이 달라지는지', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) for (const o of c.options) for (const g of GODS) {
    const a = dayActOf(c.key, o.key, g);
    for (const t of [a.doWhy, a.avoidWhy]) {
      if (t.split(/(?<=[.?!])\s+/).length !== 2) bad.push(`${c.key}/${o.key}/${g} ${t}`);
    }
  }
  assert.deepEqual(bad, []);
});

// 그 상황이 아니면 할 수 없는 말
const BY_SITUATION: Record<string, RegExp> = {
  'work/stay': /개업|사업|손님|매출|첫 자리/,
  'work/rest': /맡은|동료|같은 팀|사내|출근|승진|지금 회사|개업|사업|손님|매출|상사|회사에서/,
  'work/start': /승진|경력을|재직|이직|지금 회사|개업|사업|손님|매출|동료|상사/,
  'work/own': /지원(?!금)|채용|이력서|면접|입사|취업|합격|승진|이직|연봉|상사/,
  'love/alone': /상대|사귀는|연인|우리 사이|만나면|애인/,
  'love/some': /연인|우리 사이|애인/,
  'love/couple': /소개받|새 사람/,
  'love/past': /사귀자|만나면/,
  'people/work': /가족/,
  'people/friend': /가족|동료/,
  'people/family': /동료|회사/,
  'people/new': /가족|오래 못 본|오래 안 본/,
};

test('상황과 부딪히는 오늘 할 일이 없다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) for (const o of c.options) {
    const re = BY_SITUATION[`${c.key}/${o.key}`];
    if (!re) continue;
    for (const g of GODS) for (const [k, t] of Object.entries(dayActOf(c.key, o.key, g))) {
      const m = t.match(re);
      if (m) bad.push(`${c.key}/${o.key} ${g}.${k} [${m[0]}] ${t}`);
    }
  }
  assert.deepEqual(bad, []);
  // 눈이 살아 있는지
  assert.ok(BY_SITUATION['work/rest'].test('동료에게 먼저 물어보세요.'));
});

test('상황을 안 골랐으면 기본 상황 칸을 쓴다', () => {
  for (const c of CONCERNS) {
    const a = dayActOf(c.key, null, 'bijian');
    assert.ok(c.options.some((o) => dayActOf(c.key, o.key, 'bijian') === a), c.key);
    assert.equal(dayActOf(c.key, 'nope', 'bijian'), a);
  }
});
