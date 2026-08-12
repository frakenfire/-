#!/usr/bin/env node
// 앱인토스 심사 반려 사유를 번들에서 사전 차단한다.
//
// 근거 (앱인토스 개발자 커뮤니티의 실제 반려 사례들):
//  - eval 등 외부 코드를 받아 실행할 수 있는 코드는 보안상 허용되지 않음 → 즉시 반려
//  - 리소스는 HTTPS 여야 함
//  - (번들 밖 항목이지만 함께 검사) 시크릿이 번들에 새어 들어가면 안 됨
//
//   node scripts/check-bundle-policy.mjs      # dist/ 검사

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const distPath = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(distPath)) {
  console.error('❌ dist/ 가 없어요. 먼저 `npm run build:web` 을 실행하세요.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(js|mjs|css|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

const CHECKS = [
  {
    name: 'eval 계열 (토스 심사 즉시 반려)',
    // 식별자 경계를 걸어 minify 된 변수명(예: `.evaluate`) 오탐을 피한다
    re: /\beval\s*\(|new Function\s*\(|document\.write\s*\(/,
  },
  {
    name: 'http:// 리소스 (HTTPS 필수)',
    // SVG/XML 네임스페이스(w3.org)는 URL 로 fetch 되지 않는 식별자라 제외
    re: /http:\/\/(?!www\.w3\.org|localhost|127\.0\.0\.1)[a-z0-9.-]+/i,
  },
  {
    name: '시크릿 패턴',
    re: /AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{30,}|-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
  },
];

const files = walk(distPath);
const hits = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const { name, re } of CHECKS) {
    const m = text.match(re);
    if (m) hits.push(`${f.replace(distPath, 'dist/')}: ${name} → "${m[0].slice(0, 40)}"`);
  }
}

if (hits.length) {
  console.error('\n❌ 심사 반려 위험 — 번들에서 발견:\n');
  for (const h of hits) console.error(`  - ${h}`);
  process.exit(1);
}
console.log(`✅ 번들 정책 통과 — eval 없음 · HTTPS only · 시크릿 없음 (검사 파일 ${files.length}개)`);
