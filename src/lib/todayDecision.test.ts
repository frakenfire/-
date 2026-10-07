import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';
import { TEN_GOD_KO, type TenGod } from './tenGods.ts';
import { composeTodayDecision } from './todayDecision.ts';
import { todayVibe } from './dayVibe.ts';
import type { TodayDecision } from '../types/fortune.ts';
import type { Band } from './timing.ts';

// 결과 맨 위 결론 카드. '둥글게 말해서 오늘 뭘 하라는 건지 모르겠다' 는 말을
// 듣고 오늘 전체 종합 / 할 것과 까닭 / 하지 말 것과 까닭 다섯 칸으로 못
// 박았다. 이 다섯 칸이 비거나, 서로 같은 말을 하거나, 서로 반대로 말하면
// 카드를 만든 뜻이 없다.
//
// 샘플 생년월일 몇 개로만 보면 그 사람들에게 걸린 칸만 본다. 그래서 조합을
// 전부 조립한다. 고민 여섯 x 상황 넷 x 밴드 셋 x 위 글자 열 x 아래 글자 열 = 칠천이백 개.
// 전체 종합은 칸마다 네 벌을 날짜로 돌려 고른다(pick). 한 벌만 보면 나머지 세 벌이
// 할 것과 반대로 말해도 모른다. 그래서 네 벌을 다 곱해 이만 팔천팔백 개.

const BANDS: Band[] = ['good', 'ok', 'hard'];
const PICKS = [0, 1, 2, 3];
const GODS = Object.keys(TEN_GOD_KO) as TenGod[];

type Case = { where: string; concern: ConcernKey | null; option: string | null; d: TodayDecision };

const ALL: Case[] = (() => {
  const out: Case[] = [];
  for (const c of CONCERNS) {
    for (const o of c.options) {
      for (const b of BANDS) {
        for (const p of PICKS) {
          for (const g of GODS) {
            // 할 것은 위 글자, 하지 말 것은 아래 글자에서 따로 고른다. 두 글자 조합을 전부 본다.
            for (const g2 of GODS) {
              out.push({ where: `${c.key}/${o.key}/${b}/${p}/${g}+${g2}`, concern: c.key, option: o.key, d: composeTodayDecision(c.key, o.key, b, g, g2, p) });
            }
          }
        }
      }
    }
  }
  // 고민을 안 고르고 뽑은 결과. 날짜로 열 칸 중 하나가 나온다 - 열흘이면 다 돈다
  // 는 보장이 없어서 한 해를 다 돌려 열 칸을 전부 모은다.
  const seen = new Set<string>();
  for (let day = 0; day < 366; day += 1) {
    const dt = new Date(Date.UTC(2026, 0, 1 + day));
    const key = dt.toISOString().slice(0, 10);
    const v = todayVibe(key);
    if (seen.has(v.head)) continue;
    seen.add(v.head);
    out.push({ where: `일반/${v.head}`, concern: null, option: null, d: v.decision });
  }
  return out;
})();

const fields = (d: TodayDecision) => [
  ['전체 종합', d.overall.headline],
  ['종합 설명', d.overall.summary],
  ['할 것', d.do.action],
  ['할 것의 까닭', d.do.why],
  ['하지 말 것', d.dont.action],
  ['하지 말 것의 까닭', d.dont.why],
] as const;

test('조합을 빠짐없이 돌았다', () => {
  assert.equal(ALL.filter((x) => x.concern).length, 7200 * PICKS.length);
  assert.equal(ALL.filter((x) => !x.concern).length, 10, '일반 쪽지 열 칸이 다 안 모였어요');
});

test('다섯 칸이 하나도 비어 있지 않다', () => {
  const bad: string[] = [];
  for (const { where, d } of ALL) {
    for (const [k, t] of fields(d)) if (!t || !t.trim()) bad.push(`${where} ${k}`);
  }
  assert.deepEqual(bad, []);
});

