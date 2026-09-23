import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OHAENG, ohaengWhy } from './ohaeng.ts';

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

// 고민을 골랐으면 끝까지 그 고민의 말로 말해야 한다. 돈을 물은 사람에게
// 화면 아래쪽이 '중요한 건 늦은 오후에' 로 바뀌면, 그 순간부터 딴 앱이 된다.
test('고민을 주면 그 고민의 말로 쓴다', () => {
  const money = { luckyWhere: '돈 얘기를 꺼내기 좋은 쪽', luckyWhen: '큰 돈이 오가는 일은' };
  const t = ohaengWhy('metal', '흰색', money);
  assert.ok(t.includes('돈 얘기를 꺼내기 좋은 쪽'), t);
  assert.ok(t.includes('큰 돈이 오가는 일은'), t);
  assert.ok(!t.includes('오늘 내 자리'), t);
  assert.ok(!t.includes('중요한 건'), t);
});

test('고민이 없으면 일반 문장으로 쓴다', () => {
  const t = ohaengWhy('metal', '흰색');
  assert.ok(t.includes('오늘 내 자리'), t);
  assert.ok(t.includes('중요한 건'), t);
});

test('문장마다 줄을 나눈다', () => {
  const lines = ohaengWhy('wood', '초록색').split('\n');
  assert.equal(lines.length, 5, lines.join(' | '));
  for (const l of lines) {
    assert.ok(l.trim().length > 0, '빈 줄이 있어요');
    assert.ok(l.length <= 60, `한 줄이 너무 길어요 (${l.length}자): ${l}`);
  }
});

test('풀어 쓴 문단이 다섯 갈래 모두에서 말이 된다', () => {
  for (const e of ELEMENTS) {
    const t = ohaengWhy(e, '파란색');
    assert.ok(t.includes(OHAENG[e].ko), e);
    assert.ok(t.includes(OHAENG[e].direction), e);
    assert.ok(t.includes(String(OHAENG[e].numbers[0])), e);
    assert.ok(t.includes(OHAENG[e].time), e);
    assert.ok(t.includes(OHAENG[e].taste), e);
    // 갈래 이름은 첫 문장에서 한 번만
    assert.equal(t.split(`${OHAENG[e].ko} 쪽`).length - 1, 1, `${e}: ${t}`);
    // 숫자 뒤 조사가 소리를 따라간다 ('2과 7' 같은 게 안 나오게)
    const [a, b] = OHAENG[e].numbers;
    const josa = [2, 4, 5, 9].includes(a) ? '와' : '과';
    assert.ok(t.includes(`${a}${josa} ${b}`), `${e}: ${t}`);
  }
});

test('방향 뒤 조사가 받침을 따라간다', () => {
  assert.ok(ohaengWhy('wood', '초록색').includes('동쪽이 오늘 내 자리'));
  assert.ok(ohaengWhy('earth', '노란색').includes('가운데가 오늘 내 자리'));
});
