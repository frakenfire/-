#!/usr/bin/env node
// 앱에서 아무도 안 쓰는 export 를 찾는다.
//
// 왜: 화면 하나(311줄)와 컴포넌트 셋이 통째로 안 닿는 채로 남아 있었다.
// 더 나쁜 건 '편지' 였다 - 뽑을 때마다 조각을 다섯 번 고르고 localStorage 에
// 다섯 번 쓰는데, 그 편지를 그리는 컴포넌트가 삭제돼 있어서 아무도 못 보는
// 글을 매번 짓고 있었다. 타입체크도 테스트도 이걸 못 잡는다. 문법은 맞으니까.
//
// 테스트만 쓰는 export 는 정상인 경우가 있다 (golden fixture, 디버그 도구).
// 그런 건 ALLOW 에 이유와 함께 적는다. 이유 없이 늘어나면 이 파일이 의미를 잃는다.
//
//   node scripts/check-dead.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname;

// 앱이 안 쓰지만 남겨두는 것. 무엇을 위해 남기는지 적는다.
const ALLOW = new Map([
  // 검증 표면 — 테스트가 엔진을 바깥에서 재보려면 열려 있어야 한다
  ['lib/goldenFixtures.ts:GOLDEN', 'golden 검증 자료'],
  ['lib/goldenFixtures.ts:DAY_ANCHOR', '일주 기준점 기록'],
  ['lib/goldenFixtures.ts:DAY_ANCHOR_CHECKED', '외부 대조한 기준점'],
  ['lib/goldenFixtures.ts:NEEDS_EXTERNAL_CHECK', '대조 안 된 항목'],
  ['lib/gradeWords.ts:GRADE_LADDER', '등급 사다리 원본'],
  ['lib/gradeWords.ts:isGradeWord', '사다리 검사'],
  ['lib/sajuDebug.ts:debugSaju', '사주 디버그 - 화면에 안 붙인다'],
  ['lib/sajuDebug.ts:formatDebug', '사주 디버그 - 화면에 안 붙인다'],
  ['lib/concernScore.ts:WEIGHTS', '몫 표 - 바뀌면 테스트가 잡는다'],
  ['lib/generateFortune.ts:ENGINE_VERSION', '엔진 버전'],
  ['lib/ads.ts:AD_GROUPS', '콘솔 값 자리 - apply-console-values 가 이름으로 찾는다'],
  ['lib/toss.ts:NOTI_TEMPLATE_CODE', '콘솔 값 자리'],
  // 엔진 내부를 따로 재보는 자리
  ['lib/daeun.ts:daeunStartAge', '대운 시작 나이 검산'],
  ['lib/daeun.ts:isYangYearStem', '양간 판정 검산'],
  ['lib/fourPillars.ts:pillarsHanja', '한자 표기 검산'],
  ['lib/fourPillars.ts:ipchunJdUt', '입춘 경계 검산'],
  ['lib/koreaTime.ts:trueSolarCorrectionMin', '진태양시 보정 검산'],
  ['lib/tenGods.ts:hiddenStemsOf', '지장간 검산'],
  ['lib/tenGods.ts:balanceShape', '강약 판정 검산'],
  ['lib/sinsal.ts:UNSEONG', '십이운성 표 검산'],
  ['lib/nameSound.ts:choseongOf', '첫소리 검산'],
  ['lib/dailySaju.ts:needFit', '일진 적합도 검산'],
  ['lib/storage.ts:weekIdOf', '주 단위 키 검산'],
  ['lib/share.ts:buildShareText', '공유 문구 검산'],
  ['lib/share.ts:INTOSS_APP_SLUG', '앱 링크'],
]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(root);
const text = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
const isTest = (f) => /\.test\.tsx?$/.test(f);

const dead = [];
for (const f of files.filter((x) => !isTest(x))) {
  const rel = f.replace(root, '');
  const s = text.get(f);
  const names = new Set();
  for (const m of s.matchAll(/^export (?:async )?function (\w+)/gm)) names.add(m[1]);
  for (const m of s.matchAll(/^export const (\w+)/gm)) names.add(m[1]);
  for (const name of names) {
    const key = `${rel}:${name}`;
    if (ALLOW.has(key)) continue;
    let used = false;
    for (const g of files) {
      if (g === f || isTest(g)) continue;
      if (new RegExp(`\\b${name}\\b`).test(text.get(g))) { used = true; break; }
    }
    if (!used) dead.push(key);
  }
}

if (dead.length === 0) {
  console.log(`✅ 안 쓰이는 export 없음 (허용 ${ALLOW.size}개, 검사 파일 ${files.length}개)`);
  process.exit(0);
}
console.error(`\n❌ 앱에서 아무도 안 쓰는 export ${dead.length}개\n`);
for (const d of dead) console.error(`  ${d}`);
console.error(`
  지우거나, 남길 이유가 있으면 scripts/check-dead.mjs 의 ALLOW 에 이유와 함께 적으세요.
  export 만 떼면 되는 것도 있습니다 (같은 파일 안에서만 쓰는 도우미).
`);
process.exit(1);
