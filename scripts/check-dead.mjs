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
  // 버튼이 없어진 기능 — 지울지 되살릴지는 형님 판단.
  //
  // 결과 카드 저장(이미지)과 한 줄 복사는 상세 화면(DetailResultScreen)에만
  // 버튼이 있었는데, 그 화면은 setScreen 으로 열리는 길이 없어 이미 안 도는
  // 상태였다. 그래서 두 기능 다 지금 앱에서는 못 쓴다.
  // 코드는 다 짜여 있다. 결과 화면에 버튼 하나만 붙이면 바로 산다.
  // 지우면 271줄을 다시 써야 하고, 남기면 앱인토스 콘솔에 광고 그룹
  // REPLACE_REWARD_SAVE 를 하나 더 발급받아 채워야 한다.
  // 결정 전까지는 남긴다. (check:release 가 그 값을 계속 보여준다)
  ['lib/saveImage.ts:saveResultCard', '결과 카드 저장 - 버튼 붙일지 형님 결정 대기'],
  ['lib/share.ts:copyText', '한 줄 복사 - 버튼 붙일지 형님 결정 대기'],

  // 검증 표면 — 테스트가 엔진을 바깥에서 재보려면 열려 있어야 한다
  // (같은 파일 안에서만 쓰지만, 안에 두면 테스트가 못 본다. 화면 문장을 훑는
  //  방식으로는 고정 생년월일에 걸리는 밴드 하나만 검사돼 헛돌았다)
  ['lib/concernScore.ts:bandPhrase', '점수 푸는 줄의 밴드별 문장 - 여섯 가지를 직접 검사'],
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

// 주석 안의 이름을 '쓰고 있다' 로 세면 안 된다. 실제로 이것 때문에 죽은
// GOD_PULL 을 못 잡았다 - 다른 파일 주석에 이름이 적혀 있었을 뿐인데.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

const files = walk(root);
const text = new Map(files.map((f) => [f, stripComments(readFileSync(f, 'utf8'))]));
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

// ── 닿을 수 없는 화면 ────────────────────────────────────────
// 위의 export 검사로는 못 잡는 것: 화면 컴포넌트는 App.tsx 가 import 해서
// {screen === 'mood' && <MoodScreen .../>} 로 쓰고 있으니 '쓰인다'로 보인다.
// 그런데 setScreen('mood') 를 부르는 데가 한 군데도 없으면 그 가지는 영영
// 안 열린다. 실제로 topic 과 mood 두 화면이 그렇게 176줄을 들고 남아 있었고,
// 그중 하나(MoodScreen)에서 화면 이모지 규칙이 새어 나갔다. 안 도는 코드도
// 번들에는 들어가고 규칙은 그대로 어긴다.
const appFile = files.find((f) => f.endsWith('/App.tsx'));
const appSrc = appFile ? text.get(appFile) : '';
if (!appSrc) {
  console.error('\n❌ App.tsx 를 못 찾아 화면 도달 검사를 못 했습니다.\n');
  process.exit(1);
}
const union = appSrc.match(/type ScreenName =([\s\S]*?);/);
const unreachable = [];
if (!union) {
  console.error('\n❌ App.tsx 에서 ScreenName 선언을 못 읽었습니다. 검사가 헛돌고 있습니다.\n');
  process.exit(1);
}
{
  for (const m of union[1].matchAll(/'([a-zA-Z]+)'/g)) {
    const name = m[1];
    // 화면을 여는 길은 setScreen('x') 와 replaceScreen('x') 두 가지다.
    if (!new RegExp(`Screen\\(\\s*'${name}'`).test(appSrc)) unreachable.push(name);
  }
}
if (unreachable.length) {
  console.error(`\n❌ setScreen 으로 아무도 안 여는 화면 ${unreachable.length}개\n`);
  for (const u of unreachable) console.error(`  '${u}'`);
  console.error(`
  ScreenName 에는 있는데 setScreen('<이름>') / replaceScreen('<이름>') 을 부르는 데가 없습니다.
  화면과 그 분기를 지우거나, 여는 길을 만드세요.
`);
  process.exit(1);
}

if (dead.length === 0) {
  console.log(`✅ 안 쓰이는 export 없음 (허용 ${ALLOW.size}개, 검사 파일 ${files.length}개)`);
  console.log(`✅ ScreenName ${[...union[1].matchAll(/'([a-zA-Z]+)'/g)].length}개 전부 열리는 길이 있음`);
  process.exit(0);
}
console.error(`\n❌ 앱에서 아무도 안 쓰는 export ${dead.length}개\n`);
for (const d of dead) console.error(`  ${d}`);
console.error(`
  지우거나, 남길 이유가 있으면 scripts/check-dead.mjs 의 ALLOW 에 이유와 함께 적으세요.
  export 만 떼면 되는 것도 있습니다 (같은 파일 안에서만 쓰는 도우미).
`);
process.exit(1);
