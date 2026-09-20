#!/usr/bin/env node
// 제출 전에 채워야 하는 값이 남아 있는지 본다.
//
// 왜: 콘솔에서 발급받는 값(앱 ID, 아이콘 URL, 광고 그룹, 알림 템플릿)은 코드에
// 임시값으로 들어가 있다. 개발 중에는 그게 정상이다. 그대로 제출하면 광고가
// 안 나가고 아이콘이 깨지는데, 둘 다 심사에서 떨어지거나 떨어지고 나서야 안다.
//
// ads.ts 주석에는 'CI 가드가 빌드를 실패시킨다' 고 적혀 있었는데 그런 가드가
// 없었다. 주석이 거짓말을 하고 있었다. 이 파일이 그 가드다.
//
// 두 가지 모드로 돈다.
//   기본        남은 항목을 목록으로 보여주고 통과시킨다 (개발 중엔 정상이다)
//   --release   하나라도 남아 있으면 실패시킨다 (제출용 빌드)
//
//   node scripts/check-release.mjs
//   node scripts/check-release.mjs --release

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const release = process.argv.includes('--release');

// 제출 전에 반드시 콘솔 값으로 바뀌어야 하는 것들.
// 각 항목은 무엇을 어디서 받아 어디에 넣는지까지 적는다 — 목록만 보고
// 바로 채울 수 있어야 한다.
const TODOS = [
  {
    id: 'ad-groups',
    what: '광고 그룹 ID',
    where: 'src/lib/ads.ts 의 AD_GROUPS',
    how: '앱인토스 개발자센터 > 광고 에서 지점별로 발급',
    find: (s) => [...s.matchAll(/'(REPLACE_REWARD_[A-Z]+)'/g)].map((m) => m[1]),
    files: ['src/lib/ads.ts'],
  },
  {
    id: 'noti',
    what: '알림 템플릿 코드',
    where: 'src/lib/toss.ts 의 NOTI_TEMPLATE_CODE',
    how: '개발자센터 > 알림 에서 템플릿 등록 후 코드 복사',
    find: (s) => [...s.matchAll(/'(REPLACE_NOTI_[A-Z]+)'/g)].map((m) => m[1]),
    files: ['src/lib/toss.ts'],
  },
  {
    id: 'app-name',
    what: '앱 ID',
    where: 'granite.config.ts 의 appName',
    how: '개발자센터에서 앱 등록 시 발급',
    find: (s) => (/appName:\s*'today-note'/.test(s) ? ['today-note (임시 slug)'] : []),
    files: ['granite.config.ts'],
  },
  {
    id: 'icon',
    what: '앱 아이콘 URL',
    where: 'granite.config.ts 의 brand.icon',
    how: '개발자센터에 아이콘 업로드 후 static.toss.im 주소 복사',
    find: (s) => [...s.matchAll(/'(https:\/\/[^']*placeholder[^']*)'/g)].map((m) => m[1]),
    files: ['granite.config.ts'],
  },
];

// 소스 어디에도 남으면 안 되는 것 — 이건 모드와 상관없이 언제나 실패다
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

let hardFail = 0;
// 있다고 적어놓고 없는 가드 — 이 파일이 생긴 이유다. 문구가 사실과 맞는지 본다.
for (const f of walk(join(root, 'src'))) {
  const s = readFileSync(f, 'utf8');
  if (/CI 가드가 빌드를 실패시킨다/.test(s) && !/check-release/.test(s)) {
    console.error(`❌ ${f.replace(root, '')}: 없는 가드를 있다고 적은 주석`);
    hardFail += 1;
  }
}

const left = [];
for (const todo of TODOS) {
  const hits = [];
  for (const rel of todo.files) {
    let s;
    try {
      s = readFileSync(join(root, rel), 'utf8');
    } catch {
      continue;
    }
    hits.push(...todo.find(s));
  }
  if (hits.length > 0) left.push({ ...todo, hits });
}

console.log('');
if (left.length === 0 && hardFail === 0) {
  console.log('✅ 제출 전 채울 값이 남아 있지 않아요');
  process.exit(0);
}

console.log('제출 전에 채울 값');
console.log('───────────────────────────────────');
for (const x of left) {
  console.log(`  ${x.what}`);
  console.log(`    자리  ${x.where}`);
  console.log(`    받는 곳  ${x.how}`);
  console.log(`    남은 값  ${x.hits.join(', ')}`);
  console.log('');
}
console.log('  scripts/apply-console-values.mjs 로 한 번에 넣을 수 있어요.');
console.log('');

if (hardFail > 0) {
  console.error(`❌ 사실과 다른 주석 ${hardFail}곳`);
  process.exit(1);
}
if (release) {
  console.error(`❌ 제출용 빌드인데 채울 값이 ${left.length}가지 남았어요`);
  process.exit(1);
}
console.log('개발 중에는 임시값이 정상이에요. 제출 전에 --release 로 다시 확인하세요.');
