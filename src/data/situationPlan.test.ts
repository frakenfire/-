import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planOf, STANCE_LEAD } from './situationPlan.ts';
import { CONCERNS } from './concerns.ts';

// 결정 카드는 이 리포트에서 제일 행동에 가까운 카드다. 그런데 한때 문장
// 일흔둘 중 서른아홉이 그 고민의 말을 한 마디도 안 쓰고 있었다.
// '지금은 알아보는 단계를 넘겨도 되는 구간이에요' 는 돈에 붙여도 연애에
// 붙여도 말이 된다. 어느 고민에 붙여도 되는 문장은 아무 말도 안 한 것과 같다.
const WORD: Record<string, RegExp> = {
  work: /일|직장|회사|이직|연봉|자리|직책|경력|면접|계약|업무|성과|상사|팀|승진|이력|평가|보고|포트폴리오|독립|지원|합격|자격|기술|담당|결과물|과제|메일|미팅|추천|문서|범위|간판|손님|서류|개업|매출/,
  money: /돈|수입|지출|저축|투자|고정비|할부|구독|연봉|금액|값|비용|이자|빚|예산|자산|계좌|카드|환급|지원금|부업|외주|원금|결제|저금|거래처|상품|조건|더치|몫|이체|견적|수수료|멤버십|월급/,
  love: /연애|마음|만남|사이|연락|고백|헤어|데이트|상대|애인|썸|결혼|동거|소개|인연|친구|사람|관계|서운|약속|취미|답장/,
  people: /사람|사이|관계|말|거리|모임|친구|동료|가족|연락|부탁|인연|거절|소개|몫|선|역할|스터디|범위|메일|전화|명절/,
  health: /몸|건강|잠|밥|운동|피로|컨디션|병원|쉬|무리|체력|검진|통증|진료|먹|강도|약속|일정|검색|기록|취침|기상|카페인|끼니|알람|진통제|동작|분량/,
  // 외로움은 '마음' 고민이면서 다루는 대상은 사람이다. 그 낱말을 막으면
  // 외로움 칸에 쓸 말이 없어진다. 고민의 범위를 좁히는 게 아니라 넓히는 쪽이다.
  mind: /마음|기분|생각|불안|걱정|쉬|여유|감정|스트레스|잠|취미|기준|속|말|하루|규칙|시간|자극|결정|거절|자료|사람|연락|외로|허전/,
};

test('결정 카드의 모든 문장이 그 고민의 말을 쓴다', () => {
  const miss: string[] = [];
  for (const c of CONCERNS) {
    for (const o of c.options) {
      const p = planOf(c.key, o.key);
      // focus 는 두 문장이 한 덩이로 붙어 나가므로 통째로 본다.
      // 할 것·하지 말 것은 목록에 한 줄씩 서니 줄마다 본다.
      for (const t of [p.focus, ...p.dos, ...p.donts]) {
        const x = t.trim();
        if (x.length < 6) continue;
        if (!WORD[c.key].test(x)) miss.push(`${c.key}.${o.key}  ${x}`);
      }
    }
  }
  assert.deepEqual(miss, [], `어느 고민에 붙여도 되는 문장이 남아 있습니다:\n  ${miss.join('\n  ')}`);
});

test("결정 카드가 '구간' 으로 도망가지 않는다", () => {
  const vague: string[] = [];
  for (const c of CONCERNS) {
    for (const o of c.options) {
      const p = planOf(c.key, o.key);
      if (/구간/.test(p.focus)) vague.push(`${c.key}.${o.key}`);
    }
  }
  assert.deepEqual(vague, [], "'구간' 대신 달·해 같은 실제 단위나 그 고민의 말로");
});

test('판정 넷이 서로 다른 말로 시작한다', () => {
  const leads = Object.values(STANCE_LEAD);
  assert.equal(new Set(leads).size, 4);
  for (const l of leads) assert.ok(l.endsWith('.'), l);
});

test('상황을 안 골라도 고른 상황 중 하나로 떨어진다', () => {
  for (const c of CONCERNS) {
    const f = planOf(c.key, null);
    assert.ok(c.options.some((o) => planOf(c.key, o.key).focus === f.focus), c.key);
    assert.deepEqual(planOf(c.key, 'nope'), f);
  }
});
