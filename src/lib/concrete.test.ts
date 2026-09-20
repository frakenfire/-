import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';
import { CONCERN_GOD } from '../data/concernReadings.ts';
import { TEN_GOD_KO, type TenGod } from './tenGods.ts';

const TEN_GODS = Object.keys(TEN_GOD_KO) as TenGod[];

// 돈을 물었는데 '안으로 파고드는 달이라 정리하고 배우기 좋아요' 가 나왔다.
// 돈 얘기가 한 마디도 없다. 재보니 화면 문장의 30%만 고민 단어를 쓰고 있었다.
// 원인은 GOD_SCALE / GOD_PULL 이 고민을 안 보고 십성만 보고 쓴 문장이라는 것.
// 고민별로 다시 쓴 뒤 78%. 이 테스트가 다시 내려가는 걸 막는다.
const WORD: Record<ConcernKey, RegExp> = {
  work: /일|직장|회사|이직|연봉|자리|직책|경력|면접|계약|업무|성과|상사|팀|승진|이력|평가|보고|포트폴리오|독립|지원|합격|자격|기술|담당|결과물|과제|메일|미팅|추천|문서|범위/,
  money: /돈|수입|지출|저축|투자|고정비|할부|구독|연봉|금액|값|비용|이자|빚|예산|자산|계좌|카드|환급|지원금|부업|외주|원금|결제|저금|거래처|상품|조건|더치|몫|이체/,
  love: /연애|마음|만남|사이|연락|고백|헤어|데이트|상대|애인|썸|결혼|동거|소개|인연|친구|사람|관계|서운|약속/,
  people: /사람|사이|관계|말|거리|모임|친구|동료|가족|연락|부탁|인연|거절|소개|몫|선|역할|모임|스터디/,
  health: /몸|건강|잠|밥|운동|피로|컨디션|병원|쉬|무리|체력|검진|통증|진료|먹|강도|약속|일정|검색|기록|취침|기상/,
  mind: /마음|기분|생각|불안|걱정|쉬|여유|감정|스트레스|잠|취미|기준|속|말|하루|취미|규칙|시간|자극/,
};

const INPUT = { year: 1992, month: 3, day: 3, hour: 20 };
const P = computeFourPillars(INPUT);

function screenLines(key: ConcernKey, option: string) {
  const t = computeTiming(INPUT, P, 'female', key, new Date('2026-09-21T09:00:00+09:00'));
  const r = buildDeepRead(P, t, key, option, '2026-09-21', '김한별');
  return [
    r.headline, r.sub, r.decision.verdict,
    ...r.slots.map((s) => s.outer),
    ...r.monthSlots.map((s) => s.outer),
    ...r.yearLines.map((y) => y.v),
    ...r.why.map((x) => x.v),
  ].filter((x): x is string => typeof x === 'string' && x.length > 6);
}

test('화면 문장 대부분이 그 고민의 말을 쓴다', () => {
  let tot = 0, hit = 0;
  const miss: string[] = [];
  for (const c of CONCERNS) {
    const re = WORD[c.key];
    for (const line of screenLines(c.key, c.options[0].key)) {
      tot += 1;
      if (re.test(line)) hit += 1;
      else miss.push(`${c.key}: ${line}`);
    }
  }
  const pct = Math.round((hit / tot) * 100);
  assert.ok(pct >= 75, `${pct}% 만 고민 단어를 써요 (${hit}/${tot})\n  ${miss.slice(0, 5).join('\n  ')}`);
});

test('고민별 문장 네 벌이 다 채워져 있다', () => {
  for (const c of CONCERNS) {
    for (const god of TEN_GODS) {
      const g = CONCERN_GOD[c.key][god];
      // 네 벌 전부가 그 고민의 말을 써야 한다. '구간이 열려요' 같은 문장은
      // 어느 고민에 붙여도 말이 되고, 그래서 아무 말도 안 하는 것과 같다.
      for (const [k, v] of Object.entries({ month: g.month, decide: g.decide, pull: g.pull, year: g.year })) {
        assert.ok(v && v.length >= 8, `${c.key}.${god}.${k} 가 비었어요`);
        assert.ok(WORD[c.key].test(v), `${c.key}.${god}.${k} 에 고민 말이 없어요 — ${v}`);
      }
    }
  }
});

test('같은 기운도 고민마다 다른 문장이다', () => {
  for (const god of TEN_GODS) {
    const months = CONCERNS.map((c) => CONCERN_GOD[c.key][god].month);
    assert.equal(new Set(months).size, months.length, `${god} 의 달 문장이 고민끼리 겹쳐요`);
    const pulls = CONCERNS.map((c) => CONCERN_GOD[c.key][god].pull);
    assert.equal(new Set(pulls).size, pulls.length, `${god} 의 근거가 고민끼리 겹쳐요`);
  }
});

// 결과 화면에서 제일 큰 글자가 제일 추상적이었다.
// '곧 돈이 도는 구간이 와요' 는 돈이 언제 어떻게 도는지 아무것도 말하지 않는다.
test('맨 위 결론이 도망가는 말을 쓰지 않는다', () => {
  const ESCAPE = /구간|흐름이 열|기운이 열|자리가 열/;
  for (const c of CONCERNS) {
    for (const opt of c.options) {
      const t = computeTiming(INPUT, P, 'female', c.key, new Date('2026-09-21T09:00:00+09:00'));
      const r = buildDeepRead(P, t, c.key, opt.key, '2026-09-21', '김한별');
      assert.ok(!ESCAPE.test(r.headline), `${c.key}: ${r.headline}`);
      assert.ok(WORD[c.key].test(r.headline), `${c.key} 결론에 고민 말이 없어요 — ${r.headline}`);
    }
  }
});

test('왜 N점인가요 줄이 그 고민의 말로 설명한다', () => {
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, new Date('2026-09-21T09:00:00+09:00'));
    const r = buildDeepRead(P, t, c.key, c.options[0].key, '2026-09-21', '김한별');
    assert.ok(WORD[c.key].test(r.scoreLine), `${c.key}: ${r.scoreLine}`);
    assert.ok(!/구간/.test(r.scoreLine), `${c.key} 점수 줄에 구간 — ${r.scoreLine}`);
  }
});

test('내일 한 줄도 그 고민의 말을 쓴다', () => {
  for (const c of CONCERNS) {
    for (let d = 18; d <= 24; d += 1) {
      const at = new Date(Date.UTC(2026, 8, d, 3));
      const t = computeTiming(INPUT, P, 'female', c.key, at);
      const r = buildDeepRead(P, t, c.key, c.options[0].key, `2026-09-${d}`, '김한별');
      const line = r.todayMeet.nextDay;
      // '결이 비슷한 날' 갈래는 고민 말이 없어도 된다 (오늘과 같다는 뜻)
      if (/결이 비슷|같은 기운/.test(line)) continue;
      assert.ok(WORD[c.key].test(line), `${c.key} ${d}일: ${line}`);
    }
  }
});
