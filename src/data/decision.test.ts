import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WHEN_ACT } from './decision.ts';

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

// 결정 카드가 그 고민의 말을 쓰는지는 이제 situationPlan.test.ts 가 본다.
// 여기 있던 두 검사는 DECISION 표를 읽고 있었는데 그 표를 지웠다.
