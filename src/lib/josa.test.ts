import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withJosa } from './josa.ts';

test('받침이 있으면 은, 없으면 는', () => {
  assert.equal(withJosa('돈', '은는'), '돈은');
  assert.equal(withJosa('연애', '은는'), '연애는');
  assert.equal(withJosa('일과 이직', '은는'), '일과 이직은');
  assert.equal(withJosa('사람 관계', '은는'), '사람 관계는');
  assert.equal(withJosa('몸과 컨디션', '은는'), '몸과 컨디션은');
  assert.equal(withJosa('마음', '은는'), '마음은');
});

test('다른 조사도 같은 규칙을 쓴다', () => {
  assert.equal(withJosa('돈', '이가'), '돈이');
  assert.equal(withJosa('연애', '이가'), '연애가');
  assert.equal(withJosa('돈', '을를'), '돈을');
  assert.equal(withJosa('연애', '을를'), '연애를');
});

test('한글이 아니면 받침 없음으로 본다', () => {
  assert.equal(withJosa('AI', '은는'), 'AI는');
});
