import { test } from 'node:test';
import assert from 'node:assert/strict';
import { softBreak } from './softBreak.ts';
import { GREETINGS } from '../data/copy.ts';

// 앞말에 붙는 한 글자가 다음 줄 머리에 혼자 떨어지면 안 된다.
// 홈 제목에서 실제로 "푹 자는 / 게 오늘의 마지막 할 일이에요" 가 나왔다.
const ORPHAN = /\n(게|것|수|데|줄|뿐|바|채|적|지|리|때|만큼|대로|뻔|만|척|듯)(\s|$)/;

test('한 글자 의존명사가 다음 줄 머리에 혼자 오지 않는다', () => {
  assert.equal(softBreak('푹 자는 게 오늘의 마지막 할 일이에요'), '푹 자는 게\n오늘의 마지막 할 일이에요');
});

test('인사말 전부에서 줄 머리가 깨지지 않는다', () => {
  const all = Object.values(GREETINGS).flat();
  assert.ok(all.length >= 10, `인사말이 ${all.length}개뿐이에요`);
  const bad = all.map((t) => softBreak(t)).filter((t) => ORPHAN.test(t));
  assert.deepEqual(bad, [], `줄 머리가 깨진 인사말: ${bad.join(' / ')}`);
});

// 한 글자가 다음 줄 머리에 오는 걸 막는 규칙은 두 갈래다.
// (1) 그 말 '뒤' 에서 끊는 건 막지 않는다 - 앞말과 한 덩이로 줄이 끝난다
// (2) 그 말 '앞' 에서는 끊지 않는다
// 앱 문장 4168개로 재보니 (2)만 따로 빼도 67개가 달라졌다. 둘 다 일한다.
test('앞말에 붙는 말 앞에서는 끊지 않는다', () => {
  assert.equal(softBreak('고개를 들면 좋은 게 보여요.'), '고개를 들면\n좋은 게 보여요.');
  assert.equal(softBreak('급한 일이 없을 때 기초가 자라요.'), '급한 일이 없을 때\n기초가 자라요.');
  assert.equal(softBreak('가방 속 안 쓰는 것 하나를 빼요.'), '가방 속 안 쓰는 것\n하나를 빼요.');
});

test("관형격 '의' 뒤에서는 안 끊는다", () => {
  const out = softBreak('오늘의 마지막 할 일을 천천히 해봐요');
  assert.ok(!/의\n/.test(out), out);
});

test('짧은 말과 줄바꿈이 이미 있는 말은 그대로 둔다', () => {
  assert.equal(softBreak('짧아요'), '짧아요');
  assert.equal(softBreak('이미\n나뉜 말이에요'), '이미\n나뉜 말이에요');
});
