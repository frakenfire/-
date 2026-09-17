import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShareText } from './share.ts';

const BASE = {
  title: '반가운 재회',
  score: 73,
  headline: '올해는 자리를 지키면서 준비하는 해예요',
  doItem: '할 일 세 개만 적어둬요',
  dontItem: '충동구매',
};

test('고민을 골라 뽑으면 쪽지 한 장만 공유한다', () => {
  const t = buildShareText({
    ...BASE,
    topic: '일과 이직',
    bestWhen: '2027년 1월',
    careWhen: '2027년 5월',
  });
  assert.match(t, /일과 이직 73점/);
  assert.match(t, /좋은 때: 2027년 1월/);
  assert.match(t, /조심할 때: 2027년 5월/);
});

test('공유 문구에 생년월일이나 명식은 넣지 않는다', () => {
  const t = buildShareText({ ...BASE, topic: '돈', bestWhen: '2027년 1월', careWhen: '2027년 5월' });
  assert.doesNotMatch(t, /\d{4}년 \d{1,2}월 \d{1,2}일/);
  assert.doesNotMatch(t, /대운|일간|십신|사주/);
});

test('고민 없이 뽑으면 예전 브리핑 문구를 그대로 쓴다', () => {
  const t = buildShareText(BASE);
  assert.match(t, /오늘 점수 73점/);
});
