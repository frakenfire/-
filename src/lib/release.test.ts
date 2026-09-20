import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url).pathname;
const run = (args: string[]) => {
  try {
    return { code: 0, out: execFileSync('node', ['scripts/check-release.mjs', ...args], { cwd: root, encoding: 'utf8' }) };
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string };
    return { code: err.status, out: (err.stdout ?? '') + (err.stderr ?? '') };
  }
};

// 콘솔 값이 임시인 채로 제출하면 광고가 안 나가고 아이콘이 깨진다.
// 둘 다 떨어지고 나서야 안다. 그래서 제출용 빌드는 막아야 한다.
test('제출용 빌드는 임시값이 남아 있으면 실패한다', () => {
  const r = run(['--release']);
  assert.notEqual(r.code, 0, '임시값이 있는데 통과했어요');
  assert.match(r.out, /채울 값이/);
});

test('개발 중에는 임시값이 있어도 통과하고 목록을 보여준다', () => {
  const r = run([]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /광고 그룹 ID/);
  assert.match(r.out, /앱 아이콘 URL/);
  // 어디서 받아 어디에 넣는지까지 적혀 있어야 목록만 보고 채울 수 있다
  assert.match(r.out, /개발자센터/);
});

// ads.ts 주석이 'CI 가드가 빌드를 실패시킨다' 고 적어놨는데 그런 가드가
// 없었다. 주석이 거짓말을 하는 건 주석이 없는 것보다 나쁘다.
test('없는 가드를 있다고 적은 주석이 없다', () => {
  const r = run([]);
  assert.doesNotMatch(r.out, /없는 가드를 있다고 적은 주석/, r.out);
});

test('임시 광고 그룹으로는 광고를 부르지 않는다', () => {
  // 임시값으로 SDK 를 부르면 실패가 아니라 '보상 지급' 으로 처리될 수 있다.
  const src = readFileSync(new URL('./ads.ts', import.meta.url), 'utf8');
  assert.match(src, /startsWith\('REPLACE_'\)/, '임시값 차단이 없어요');
});