// 시키는 말은 읽는 사람을 밀어낸다. 할 것은 권하는 말(해보세요, 해두면 좋아요)로,
// 하지 말 것은 막는 말 대신 무엇을 대신 할지(미뤄두는 게 나아요, B 가 나아요)로
// 끝낸다. 다만 보증, 대출, 서명, 송금, 술처럼 한 번에 손해가 큰 일은 그대로
// 하지 마세요 라고 말한다. '조심하세요', '생각해보세요' 로 끝나면 무엇을 하라는
// 건지 모른다.
const SUGGEST = /(보세요|봐요|좋아요|두세요|나아요|충분해요)\.$/;
const INSTEAD = /(나아요|좋아요|않아요|충분해요|둬요|두세요|돼요)\.$/;
const COSTLY = /보증|대출|서명|송금|술/;
function suggestShape(doAction: string, dontAction: string): string | null {
  if (!SUGGEST.test(doAction) || /마세요/.test(doAction)) return `할 것이 권하는 말이 아니에요: ${doAction}`;
  if (/마세요/.test(dontAction) ? !COSTLY.test(dontAction) : !INSTEAD.test(dontAction)) return `하지 말 것이 대안을 주지 않아요: ${dontAction}`;
  if (/^(조심하세요|생각해보세요|주의하세요)\.$/.test(doAction.replace(/^오늘은\s*/, ''))) return '목적어 없음';
  return null;
}

// 고민을 안 고르고 뽑은 일반 쪽지(dayVibe)는 다른 표라 여기서는 고민을 고른
// 칸만 본다.
test('할 것은 권하는 말로, 하지 말 것은 대안을 주는 말로 끝난다', () => {
  const bad = new Set<string>();
  for (const { where, concern, d } of ALL) {
    if (!concern) continue;
    const why = suggestShape(d.do.action, d.dont.action);
    if (why) bad.add(`${where.split('/').slice(0, 2).join('/')} ${why}`);
  }
  assert.deepEqual([...bad], []);
});

// 일반 쪽지(dayVibe) 열 칸도 같은 기준이다. 홈 맨 위 한 줄(head)도 시키지 않고
// 권한다. 하지 말 것의 까닭은 그 일을 하고 싶어지는 마음부터 짚는다.
test('일반 쪽지도 권하는 말과 대안을 주는 말로 끝난다', () => {
  const bad: string[] = [];
  for (const { where, concern, d } of ALL) {
    if (concern) continue;
    const why = suggestShape(d.do.action, d.dont.action);
    if (why) bad.push(`${where} ${why}`);
    const head = where.slice('일반/'.length);
    if (/세요\.$/.test(head) && !/보세요\.$/.test(head)) bad.push(`${where} 머리말이 시키는 말이에요`);
    if (/마세요/.test(d.overall.headline)) bad.push(`${where} 전체 종합이 막는 말이에요`);
    if (!/(싶|마음|불안|미안|허전|핑계|섭섭)/.test(d.dont.why)) bad.push(`${where} 하지 말 것의 까닭에 마음이 없어요: ${d.dont.why}`);
  }
  assert.deepEqual(bad, []);
});

test('권하는 말을 보는 눈이 살아 있다', () => {
  assert.equal(suggestShape('저녁 9시 전에 한 곳만 보내보세요.', '그만둔다는 말은 합격 연락을 받은 뒤로 미뤄두는 게 나아요.'), null);
  assert.equal(suggestShape('공고 세 개를 골라두면 좋아요.', '친구 보증은 서지 마세요.'), null);
  assert.ok(suggestShape('저녁 9시 전에 보내세요.', '미뤄두는 게 나아요.'));
  assert.ok(suggestShape('저녁 9시 전에 보내보세요.', '오늘은 결제하지 마세요.'));
});

test('할 것과 하지 말 것은 서로 다른 말이고, 까닭도 서로 다르다', () => {
  const bad: string[] = [];
  for (const { where, d } of ALL) {
    if (d.do.action === d.dont.action) bad.push(`${where} 행동이 같아요`);
    if (d.do.why === d.dont.why) bad.push(`${where} 까닭이 같아요`);
  }
  assert.deepEqual(bad, []);
});

