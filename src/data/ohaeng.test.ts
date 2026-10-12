import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OHAENG } from './ohaeng.ts';

const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const;

// 여섯 칸이 제비뽑기였을 때는 이런 테스트를 쓸 수가 없었다. 답이 계산이면
// 답이 맞는지 물어볼 수 있다.
test('다섯 기운의 방위·숫자가 전해오는 그대로다', () => {
  assert.equal(OHAENG.wood.direction, '동쪽');
  assert.equal(OHAENG.fire.direction, '남쪽');
  assert.equal(OHAENG.earth.direction, '가운데');
  assert.equal(OHAENG.metal.direction, '서쪽');
  assert.equal(OHAENG.water.direction, '북쪽');
  assert.deepEqual(OHAENG.water.numbers, [1, 6]);
  assert.deepEqual(OHAENG.fire.numbers, [2, 7]);
  assert.deepEqual(OHAENG.wood.numbers, [3, 8]);
  assert.deepEqual(OHAENG.metal.numbers, [4, 9]);
  assert.deepEqual(OHAENG.earth.numbers, [5, 10]);
});

test('다섯 기운이 방위도 숫자도 서로 겹치지 않는다', () => {
  const dirs = ELEMENTS.map((e) => OHAENG[e].direction);
  assert.equal(new Set(dirs).size, 5, dirs.join(' '));
  const nums = ELEMENTS.flatMap((e) => OHAENG[e].numbers);
  assert.equal(new Set(nums).size, 10, nums.join(' '));
});

test('한자도 이모지도 없다', () => {
  const all = JSON.stringify(OHAENG);
  assert.ok(!/[㐀-䶿一-鿿]/u.test(all), '한자가 들어 있어요');
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all), '이모지가 들어 있어요');
});
