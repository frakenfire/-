#!/usr/bin/env node
// 타이포그래피를 토스 스케일에 묶어둔다.
//
// 근거: @toss/tds-typography 의 fixedTypographySizeMap — 토스는 정수 크기만 쓰고,
// 크기마다 행간이 정해져 있다(13→19.5, 15→22.5, 17→25.5 …).
// 12.5px 같은 소수점 크기는 디자인 시스템에서 나올 수 없는 값이라,
// 그 자체로 '손으로 눈대중해 만든 화면' 이라는 표시가 된다. 실제로 64곳 있었다.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { fixedTypographySizeMap: MAP } = require('@toss/tds-typography');

const root = new URL('../', import.meta.url).pathname;
const css = readFileSync(`${root}src/styles/globals.css`, 'utf8');

const problems = [];

// 1) 소수점 크기 금지
for (const m of css.matchAll(/font-size: ([0-9]+\.[0-9]+)px/g)) {
  problems.push(`소수점 크기 ${m[1]}px — TDS 는 정수만 쓴다`);
}

// 2) 크기가 정해졌으면 행간도 TDS 값이어야 한다 (글리프용 좁은 행간은 예외)
const blocks = css.split(/(?<=\})\s*\n/);
for (const blk of blocks) {
  const fs = blk.match(/font-size: (\d+)px/);
  if (!fs) continue;
  const size = Number(fs[1]);
  const spec = MAP[String(size)];
  if (!spec) continue;
  const lh = blk.match(/line-height: ([0-9.]+)(px)?/);
  if (!lh) continue;
  // 배수 표기는 이모지·아이콘처럼 일부러 좁힌 자리에만 허용한다
  if (!lh[2]) {
    if (Number(lh[1]) <= 1.3) continue;
    const sel = (blk.match(/^\s*([.#][\w-]+)/m) || [, '?'])[1];
    problems.push(`${sel}: ${size}px 인데 행간이 배수(${lh[1]}) — TDS 는 ${spec.text.lineHeight}px`);
    continue;
  }
  if (Number(lh[1]) !== spec.text.lineHeight) {
    const sel = (blk.match(/^\s*([.#][\w-]+)/m) || [, '?'])[1];
    problems.push(`${sel}: ${size}px 의 행간이 ${lh[1]}px — TDS 는 ${spec.text.lineHeight}px`);
  }
}

if (problems.length) {
  console.error(`\n❌ 토스 타이포 스케일 위반 ${problems.length}곳:\n`);
  for (const p of problems.slice(0, 30)) console.error(`  - ${p}`);
  if (problems.length > 30) console.error(`  … 외 ${problems.length - 30}곳`);
  console.error('\n  크기는 정수로, 행간은 @toss/tds-typography 의 값으로 맞추세요.\n');
  process.exit(1);
}
console.log('✅ 타이포 스케일 통과 — 정수 크기 + TDS 행간');