// 한 카드 안에서 같은 말을 두 번 하면 두 번째는 안 읽힌다. 전체 종합이 '오늘은
// 연락하세요' 인데 할 것도 '연락하세요' 면 칸을 나눈 뜻이 없다.
// 한글만 남겨 일곱 글자가 그대로 겹치는지 본다. 말끝(~하기 쉬워요 같은)만
// 겹치는 걸 잡지 않으려고 일곱 글자로 잡았다.
const SHARED_LEN = 7;
function sharedRun(a: string, b: string): string | null {
  const x = a.replace(/[^가-힣]/g, '');
  const y = b.replace(/[^가-힣]/g, '');
  for (let i = 0; i + SHARED_LEN <= x.length; i += 1) {
    const g = x.slice(i, i + SHARED_LEN);
    if (y.includes(g)) return g;
  }
  return null;
}

test('한 카드 안에서 같은 말을 되풀이하지 않는다', () => {
  const bad = new Set<string>();
  for (const { where, d } of ALL) {
    const fs = fields(d);
    for (let i = 0; i < fs.length; i += 1) {
      for (let j = i + 1; j < fs.length; j += 1) {
        const g = sharedRun(fs[i][1], fs[j][1]);
        if (g) bad.add(`${where.split('/').slice(0, 4).join('/')} ${fs[i][0]} x ${fs[j][0]} [${g}]\n    ${fs[i][1]}\n    ${fs[j][1]}`);
      }
    }
  }
  assert.deepEqual([...bad], []);
});

test('되풀이를 찾는 눈이 살아 있다', () => {
  assert.equal(sharedRun('오늘은 먼저 연락하세요.', '먼저 연락하세요. 대화가 이어져요.'), '먼저연락하세요');
  assert.equal(sharedRun('오늘은 말이 세게 나가기 쉬워요.', '오늘은 몸이 쉽게 지치기 쉬워요.'), null);
});

// 전체 종합과 할 것·하지 말 것은 다른 표에서 나온다. 그래서 서로 반대로 말할
// 수 있다. '먼저 연락해도 되지만' 이라고 해놓고 하지 말 것이 '연락하지
// 마세요' 면 한 화면이 두 말을 한다.
//
// 전체 종합은 늘 'A 는 해도 좋아요. B 는 언제로 미뤄두는 게 나아요' 모양이다.
// 첫 문장이 해도 되는 쪽, 뒤가 미룰 쪽이다(한 문장이면 쉼표로 가른다).
// 해도 된다고 한 걸 하지 말 것이 막거나, 미루라고 한 걸 할 것이 권하면 걸린다.
// 몸은 같은 뜻을 여러 말로 한다. '움직이는 건 쉬어두라' 고 해놓고 '움직여보세요' 를
// 권하면 반대로 말한 것이다 - 실제로 아픈 데가 있는 날에 그렇게 나갔었다.
const TOPICS = ['연락', '지원', '결제', '해지', '투자', '고백', '결정', '결론', '계약', '서운', '부탁', '안부', '운동', '약속', '움직'];
// 하지 말 것이 막는 말. 대안형으로 바꾼 뒤에도 미루거나 접어두거나 대신 다른
// 걸 하라는 말은 그 일을 막는 말이다.
const HOLD = '(지 마세요|지는 마세요|미뤄|접어|덮어|대신|보다|말고|않는 게|넘겨|내려놓)';
function contradiction(d: TodayDecision): string | null {
  const parts = d.overall.headline.split(/(?<=\.)\s+/);
  const [allowed, ...rest] = parts.length > 1 ? parts : d.overall.headline.split(', ');
  const forbidden = rest.join(' ');
  if (!forbidden) return null;
  for (const t of TOPICS) {
    // 미루라고 한 것을 할 것이 권한다. 낱말 바로 뒤 몇 글자 안에서 권할 때만
    // 본다 - '내키지 않는 부탁 하나는 오늘 정중하게 거절해보세요' 는 부탁을 하라는
    // 말이 아니다.
    if (forbidden.includes(t) && new RegExp(`${t}.{0,10}(세요|봐요|좋아요)`).test(d.do.action)) {
      return `미루라던 '${t}' 을 할 것이 권해요`;
    }
    // 해도 된다던 것을 하지 말 것이 막는다. 마찬가지로 바로 뒤에서 막을 때만
    // 본다 - '연락 한 번 없다고 혼자 결론 내리는 건 미뤄두세요' 는 연락을 막는 말이
    // 아니다. '연락을 끊는 것' 은 오히려 연락하라는 말이라 뺀다.
    if (allowed.includes(t) && new RegExp(`${t}(?:(?!끊|그만).){0,10}${HOLD}`).test(d.dont.action)) {
      return `해도 된다던 '${t}' 을 하지 말 것이 막아요`;
    }
  }
  return null;
}

