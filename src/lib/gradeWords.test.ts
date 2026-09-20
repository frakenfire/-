import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRADE_LADDER, GRADE, isGradeWord } from './gradeWords.ts';
import { BAND_WORD } from './timing.ts';
import { GRADE_KO } from './luck.ts';
import { BAND_TAG } from '../data/detailContent.ts';

// 같은 화면에 등급 어휘가 네 체계로 굴러다녔다. '좋아요' 와 '좋음',
// '무난해요' 와 '괜찮음' 과 '보통' 과 '잔잔함' 이 같은 뜻인지 다른 뜻인지
// 읽는 사람이 알 길이 없었다. 말은 한 사다리에서만 나와야 한다.
test('모든 등급 말이 한 사다리 위에 있다', () => {
  const scales: [string, Record<string, string>][] = [
    ['점수 밴드', BAND_WORD],
    ['총운 등급', GRADE_KO],
    ['네 가지 운', BAND_TAG],
  ];
  for (const [name, table] of scales) {
    for (const [k, v] of Object.entries(table)) {
      assert.ok(isGradeWord(v), `${name}의 ${k} 가 사다리 밖이에요 — ${v}`);
    }
  }
});

test('사다리는 위에서 아래로 한 방향이다', () => {
  assert.deepEqual([...GRADE_LADDER], ['아주 좋아요', '좋아요', '무난해요', '조심할 때']);
  // 같은 뜻을 두 낱말로 적지 않는다
  assert.equal(new Set(GRADE_LADDER).size, GRADE_LADDER.length);
});

test('척도마다 사다리의 이어진 구간을 쓴다', () => {
  const rung = (w: string) => GRADE_LADDER.indexOf(w as never);
  for (const table of [BAND_WORD, BAND_TAG]) {
    const used = [...new Set(Object.values(table))].map(rung).sort((a, b) => a - b);
    for (let i = 1; i < used.length; i += 1) {
      assert.equal(used[i], used[i - 1] + 1, `칸을 건너뛰었어요: ${used.join(',')}`);
    }
  }
});

test('사다리 밖의 옛 낱말이 화면 문자열에 안 남았다', () => {
  // 지우고 나서 한 곳이라도 살아 있으면 다시 두 체계가 된다
  const GONE = ['아주 좋음', '잔잔함', '괜찮음', '살살 가요'];
  for (const table of [BAND_WORD, GRADE_KO, BAND_TAG]) {
    for (const v of Object.values(table)) {
      assert.ok(!GONE.includes(v), `옛 낱말이 남았어요 — ${v}`);
    }
  }
  assert.equal(GRADE.best, '아주 좋아요');
});
