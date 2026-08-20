#!/usr/bin/env node
// 토스 팔레트(TDS) 밖의 색을 막는다.
//
// 왜: 미니앱은 토스 앱 안에서 열린다. 토스에 없는 색을 쓰면 그 순간 '남의 앱'처럼 보이고,
// 디자인 심사에서도 지적된다. 사람이 눈으로 지키면 반드시 새므로 기계가 막는다.
//
// 허용되는 것
//  1) @toss/tds-colors 에 실제로 존재하는 값 (설치된 패키지에서 직접 읽는다)
//  2) 아래 EXCEPTIONS 에 이유와 함께 등록된 값
//
//   node scripts/check-palette.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

// ── 1. 토스가 실제로 쓰는 색 전부 (설치된 TDS 패키지가 유일한 출처) ──
const tdsCss = readFileSync(join(root, 'node_modules/@toss/tds-colors/colors.light.css'), 'utf8');
const TDS = new Set();
for (const m of tdsCss.matchAll(/#([0-9a-fA-F]{6})\b/g)) TDS.add(`#${m[1].toLowerCase()}`);
for (const m of tdsCss.matchAll(/#([0-9a-fA-F]{3})\b/g)) TDS.add(`#${m[1].toLowerCase()}`);

// ── 2. 문서화된 예외 ──
// TDS 에 없지만 쓸 이유가 분명한 값만. 이유 없이 늘리면 이 파일이 의미를 잃는다.
const EXCEPTIONS = new Map([
  ['#ffffff', '흰색'],
  ['#fff', '흰색'],
  ['#000000', '검정 (그림자·오버레이 계산용)'],
  ['#000', '검정 (그림자·오버레이 계산용)'],
  // TDS 노랑/주황 램프는 가장 어두운 900 도 3.0:1 대라 작은 글자의 AA(4.5:1)를 못 넘는다.
  // 접근성을 우선해 같은 계열의 더 어두운 자체 값을 쓴다 (5.28:1).
  ['#9c5d00', '노랑 계열 본문 대비 확보 — TDS Yellow900 은 3.0:1 로 AA 미달'],
  // 마스코트 일러스트 — 볼터치와 반짝임. UI 크롬이 아니라 캐릭터 고유색이라
  // TDS 로 치환하면 표정이 사라진다. (피부톤은 TDS 램프에 존재하지 않는다)
  ['#ffc7b0', '마스코트 볼터치'],
  ['#f7c948', '마스코트 반짝임'],
]);

// 행운의 색 견본(LUCKY_COLORS)은 UI 가 아니라 '오늘의 행운 색: 살구색' 이라는 콘텐츠다.
// 이름과 실제 색을 함께 보여주는 값이라, 살구색을 TDS 빨강으로 바꾸면 이름이 거짓말이 된다.

// 행운의 색 견본(ELEMENT_COLORS)은 UI 크롬이 아니라 '오늘의 행운 색'이라는 콘텐츠다.
// '민트색'·'베이지색' 처럼 이름과 함께 실제 색을 보여주는 값이라 TDS 로 치환할 수 없다.
const CONTENT_FILES = new Set(['src/lib/saju.ts', 'src/lib/luck.ts']);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(css|ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const offenders = [];
for (const file of walk(join(root, 'src'))) {
  const rel = file.replace(root, '');
  if (CONTENT_FILES.has(rel)) continue;
  const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    if (/check-palette|팔레트 예외/.test(line)) return;
    for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      const hex = m[0].toLowerCase();
      if (hex.length !== 4 && hex.length !== 7) continue; // #rgb / #rrggbb 만
      if (TDS.has(hex) || EXCEPTIONS.has(hex)) continue;
      offenders.push(`${rel}:${i + 1}  ${m[0]}   ${line.trim().slice(0, 60)}`);
    }
  });
}

if (offenders.length) {
  console.error(`\n❌ 토스 팔레트 밖의 색 ${offenders.length}개:\n`);
  for (const o of offenders) console.error(`  - ${o}`);
  console.error(
    '\n  @toss/tds-colors 의 값을 쓰거나, 쓸 이유가 분명하면',
    'scripts/check-palette.mjs 의 EXCEPTIONS 에 이유와 함께 등록하세요.\n',
  );
  process.exit(1);
}
console.log(`✅ 색상 팔레트 통과 — TDS ${TDS.size}색 + 문서화된 예외 ${EXCEPTIONS.size}개만 사용`);
