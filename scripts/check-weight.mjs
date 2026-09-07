#!/usr/bin/env node
// 글자 굵기를 토스 범위에 묶어둔다.
//
// 근거: 토스 앱 번들(prod.ios.rn84.js)의 fontWeight 는 600(최다)·400·700·500 뿐이다.
// 800·900 은 한 번도 안 쓴다.
// 우리는 800 이 124곳이었다. 전부 굵으면 위계가 안 잡히고 화면이 뭉뚱그려 보인다 —
// 굵기로 강조를 대신하려 할 때 나오는 습관이고, 그 자체로 AI 화면의 표시가 된다.
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/styles/globals.css', import.meta.url).pathname, 'utf8');
const bad = [...css.matchAll(/font-weight: (\d+)/g)].map((m) => Number(m[1])).filter((w) => w > 700);
if (bad.length) {
  console.error(`\n❌ 토스가 쓰지 않는 굵기 ${bad.length}곳: ${[...new Set(bad)].join(', ')}`);
  console.error('   700 이하로 낮추세요 (제목 700 · 라벨 600 · 본문 400~500).\n');
  process.exit(1);
}
console.log('✅ 글자 굵기 통과 — 700 이하만 사용');
