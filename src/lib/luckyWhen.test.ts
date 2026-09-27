import { test } from 'node:test';
import assert from 'node:assert/strict';
import { luckyWhen, SLOT_END } from './luckyWhen.ts';
import { OHAENG } from '../data/ohaeng.ts';
import { TIMES } from './luck.ts';

const at = (h: number) => new Date(2026, 8, 16, h, 0, 0);

test('아직 안 온 시간대는 그대로 쓴다', () => {
  assert.deepEqual(luckyWhen('늦은 오후', at(9)), { label: '늦은 오후', passed: false });
  assert.deepEqual(luckyWhen('저녁', at(17)), { label: '저녁', passed: false });
});

test('이미 지난 시간대는 내일로 넘긴다', () => {
  assert.deepEqual(luckyWhen('늦은 오후', at(22)), { label: '내일 늦은 오후', passed: true });
  assert.deepEqual(luckyWhen('오전', at(13)), { label: '내일 오전', passed: true });
  assert.deepEqual(luckyWhen('이른 아침', at(9)), { label: '내일 이른 아침', passed: true });
});

test('구간이 끝나는 시각에 딱 걸리면 지난 것으로 본다', () => {
  assert.equal(luckyWhen('점심 무렵', at(13)).passed, true);
  assert.equal(luckyWhen('점심 무렵', at(12)).passed, false);
});

// 이 검사가 생긴 까닭. 화면에 뜨는 시각은 OHAENG 의 time 인데 luckyWhen 이
// 제 안에 표를 따로 들고 있어서 '이른 오후' 가 빠져 있었다. 흙이 용신인
// 사람은 밤 열한 시에도 '이른 오후' 를 봤다.
test('화면에 뜰 수 있는 시각은 하나도 빠짐없이 끝 시각을 안다', () => {
  const 모르는말 = [
    ...Object.values(OHAENG).map((o) => o.time),
    ...TIMES,
  ].filter((t) => SLOT_END[t] === undefined);
  assert.deepEqual([...new Set(모르는말)], []);
});

test('흙이 용신인 사람은 밤에 오후라는 말을 안 듣는다', () => {
  assert.equal(luckyWhen('이른 오후', at(23)).label, '내일 이른 오후');
  assert.equal(luckyWhen('이른 오후', at(9)).label, '이른 오후');
});

test('밤은 하루가 끝날 때까지 남아 있다', () => {
  assert.equal(luckyWhen('밤', at(23)).passed, false);
});

test('모르는 말은 건드리지 않는다', () => {
  assert.deepEqual(luckyWhen('아무때나', at(20)), { label: '아무때나', passed: false });
});
