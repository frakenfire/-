import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asDo, asDont } from './polite.ts';
import { planOf } from '../data/situationPlan.ts';
import { CONCERNS } from '../data/concerns.ts';

test('할 일 명사형을 권하는 문장으로 바꾼다', () => {
  assert.equal(asDo('성과를 모아두기'), '성과를 모아두는 게 좋아요.');
  assert.equal(asDo('마감일을 달력에 넣기'), '마감일을 달력에 넣는 게 좋아요.');
  assert.equal(asDo('한 줄로 만들기'), '한 줄로 만드는 게 좋아요.');
  assert.equal(asDo('하루 이십 분 걷기'), '하루 이십 분 걷는 게 좋아요.');
  assert.equal(asDo('휴대폰을 보지 않기'), '휴대폰을 보지 않는 게 좋아요.');
  assert.equal(asDont('연락을 끊기'), '연락을 끊는 건 피하는 게 나아요.');
  assert.equal(asDont('아무 지원도 안 하기'), '아무 지원도 안 하는 건 피하는 게 나아요.');
});

// 상황 표의 할 것과 미룰 것은 이제 처음부터 완성 문장이다. asDo/asDont 를
// 거쳐도 그대로 나와야 하고, 시키는 말('~하세요', '~하지 마세요')이 없어야 한다.
// '~해보세요' 는 권하는 말이라 둔다.
test('상황 표의 할 것과 하지 말 것이 전부 시키지 않는 완성 문장이다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) for (const o of c.options) {
    const p = planOf(c.key, o.key);
    for (const s of [...p.dos, ...p.donts]) {
      if (!/요\.$/.test(s) || /(?<!보)세요|지 마[라세]|기 하지/.test(s)) bad.push(`${c.key}/${o.key} ${s}`);
      if (asDo(s) !== s || asDont(s) !== s) bad.push(`${c.key}/${o.key} 문장이 바뀌어 나가요: ${s}`);
    }
  }
  assert.deepEqual(bad, []);
});
