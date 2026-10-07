import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitSentences, lineGroups } from './sentences.ts';

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

test('줄은 뜻이 바뀌는 말 앞에서만 바꾼다', () => {
  assert.deepEqual(
    lineGroups('오늘은 연락이 잘 닿아요. 답장도 빨라요. 그래서 미뤄둔 메일을 보내세요. 다만 밤에는 보내지 마세요.'),
    ['오늘은 연락이 잘 닿아요. 답장도 빨라요.', '그래서 미뤄둔 메일을 보내세요.', '다만 밤에는 보내지 마세요.'],
  );
  assert.deepEqual(lineGroups('한 문장뿐이에요.'), ['한 문장뿐이에요.']);
});
