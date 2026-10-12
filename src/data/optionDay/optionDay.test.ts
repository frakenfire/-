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

// 할 것과 미룰 것은 카드의 굵은 첫 문장이다. 한 문장으로, 무엇을 하는지가 보이게 쓴다.
// 끝맺음은 정하지 않는다. '~하세요' 만 늘어놓으면 AI 가 쓴 명령문처럼 읽힌다는
// 지적(2026-10-12)을 받았다. 명령이 몇 개인지는 copyQuality.test 가 본다.
function titleShape(doIt: string, avoid: string): string | null {
  for (const t of [doIt, avoid]) {
    if (!/요\.$/.test(t)) return `제목이 말로 끝나지 않아요: ${t}`;
    if (t.length < 15 || t.length > 50) return `제목은 15~50자예요(${t.length}자): ${t}`;
    if (t.split(/(?<=[.?!])\s+/).length !== 1) return `제목은 한 문장이에요: ${t}`;
  }
  return null;
}

test('할 것과 미룰 것의 제목은 한 문장이다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) for (const o of c.options) for (const g of GODS) {
    const a = dayActOf(c.key, o.key, g);
    const why = titleShape(a.doIt, a.avoid);
    if (why) bad.push(`${c.key}/${o.key}/${g} ${why}`);
  }
  assert.deepEqual(bad, []);
});

test('제목 모양을 보는 눈이 살아 있다', () => {
  assert.equal(titleShape('답답한 부분이 있다면 믿을 만한 사람에게 의견을 구해보세요.', '오랜만에 연락하면서 곧바로 부탁부터 꺼내는 건 피하는 편이 좋겠어요.'), null);
  assert.ok(titleShape('저장하세요.', '오랜만에 연락하면서 곧바로 부탁부터 꺼내는 건 피하는 편이 좋겠어요.'));
  assert.ok(titleShape('믿을 만한 사람에게 의견을 구해보세요. 생각보다 가까이 있어요.', '부탁부터 꺼내는 건 피하는 편이 좋겠어요.'));
});

// 설명은 한두 문장이다. 첫 문장은 구체적으로 어떻게, 둘째 문장은 그러면 무엇이
// 좋은지. 길면 화면에서 안 읽히고, 짧으면 어떻게 하라는 건지가 빠진다.
test('설명은 한두 문장, 25~90자다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) for (const o of c.options) for (const g of GODS) {
    const a = dayActOf(c.key, o.key, g);
    for (const t of [a.doWhy, a.avoidWhy]) {
      const n = t.split(/(?<=[.?!])\s+/).length;
      if (n < 1 || n > 2 || t.length < 25 || t.length > 90) bad.push(`${c.key}/${o.key}/${g} (${n}문장 ${t.length}자) ${t}`);
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
