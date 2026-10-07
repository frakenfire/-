import { test } from 'node:test';
import assert from 'node:assert/strict';
import { asDo, asDont } from './polite.ts';
import { planOf } from '../data/situationPlan.ts';
import { CONCERNS } from '../data/concerns.ts';

test('할 일 명사형을 받침에 맞춰 문장으로 바꾼다', () => {
  assert.equal(asDo('성과를 모아두기'), '성과를 모아두세요.');
  assert.equal(asDo('마감일을 달력에 넣기'), '마감일을 달력에 넣으세요.');
  assert.equal(asDo('한 줄로 만들기'), '한 줄로 만드세요.');
  assert.equal(asDo('하루 이십 분 걷기'), '하루 이십 분 걸으세요.');
  assert.equal(asDo('휴대폰을 보지 않기'), '휴대폰을 보지 마세요.');
  assert.equal(asDont('연락을 끊기'), '연락을 끊지 마세요.');
  assert.equal(asDont('아무 지원도 안 하기'), '아무 지원도 안 하는 건 피하세요.');
  assert.equal(asDont('사람을 만나보지도 않기'), '사람을 만나보지도 않는 건 피하세요.');
});

test('상황 표의 할 것과 하지 말 것이 전부 깨지지 않은 문장이 된다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) for (const o of c.options) {
    const p = planOf(c.key, o.key);
    for (const s of [...p.dos.map(asDo), ...p.donts.map(asDont)]) {
      if (!/(세요|피하세요)\.$/.test(s) || /않지 마|않으세요|기 하지|있으세요/.test(s)) bad.push(`${c.key}/${o.key} ${s}`);
    }
  }
  assert.deepEqual(bad, []);
});
