import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planOf } from './situationPlan.ts';
import { stanceLead } from '../lib/deepRead.ts';
const FAKE_TIMING = { thisMonth: { score: 65, label: '2026년 10월' }, bestMonth: { score: 88, label: '2027년 2월' }, months: [{ band: 'good' }, { band: 'ok' }] } as unknown as Parameters<typeof stanceLead>[1];

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
  const leads = (['run', 'prep', 'hold', 'keep'] as const).map((st) => stanceLead(st, FAKE_TIMING, '이직 지원서'));
  assert.equal(new Set(leads).size, 4);
  for (const l of leads) {
    assert.ok(l.endsWith('.'), l);
    // 판정은 점수와 달 이름을 박아야 한다. '좋지도 나쁘지도' 는 판정이 아니다
    assert.match(l, /\d+점/, l);
    assert.doesNotMatch(l, /좋지도 나쁘지도|무난/, l);
    // 무엇을 하라는지가 있어야 한다. '새로 벌이면' 은 무엇을 벌이는지가 없다
    assert.doesNotMatch(l, /벌이|굴리|새 시작|새 일/, l);
    assert.ok(l.includes('이직 지원서'), l);
  }
});

// 결과 화면은 오늘 쪽지다. 목록에 '이번 주 안에 글로 적어 보내보세요' 가 떴고
// '오늘 쪽지인데 왜 미래 얘기를 하냐' 는 말을 들었다. 할 것과 미룰 것은 오늘
// 안에 끝낼 수 있는 일만 쓴다. 까닭도 몇 달 뒤를 끌어오지 않는다.
const LATER = /이번 주|다음 주|이번 달|다음 달|분기|올해|내년|석 달|반년|\d+년 뒤|한 달 뒤|한 달 안/;
// 가운뎃점, 줄표, 말줄임, 작은따옴표, 괄호는 화면 문장에 안 쓴다
const MARKS = /[·—–…'"()‘’]/;
// 문장 끝 두 글자. 한 칸 세 줄이 같은 어미로 끝나면 같은 틀로 찍은 것처럼 읽힌다
const ending = (s: string) => s.replace(/[.]$/, '').slice(-2);

// 목록 첫 줄은 다른 표에서 온 완성 문장이다. 나머지가 '~하기' 로 끝나면 한
// 목록 안에서 꼴이 섞인다. 할 것과 미룰 것도 마침표로 끝나는 완성 문장으로 쓴다.
test('할 것과 미룰 것은 오늘 할 수 있는 완성 문장이고, 한 칸 안에서 끝맺음이 다르다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) {
    for (const o of c.options) {
      const p = planOf(c.key, o.key);
      for (const [name, list] of [['dos', p.dos], ['donts', p.donts]] as const) {
        list.forEach((d, i) => {
          const at = `${c.key}.${o.key}.${name}[${i}]`;
          if (!d.endsWith('.')) bad.push(`${at} 마침표로 끝나야 해요: ${d}`);
          if (d.length < 15 || d.length > 35) bad.push(`${at} ${d.length}자: ${d}`);
          if (/(?<!보)세요|지 마[라세]/.test(d)) bad.push(`${at} 시키는 말: ${d}`);
          if (LATER.test(d)) bad.push(`${at} 오늘 일이 아니에요: ${d}`);
          if (MARKS.test(d)) bad.push(`${at} 부호: ${d}`);
        });
        if (new Set(list.map(ending)).size !== 3) bad.push(`${c.key}.${o.key}.${name} 끝맺음이 겹쳐요: ${list.map(ending).join(' / ')}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

// 까닭은 친구가 옆에서 말해주는 한 문장이다. 같은 칸에서 같은 문장이 두 번
// 나오면 한쪽은 아무 말도 안 한 것이고, 까닭 칸에 '~하세요' 가 오면 지시다.
// '~할 것 같지만,' 을 칸마다 되풀이하던 때가 있었다. 만든 틀로 읽힌다.
test('까닭(doWhys, dontWhys)은 한 문장이고, 겹치지 않고, 시키지 않는다', () => {
  const seen = new Map<string, string>();
  const bad: string[] = [];
  for (const c of CONCERNS) {
    for (const o of c.options) {
      const p = planOf(c.key, o.key);
      assert.equal(p.doWhys.length, 3, `${c.key}.${o.key}`);
      assert.equal(p.dontWhys.length, 3, `${c.key}.${o.key}`);
      for (const [name, list] of [['doWhys', p.doWhys], ['dontWhys', p.dontWhys]] as const) {
        list.forEach((w, i) => {
          const at = `${c.key}.${o.key}.${name}[${i}]`;
          if (!w.endsWith('.') || /[.!?]\s/.test(w)) bad.push(`${at} 한 문장으로: ${w}`);
          if (w.length < 20 || w.length > 45) bad.push(`${at} ${w.length}자: ${w}`);
          if (/세요|십시오|지 마[라세]/.test(w)) bad.push(`${at} 시키는 말: ${w}`);
          if (/것 같지만|피하는 게 나아요|하는 것은|에 있어/.test(w)) bad.push(`${at} 만든 틀: ${w}`);
          if (LATER.test(w)) bad.push(`${at} 먼 미래: ${w}`);
          if (MARKS.test(w)) bad.push(`${at} 부호: ${w}`);
          if (seen.has(w)) bad.push(`${at} 는 ${seen.get(w)} 와 같은 문장`);
          seen.set(w, at);
        });
        if (new Set(list.map(ending)).size !== 3) bad.push(`${c.key}.${o.key}.${name} 끝맺음이 겹쳐요: ${list.map(ending).join(' / ')}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test('상황을 안 골라도 고른 상황 중 하나로 떨어진다', () => {
  for (const c of CONCERNS) {
    const f = planOf(c.key, null);
    assert.ok(c.options.some((o) => planOf(c.key, o.key).focus === f.focus), c.key);
    assert.deepEqual(planOf(c.key, 'nope'), f);
  }
});
