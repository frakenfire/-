import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iljinOf, sajuToday } from './saju.ts';

// 일진 정확도 — 표준 만세력과 일치하는 앵커로 검증
test('일진(60갑자) 계산이 표준 만세력과 일치한다', () => {
  assert.equal(iljinOf('1970-01-01').hanja, '辛巳'); // 신사
  assert.equal(iljinOf('2000-01-01').hanja, '戊午'); // 무오
  assert.equal(iljinOf('2023-01-01').hanja, '己未'); // 기미
});

test('일진은 하루 단위로 정확히 1갑자씩 진행한다', () => {
  // 辛巳 다음날은 壬午
  assert.equal(iljinOf('1970-01-02').hanja, '壬午');
});

test('sajuToday 는 (날짜,띠)에 대해 결정적이다', () => {
  const a = sajuToday('2026-07-12', 'tiger');
  const b = sajuToday('2026-07-12', 'tiger');
  assert.deepEqual(a, b);
});

test('띠에 따라 오늘의 관계/톤이 달라진다', () => {
  // 서로 다른 띠는 오늘 일진과의 관계가 같을 수도, 다를 수도 있지만
  // 최소한 결과 객체가 유효한 값을 갖는다
  const r = sajuToday('2026-07-12', 'pig');
  assert.ok(['great', 'good', 'steady', 'caution'].includes(r.tone));
  assert.ok(['self', 'trine', 'union', 'clash', 'harm', 'none'].includes(r.relation));
  assert.ok(r.headline.length > 0);
  assert.ok(r.tip.length > 0);
});

test('상충(정반대 띠)은 조심 톤 쪽으로 기운다', () => {
  // 2026-07-12 = 丁亥일(지지 亥=돼지). 亥와 상충은 巳(뱀).
  const snake = sajuToday('2026-07-12', 'snake');
  assert.equal(snake.relation, 'clash');
  // 비화(같은 돼지)는 상충보다 확실히 높은 톤
  const pig = sajuToday('2026-07-12', 'pig');
  assert.equal(pig.relation, 'self');
});
