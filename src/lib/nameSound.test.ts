import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choseongOf, readNameSound } from './nameSound.ts';

test('첫소리를 뽑는다', () => {
  assert.equal(choseongOf('김'), 'ㄱ');
  assert.equal(choseongOf('이'), 'ㅇ');
  assert.equal(choseongOf('박'), 'ㅂ');
  assert.equal(choseongOf('최'), 'ㅊ');
  assert.equal(choseongOf('A'), null);
});

test('자음을 다섯 기운으로 가른다', () => {
  const r = readNameSound('김나수')!;
  assert.deepEqual(r.elements, ['wood', 'fire', 'metal']);
});

test('앞이 뒤를 생하면 순한 배열', () => {
  // 나무 → 불 → 흙
  assert.equal(readNameSound('가나아')!.flow, 'smooth');
  // 물 → 나무 → 불
  assert.equal(readNameSound('마가나')!.flow, 'smooth');
});

test('서로 극하면 막힌 배열', () => {
  // 나무 극 흙, 흙 극 물
  assert.equal(readNameSound('가아마')!.flow, 'blocked');
});

test('한 글자이거나 한글이 아니면 안 본다', () => {
  assert.equal(readNameSound('김'), null);
  assert.equal(readNameSound('Bob'), null);
  assert.equal(readNameSound(''), null);
  assert.equal(readNameSound('  '), null);
});

test('같은 이름이면 늘 같은 답이 나온다', () => {
  const a = readNameSound('이윤섭');
  const b = readNameSound('이윤섭');
  assert.deepEqual(b, a);
});

test('이름이 다르면 답도 다르다', () => {
  const seen = new Set(
    ['김민수', '이윤섭', '박지훈', '최서연', '정하늘'].map((n) => {
      const r = readNameSound(n)!;
      return `${r.elements.join(',')}|${r.flow}|${r.lead}`;
    }),
  );
  assert.equal(seen.size, 5);
});
