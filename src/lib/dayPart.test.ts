import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayPartOf, partPassed } from './dayPart.ts';

const at = (h: number) => new Date(2026, 8, 27, h, 30);

test('지금이 어느 토막인지 시각대로 가른다', () => {
  assert.equal(dayPartOf(at(0)), 'night');
  assert.equal(dayPartOf(at(4)), 'night');
  assert.equal(dayPartOf(at(5)), 'morning');
  assert.equal(dayPartOf(at(9)), 'morning');
  assert.equal(dayPartOf(at(10)), 'morning');
  assert.equal(dayPartOf(at(11)), 'afternoon');
  assert.equal(dayPartOf(at(16)), 'afternoon');
  assert.equal(dayPartOf(at(17)), 'evening');
  assert.equal(dayPartOf(at(21)), 'evening');
  assert.equal(dayPartOf(at(22)), 'night');
  assert.equal(dayPartOf(at(23)), 'night');
});

// 이게 이 파일이 생긴 까닭이다. 아침 아홉 시에 오후 줄이 떠 있었다.
test('아침 아홉 시에는 오후도 저녁도 아직 안 지났다', () => {
  assert.equal(partPassed('morning', at(9)), false);
  assert.equal(partPassed('afternoon', at(9)), false);
  assert.equal(partPassed('evening', at(9)), false);
});

test('밤 아홉 시에는 오전과 오후가 지나 있다', () => {
  assert.equal(partPassed('morning', at(21)), true);
  assert.equal(partPassed('afternoon', at(21)), true);
  assert.equal(partPassed('evening', at(21)), false);
});

test('자정 넘어 새벽에는 오늘 것이 아직 하나도 안 지났다', () => {
  for (const h of [0, 2, 4]) {
    assert.equal(partPassed('morning', at(h)), false, `${h}시`);
    assert.equal(partPassed('afternoon', at(h)), false, `${h}시`);
    assert.equal(partPassed('evening', at(h)), false, `${h}시`);
  }
});

test('열한 시 정각에 오전이 넘어간다', () => {
  assert.equal(partPassed('morning', new Date(2026, 8, 27, 10, 59)), false);
  assert.equal(partPassed('morning', new Date(2026, 8, 27, 11, 0)), true);
});
