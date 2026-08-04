#!/usr/bin/env node
// 운영 번들에 mock 광고 코드가 섞여 나가지 않았는지 확인한다.
//
// src/lib/ads.ts 의 mock 은 `import.meta.env.DEV` 로 감싸져 있어 운영 빌드에서는
// 트리셰이킹으로 사라져야 한다. 그게 실제로 사라졌는지는 빌드 산출물을 봐야만 안다.
// 이 가드가 없으면 "광고를 안 봐도 보상이 열리는" 번들이 심사에 올라갈 수 있다.
//
//   node scripts/check-no-mock.mjs        # dist/ 검사 (없으면 안내 후 종료)

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url);
const distPath = DIST.pathname;

if (!existsSync(distPath)) {
  console.error('❌ dist/ 가 없어요. 먼저 `npm run build:web` 을 실행하세요.');
  process.exit(1);
}

// 운영 번들에 절대 있으면 안 되는 흔적들.
// (문자열이 minify 후에도 남는 것들만 고른다 — 함수명은 minify 로 사라질 수 있어
//  주석/문자열 리터럴 위주로 잡고, mock 경로 특유의 상수도 함께 본다)
const FORBIDDEN = [
  { pattern: 'mockRewardAd', why: 'mock 광고 함수' },
  { pattern: '개발 편의용', why: 'mock 광고 주석' },
  { pattern: 'AD_MOCK', why: 'mock 광고 플래그' },
];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(js|mjs|css|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(distPath);
if (files.length === 0) {
  console.error('❌ dist/ 에 검사할 산출물이 없어요.');
  process.exit(1);
}

const hits = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const { pattern, why } of FORBIDDEN) {
    if (text.includes(pattern)) hits.push(`${f.replace(distPath, 'dist/')}: ${why}("${pattern}")`);
  }
}

if (hits.length) {
  console.error('\n❌ 운영 번들에 mock 광고 코드가 남아 있어요 — 이대로 올리면 안 됩니다:\n');
  for (const h of hits) console.error(`  - ${h}`);
  console.error('\nsrc/lib/ads.ts 의 mock 이 import.meta.env.DEV 밖으로 새지 않았는지 확인하세요.\n');
  process.exit(1);
}

console.log(`✅ mock 광고 코드 없음 (검사 파일 ${files.length}개)`);
