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

// 사장님 본보기(2026-10-12): 할 것 제목은 '~해보세요, ~하세요' 로 오늘 할 일 한 문장,
// 하지 말 것 제목은 '~하지 마세요' 한 문장이다. 'A보다 B가 나아요' 로 돌려 말하면
// 무엇을 하지 말라는 건지 한 번 더 읽어야 했다.
function titleShape(doIt: string, avoid: string): string | null {
  if (!/세요\.$/.test(doIt) || /마세요/.test(doIt)) return `할 것이 '~세요.' 로 끝나는 할 일이 아니에요: ${doIt}`;
  if (!/마세요\.$/.test(avoid)) return `하지 말 것이 '~하지 마세요.' 로 끝나지 않아요: ${avoid}`;
  for (const t of [doIt, avoid]) {
    if (t.length < 15 || t.length > 35) return `제목은 15~35자예요(${t.length}자): ${t}`;
    if (t.split(/(?<=[.?!])\s+/).length !== 1) return `제목은 한 문장이에요: ${t}`;
  }
  return null;
}

test('할 것은 할 일 한 문장, 하지 말 것은 하지 마세요 한 문장이다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) for (const o of c.options) for (const g of GODS) {
    const a = dayActOf(c.key, o.key, g);
    const why = titleShape(a.doIt, a.avoid);
    if (why) bad.push(`${c.key}/${o.key}/${g} ${why}`);
  }
  assert.deepEqual(bad, []);
});

test('제목 모양을 보는 눈이 살아 있다', () => {
  assert.equal(titleShape('관심 있는 채용 공고 두 개를 저장하세요.', '감정적으로 퇴사 이야기를 꺼내지 마세요.'), null);
  assert.ok(titleShape('퇴근 뒤 공고는 30분만 보는 게 나아요.', '감정적으로 퇴사 이야기를 꺼내지 마세요.'));
  assert.ok(titleShape('관심 있는 채용 공고 두 개를 저장하세요.', '사직서는 옮길 곳이 정해진 뒤에 내는 게 나아요.'));
  assert.ok(titleShape('저장하세요.', '감정적으로 퇴사 이야기를 꺼내지 마세요.'));
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
