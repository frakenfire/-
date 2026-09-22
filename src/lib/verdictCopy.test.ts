import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verdictTwoOf } from '../data/verdictBySituation.ts';
import { CONCERNS } from '../data/concerns.ts';

// 결과 화면 맨 위 두 줄. 전에는 여섯 고민이 '~쪽이 남아요' 한 틀을 돌려썼고,
// 그 다음에는 고민만 보고 고르느라 '쉬는 중' 인 사람에게 '자리를 지키는
// 해예요' 가 나갔다. 두 가지를 다 막는다.

const ALL = CONCERNS.flatMap((c) =>
  c.options.flatMap((o) =>
    (['now', 'soon', 'wait'] as const).map((v) => ({
      c: c.key, o: o.key, v, ...verdictTwoOf(c.key, o.key, v),
    }))));

test('고민 여섯 x 상황 넷 x 판정 셋을 다 채웠다', () => {
  assert.equal(ALL.length, 72, `${ALL.length}줄만 있어요`);
});

test('일흔두 줄이 전부 다른 말이다', () => {
  const heads = ALL.map((x) => x.head);
  const subs = ALL.map((x) => x.sub);
  assert.equal(new Set(heads).size, 72, '큰 글자가 겹쳐요');
  assert.equal(new Set(subs).size, 72, '설명 줄이 겹쳐요');
});

test("'남아요' 로 이득을 말하지 않는다", () => {
  const bad = ALL.filter((x) => /남아요/.test(x.head) || /남아요/.test(x.sub));
  assert.deepEqual(bad.map((b) => b.head), [], '가게 장부 말이 남아 있어요');
});

test('한 고민 안에서 상황마다 다른 말이 나온다', () => {
  // 같은 고민 같은 판정인데 상황 넷이 같은 말이면 상황을 물어본 적이 없는 것이다.
  for (const c of CONCERNS) {
    for (const v of ['now', 'soon', 'wait'] as const) {
      const heads = c.options.map((o) => verdictTwoOf(c.key, o.key, v).head);
      assert.equal(new Set(heads).size, heads.length, `${c.key}/${v}: ${heads.join(' / ')}`);
    }
  }
});

test('soon 은 언제인지 자리를 비워둔다', () => {
  for (const x of ALL) {
    if (x.v === 'soon') assert.ok(x.head.includes('{when}'), `${x.c}/${x.o}: ${x.head}`);
    else assert.ok(!x.head.includes('{when}'), `${x.c}/${x.o}/${x.v}: ${x.head}`);
  }
});

test('상황을 안 골라도 고른 상황 중 하나로 나온다', () => {
  for (const c of CONCERNS) {
    const fallback = verdictTwoOf(c.key, null, 'wait');
    const real = c.options.map((o) => verdictTwoOf(c.key, o.key, 'wait'));
    assert.ok(real.some((r) => r.head === fallback.head), `${c.key}: 없는 말이 나와요`);
    // 없는 키가 와도 터지지 않고 같은 것으로 떨어진다
    assert.deepEqual(verdictTwoOf(c.key, 'nope', 'wait'), fallback);
  }
});