test('전체 종합과 할 것·하지 말 것이 서로 반대로 말하지 않는다', () => {
  const bad = new Set<string>();
  for (const { where, d } of ALL) {
    const why = contradiction(d);
    if (why) bad.add(`${where} ${why}\n    ${d.overall.headline}\n    할 것: ${d.do.action}\n    하지 말 것: ${d.dont.action}`);
  }
  assert.deepEqual([...bad], []);
});

test('반대말을 찾는 눈이 살아 있다', () => {
  const base: TodayDecision = {
    overall: { headline: '오늘은 먼저 연락해도 좋아요. 관계를 정하자는 말은 다음 주로 미뤄두는 게 나아요.', summary: '.' },
    do: { action: '안부를 보내보세요.', why: '.' },
    dont: { action: '누구에게든 연락하는 건 내일로 미뤄두는 게 좋아요.', why: '.' },
  };
  assert.ok(contradiction(base));
  assert.ok(contradiction({
    ...base,
    overall: { headline: '오늘은 알아보기만 해도 충분해요. 결정은 토요일로 미뤄두는 게 나아요.', summary: '.' },
    do: { action: '미뤄둔 결정 하나를 끝내보세요.', why: '.' },
    dont: { action: '답을 사흘 뒤에 정해도 늦지 않아요.', why: '.' },
  }));
  assert.equal(contradiction({ ...base, dont: { action: '연락 한 번 없다고 혼자 결론 내리는 건 미뤄두세요.', why: '.' } }), null);
  assert.equal(contradiction({ ...base, dont: { action: '말없이 갑자기 연락을 끊는 것보다 한 줄 답이 나아요.', why: '.' } }), null);
  assert.ok(contradiction({
    ...base,
    overall: { headline: '오늘은 쉬는 데 집중해도 좋아요. 통증을 참고 움직이는 건 내일로 미뤄두는 게 나아요.', summary: '.' },
    do: { action: '늘 하던 운동 말고 다른 방법으로 가볍게 움직여보세요.', why: '.' },
    dont: { action: '답을 사흘 뒤에 정해도 늦지 않아요.', why: '.' },
  }));
  assert.equal(contradiction({
    ...base,
    overall: { headline: '오늘은 친구에게 먼저 연락해도 좋아요. 무거운 부탁은 다음 주로 미뤄두는 게 나아요.', summary: '.' },
    do: { action: '내키지 않는 부탁 하나는 오늘 정중하게 거절해보세요.', why: '.' },
    dont: { action: '답을 사흘 뒤에 정해도 늦지 않아요.', why: '.' },
  }), null);
  // 옛 모양(쉼표 하나로 가른 한 문장)도 그대로 읽는다
  assert.ok(contradiction({
    ...base,
    overall: { headline: '오늘은 알아보기만 하고, 결정은 미뤄두세요.', summary: '.' },
    do: { action: '미뤄둔 결정 하나를 끝내보세요.', why: '.' },
  }));
});

// 고른 상황과 부딪히는 말. concernDay.test 가 할 것·하지 말 것을 재고 있고,
// 여기서는 전체 종합과 그 까닭을 같은 잣대로 잰다.
const BY_SITUATION: Record<string, RegExp> = {
  'work/stay': /개업|사업|손님|매출|첫 자리/,
  'work/rest': /맡은|동료|같은 팀|사내|출근|승진|지금 회사|개업|사업|손님|매출/,
  'work/start': /승진|경력을|재직|이직|지금 회사|개업|사업|손님|매출/,
  'work/own': /지원(?!금)|채용|이력서|면접|입사|취업|합격|승진|이직|연봉/,
  'love/alone': /상대|사귀는|연인|우리 사이|만나면/,
  'love/some': /연인|우리 사이/,
  'love/couple': /소개받|새 사람/,
  'love/past': /사귀자|만나면/,
  'people/work': /가족/,
  'people/friend': /가족|동료/,
  'people/family': /동료|회사/,
  'people/new': /가족|오래 못 본|오래 안 본/,
};

