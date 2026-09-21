import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const run = (args: string[]) => {
  try {
    return { code: 0, out: execFileSync('node', ['scripts/check-release.mjs', ...args], { cwd: root, encoding: 'utf8' }) };
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string };
    return { code: err.status, out: (err.stdout ?? '') + (err.stderr ?? '') };
  }
};

// 전에는 이 테스트들이 저장소의 지금 값에 기대고 있었다. '임시값이 남아 있으면
// 실패한다' 를 저장소에 임시값이 남아 있다는 사실로 확인한 것이다. 그래서
// 형님이 콘솔 값을 채우는 순간 npm run verify 가 깨졌다 - 제출하려고 값을
// 넣었더니 빌드가 빨개지는, 제일 나쁜 자리에서 터지는 실패였다.
//
// 이제 두 상태를 직접 만들어 놓고 잰다. 저장소가 어느 쪽이든 결과가 같다.
function fixture(filled: boolean): string {
  const dir = mkdtempSync(join(tmpdir(), 'release-'));
  mkdirSync(join(dir, 'src/lib'), { recursive: true });
  const ad = filled ? 'ad-group-1234' : 'REPLACE_REWARD_NOTE';
  const noti = filled ? 'NOTI_T1' : 'REPLACE_NOTI_TEMPLATE';
  const app = filled ? 'todaynote-ab12' : 'today-note';
  const icon = filled
    ? 'https://static.toss.im/appsintoss/real.png'
    : 'https://static.toss.im/appsintoss/placeholder-today-note.png';
  writeFileSync(join(dir, 'src/lib/ads.ts'), `export const AD_GROUPS = { note: '${ad}' } as const;\n`);
  writeFileSync(join(dir, 'src/lib/toss.ts'), `export const NOTI_TEMPLATE_CODE = '${noti}';\n`);
  writeFileSync(join(dir, 'granite.config.ts'), `export default { appName: '${app}', brand: { icon: '${icon}' } };\n`);
  return dir;
}

test('제출용 빌드는 꼭 필요한 값이 비면 실패한다', () => {
  const dir = fixture(false);
  const r = run([`--dir=${dir}`, '--release']);
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(r.code, 0, '임시값이 있는데 통과했어요');
  assert.match(r.out, /꼭 채워야 할 값이/);
});

// 광고 그룹은 콘솔에서 신청해도 구글 반영을 기다려야 나온다. 그것 때문에
// 출시를 못 하면 이 검사가 제출을 돕는 게 아니라 막는 문이 된다.
// 안 채우면 광고를 아예 안 부르고 기능을 전부 무료로 연다.
test('광고 그룹과 알림 템플릿만 비면 제출을 막지 않는다', () => {
  const dir = fixture(true);
  writeFileSync(join(dir, 'src/lib/ads.ts'), "export const AD_GROUPS = { note: 'REPLACE_REWARD_NOTE' } as const;\n");
  writeFileSync(join(dir, 'src/lib/toss.ts'), "export const NOTI_TEMPLATE_CODE = 'REPLACE_NOTI_TEMPLATE';\n");
  const r = run([`--dir=${dir}`, '--release']);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /광고 없이 나갑니다/);
});

test('앱 ID 가 임시 slug 면 제출을 막는다', () => {
  // 이건 진짜 막아야 한다. 콘솔 등록값과 다르면 반려 1순위다.
  const dir = fixture(true);
  writeFileSync(join(dir, 'granite.config.ts'),
    "export default { appName: 'today-note', brand: { icon: 'https://static.toss.im/appsintoss/real.png' } };\n");
  const r = run([`--dir=${dir}`, '--release']);
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(r.code, 0, '임시 slug 로 통과했어요');
});

test('값을 다 채우면 제출용 빌드가 통과한다', () => {
  const dir = fixture(true);
  const r = run([`--dir=${dir}`, '--release']);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(r.code, 0, r.out);
});

test('개발 중에는 임시값이 있어도 통과하고 목록을 보여준다', () => {
  const dir = fixture(false);
  const r = run([`--dir=${dir}`]);
  rmSync(dir, { recursive: true, force: true });
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
