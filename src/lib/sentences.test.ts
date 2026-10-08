import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitSentences } from './sentences.ts';

test('마침표마다 끊는다', () => {
  assert.deepEqual(splitSentences('하나예요. 둘이에요. 셋이에요.'), ['하나예요.', '둘이에요.', '셋이에요.']);
});

test('마침표가 없으면 통째로 한 줄이다', () => {
  assert.deepEqual(splitSentences('끊을 데가 없는 문장'), ['끊을 데가 없는 문장']);
});

test('물음표와 느낌표에서도 끊는다', () => {
  assert.deepEqual(splitSentences('그럴까요? 아마도요!'), ['그럴까요?', '아마도요!']);
});

test('앞뒤 공백과 빈 조각은 버린다', () => {
  assert.deepEqual(splitSentences('  하나예요.   둘이에요.  '), ['하나예요.', '둘이에요.']);
});

test('가운뎃점은 끊는 자리가 아니다', () => {
  assert.deepEqual(splitSentences('돈 · 사랑 · 일이 한꺼번에 움직여요.'), ['돈 · 사랑 · 일이 한꺼번에 움직여요.']);
});