test('전체 종합이 고른 상황과 부딪히지 않는다', () => {
  const bad = new Set<string>();
  for (const { where, concern, option, d } of ALL) {
    const re = concern && option ? BY_SITUATION[`${concern}/${option}`] : undefined;
    if (!re) continue;
    for (const [k, t] of [['전체 종합', d.overall.headline], ['종합 설명', d.overall.summary]] as const) {
      const m = t.match(re);
      if (m) bad.add(`${where.split('/').slice(0, 4).join('/')} ${k} [${m[0]}] ${t}`);
    }
  }
  assert.deepEqual([...bad], []);
});

// 운세가 병원에 갈지를 정하면 안 된다. 가라고 해도, 가지 말라고 해도 안 된다.
const MEDICAL = /병원에 가(세요|지 마)|진료(를)? ?받(으세요|지 마)|진료는 오늘|치료하기 좋|오늘 병원|빨리 나아|검진 날짜를 잡/;
test('몸 결과는 병원에 갈지를 대신 정하지 않는다', () => {
  const bad = new Set<string>();
  for (const { where, concern, d } of ALL) {
    if (concern !== 'health') continue;
    for (const [k, t] of [...fields(d), ['안내', d.note ?? '']] as const) {
      const m = t.match(MEDICAL);
      if (m) bad.add(`${where} ${k} [${m[0]}] ${t}`);
    }
    if (!d.note || !/의료진/.test(d.note)) bad.add(`${where} 의료진 안내가 없어요`);
  }
  assert.deepEqual([...bad], []);
  assert.ok(MEDICAL.test('오늘은 병원에 가세요.'));
  assert.ok(MEDICAL.test('진료는 오늘 받지 말고, 예약만 잡으세요.'));
});

// 운세가 투자·구매를 대신 정하면 안 된다. 서두르지 말라, 조건을 보라까지만.
// '넣으세요' 는 돈을 넣으라는 말일 때만 잡는다. '쉬는 시간을 넣으세요' 는 괜찮다.
const FINANCE = /투자하세요|투자해도 돼요|투자하면 좋|매수|오늘 사세요|사도 돼요|(돈|금액|목돈)[을를]? ?(더 )?넣으세요|큰돈을 써도 돼요|사면 좋아요/;
test('돈 결과는 투자나 구매를 대신 정하지 않는다', () => {
  const bad = new Set<string>();
  for (const { where, concern, option, d } of ALL) {
    if (concern !== 'money' && concern !== null) continue;
    for (const [k, t] of fields(d)) {
      const m = t.match(FINANCE);
      if (m) bad.add(`${where} ${k} [${m[0]}] ${t}`);
    }
    if (option === 'invest' && (!d.note || !/가격, 위험/.test(d.note))) bad.add(`${where} 투자 안내가 없어요`);
  }
  assert.deepEqual([...bad], []);
  assert.ok(FINANCE.test('오늘은 투자해도 돼요.'));
  assert.ok(FINANCE.test('오늘은 큰돈을 써도 돼요.'));
  assert.ok(FINANCE.test('남는 돈을 넣으세요.'));
  assert.ok(!FINANCE.test('할 일 사이에 10분씩 쉬는 시간을 넣으세요.'));
});

// 사주 전문용어는 맨 위 카드에 안 쓴다. 계산에는 쓰지만 읽는 사람에게는
// 아무 뜻도 없다.
test('맨 위 카드에 십신 이름이 없다', () => {
  const names = Object.values(TEN_GOD_KO);
  const bad = new Set<string>();
  for (const { where, d } of ALL) {
    for (const [k, t] of fields(d)) {
      const n = names.find((x) => t.includes(x));
      if (n) bad.add(`${where} ${k} [${n}] ${t}`);
    }
  }
  assert.deepEqual([...bad], []);
});
