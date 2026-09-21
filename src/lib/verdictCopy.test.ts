import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 결정 카드 둘째 줄이 여섯 고민 모두 '~쪽이 남아요' 한 틀이었다.
// '남는다 = 이득이다' 는 가게 장부에서 쓰는 말이라, 읽는 사람은 무엇이
// 남는다는 건지 모른다. 게다가 어느 고민을 물어도 같은 모양이 나왔다.
const SRC = readFileSync(new URL('./deepRead.ts', import.meta.url), 'utf8');
const BLOCK = SRC.slice(
  SRC.indexOf('const VERDICT_SUB'),
  SRC.indexOf('export function buildDeepRead'),
);
const LINES = [...BLOCK.matchAll(/(now|soon|wait): '([^']+)'/g)].map((m) => ({ k: m[1], t: m[2] }));

test('결정 문장 열여덟 줄을 다 찾는다', () => {
  assert.equal(LINES.length, 18, `${LINES.length}줄만 찾았어요`);
});

test("'남아요' 로 이득을 말하지 않는다", () => {
  const bad = LINES.filter((l) => /남아요/.test(l.t));
  assert.deepEqual(bad.map((b) => b.t), [], '가게 장부 말이 남아 있어요');
});

test('여섯 고민의 결론이 같은 틀로 찍히지 않는다', () => {
  for (const k of ['now', 'soon', 'wait']) {
    const ts = LINES.filter((l) => l.k === k).map((l) => l.t);
    assert.equal(ts.length, 6, k);
    // 끝 여섯 글자가 여섯 개 모두 같으면 틀을 돌려쓴 것이다
    const tails = new Set(ts.map((t) => t.slice(-6)));
    assert.ok(tails.size >= 2, `${k}: 여섯이 전부 '${[...tails][0]}' 로 끝나요`);
  }
});

test('무엇을 하지 말고 무엇을 하라는지가 들어 있다', () => {
  for (const l of LINES.filter((x) => x.k === 'wait')) {
    assert.ok(/아니에요/.test(l.t), `무엇을 하지 말라는지가 없어요: ${l.t}`);
    assert.ok(/세요\.$/.test(l.t), `무엇을 하라는지가 없어요: ${l.t}`);
  }
});
