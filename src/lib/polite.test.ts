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

test('상황 표의 할 것과 하지 말 것이 전부 깨지지 않은 권하는 문장이 된다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) for (const o of c.options) {
    const p = planOf(c.key, o.key);
    for (const s of [...p.dos.map(asDo), ...p.donts.map(asDont)]) {
      if (!/(좋아요|나아요)\.$/.test(s) || /세요|기 하지/.test(s)) bad.push(`${c.key}/${o.key} ${s}`);
    }
  }
  assert.deepEqual(bad, []);
});
