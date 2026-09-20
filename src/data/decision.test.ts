import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WHEN_ACT, DECISION } from './decision.ts';

// '언제가 좋을까요' 카드는 세 줄이 붙어 나온다. 열여덟 줄이 전부
// '이 달에/이 해에 ... 세요' 한 틀이라 한 카드 안에서 세 줄이 연달아 세요로
// 끝났다. 화면에서 잰 최장 연속 어미가 전부 이 카드였다.
const ending = (s: string) => s.replace(/[.!?]\s*$/, '').slice(-2);

test('한 카드의 세 줄은 어미가 서로 다르다', () => {
  for (const [concern, row] of Object.entries(WHEN_ACT)) {
    const ends = [ending(row.best), ending(row.hard), ending(row.year)];
    assert.equal(new Set(ends).size, 3, `${concern}: ${ends.join(' / ')} 가 겹칩니다`);
  }
});

test('날짜는 윗줄에 이미 있으니 같은 말을 두 번 하지 않는다', () => {
  for (const [concern, row] of Object.entries(WHEN_ACT)) {
    for (const [slot, text] of Object.entries(row)) {
      assert.ok(!text.startsWith('이 달에'), `${concern}.${slot}: 날짜는 바로 윗줄에 적혀 있습니다`);
      assert.ok(!text.startsWith('이 해에'), `${concern}.${slot}: 해는 바로 윗줄에 적혀 있습니다`);
    }
  }
});

test('고민마다 다른 문장을 쓴다', () => {
  const years = Object.values(WHEN_ACT).map((r) => r.year);
  assert.equal(new Set(years).size, years.length, 'year 줄이 고민끼리 겹칩니다');
  // 예전엔 다섯 고민이 '~하는 결정을 두세요' 로 거의 같았다
  const templated = years.filter((y) => y.includes('결정을 두세요'));
  assert.deepEqual(templated, [], '한 틀로 찍어낸 문장이 남아 있습니다');
});

// '지금 어떻게 하면 될까요' 는 이 리포트에서 제일 행동에 가까운 카드다.
// 그런데 문장 일흔둘 중 서른아홉이 그 고민의 말을 한 마디도 안 쓰고 있었다.
// '지금은 알아보는 단계를 넘겨도 되는 구간이에요' 는 돈에 붙여도, 연애에
// 붙여도 말이 된다. 어느 고민에 붙여도 되는 문장은 아무 말도 안 한 것과 같다.
// '구간' 은 그 뜬구름의 대표 단어라 스무 번 쓰이고 있었다.
const WORD: Record<string, RegExp> = {
  work: /일|직장|회사|이직|연봉|자리|직책|경력|면접|계약|업무|성과|상사|팀|승진|이력|평가|보고|포트폴리오|독립|지원|합격|자격|기술|담당|결과물|과제|메일|미팅|추천|문서|범위/,
  money: /돈|수입|지출|저축|투자|고정비|할부|구독|연봉|금액|값|비용|이자|빚|예산|자산|계좌|카드|환급|지원금|부업|외주|원금|결제|저금|거래처|상품|조건|더치|몫|이체/,
  love: /연애|마음|만남|사이|연락|고백|헤어|데이트|상대|애인|썸|결혼|동거|소개|인연|친구|사람|관계|서운|약속/,
  people: /사람|사이|관계|말|거리|모임|친구|동료|가족|연락|부탁|인연|거절|소개|몫|선|역할|모임|스터디/,
  health: /몸|건강|잠|밥|운동|피로|컨디션|병원|쉬|무리|체력|검진|통증|진료|먹|강도|약속|일정|검색|기록|취침|기상/,
  mind: /마음|기분|생각|불안|걱정|쉬|여유|감정|스트레스|잠|취미|기준|속|말|하루|취미|규칙|시간|자극/,
};

test('결정 카드의 모든 문장이 그 고민의 말을 쓴다', () => {
  const miss: string[] = [];
  for (const [concern, stances] of Object.entries(DECISION)) {
    for (const [stance, cell] of Object.entries(stances)) {
      for (const s of cell.verdict.split(/(?<=[.!?])\s+/)) {
        const t = s.trim();
        if (t.length < 6) continue;
        if (!WORD[concern].test(t)) miss.push(`${concern}.${stance}  ${t}`);
      }
    }
  }
  assert.deepEqual(miss, [], `어느 고민에 붙여도 되는 문장이 남아 있습니다:\n  ${miss.join('\n  ')}`);
});

test("결정 카드가 '구간' 으로 도망가지 않는다", () => {
  const vague: string[] = [];
  for (const [concern, stances] of Object.entries(DECISION)) {
    for (const [stance, cell] of Object.entries(stances)) {
      if (/구간/.test(cell.verdict)) vague.push(`${concern}.${stance}`);
    }
  }
  assert.deepEqual(vague, [], "'구간' 대신 달·해 같은 실제 단위나 그 고민의 말로");
});
