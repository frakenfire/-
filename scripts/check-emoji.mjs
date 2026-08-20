#!/usr/bin/env node
// 이모지 남용을 막는다.
//
// 근거: 앱인토스 디자인 가이드 —
//   "아이콘이나 이모지를 두 개 이상 병렬로 조합하는 방식은 지양하며, 한 번에 하나만 사용해야 합니다."
// 그리고 TDS 는 Icon/SvgIcon 컴포넌트 체계를 제공할 뿐 이모지 유틸이 없다.
// 토스 UI 는 SVG 아이콘을 쓴다. 이모지를 문구에 흩뿌리면 그 순간 '남의 앱' 으로 보인다.
//
// 규칙
//  - UI 화면·문구 파일에는 이모지 리터럴을 두지 않는다.
//  - 항목 아이콘 데이터(쪽지·띠·기분 등)는 허용한다. 한 항목에 하나씩만 쓰이기 때문이다.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}]/gu;

// 항목당 아이콘 하나씩만 쓰는 데이터 — 규칙을 지키는 사용처라 허용한다.
const ICON_DATA = new Set([
  'src/data/notes.ts',
  'src/data/zodiac.ts',
  'src/data/starSign.ts',
  'src/data/fortuneTypes.ts',
  'src/data/letterFragments.ts',
  'src/data/dayMaster.ts',
  'src/data/luckyFood.ts',
  'src/data/sajuContent.ts',
  'src/data/readings.ts',
  'src/lib/rarity.ts',
  'src/lib/saju.ts',
  'src/lib/storage.ts', // 관계 라벨(베프·썸·가족…) — 항목당 아이콘 하나
]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(join(root, 'src'))) {
  const rel = file.replace(root, '');
  if (ICON_DATA.has(rel)) continue;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return; // 주석은 사람이 읽는 자리라 예외
    const m = line.match(EMOJI);
    if (m) hits.push(`${rel}:${i + 1}  [${m.join('')}]  ${line.trim().slice(0, 56)}`);
  });
}

if (hits.length) {
  console.error(`\n❌ UI 문구에 이모지 ${hits.length}곳:\n`);
  for (const h of hits) console.error(`  - ${h}`);
  console.error(
    '\n  앱인토스 가이드: 아이콘·이모지는 한 번에 하나만.',
    '\n  항목 아이콘이면 데이터 파일로 옮기고 check-emoji.mjs 의 ICON_DATA 에 등록하세요.\n',
  );
  process.exit(1);
}
console.log('✅ 이모지 규칙 통과 — UI 문구에 이모지 없음, 항목 아이콘만 허용');
