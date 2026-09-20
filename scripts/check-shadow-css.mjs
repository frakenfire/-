#!/usr/bin/env node
// 덮여서 아무 일도 안 하는 CSS 선언을 막는다.
//
// 왜: 같은 선택자에 같은 속성을 두 번 적으면 앞의 것은 브라우저에 닿지 않는다.
// 문제는 파일을 읽는 사람에게는 닿는다는 것이다. 실제로 .today-hook 의 바탕이
// 위에서는 var(--brand-strong)(진한 파랑), 아래에서는 var(--brand-soft)(연파랑)
// 이라고 적혀 있었고, 화면은 연파랑인데 파일은 진한 파랑이라고 말하고 있었다.
// .sec-card .cat4__head 도 17px 과 18px 로 두 번 적혀 있었다.
// 한 번에 125개가 이렇게 죽은 글이었다.
//
// 값이 같은 중복도 막는다. 지금 같아도 한쪽만 고치는 순간 조용히 갈린다.
//
//   npm run check:shadow

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const postcss = require('postcss');
const file = new URL('../src/styles/globals.css', import.meta.url).pathname;
const root = postcss.parse(readFileSync(file, 'utf8'));

// @media 안과 밖은 서로 다른 자리다. 조상 at-rule 까지 키에 넣는다.
const ctxOf = (rule) => {
  let ctx = '';
  for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) ctx = `@${p.name} ${p.params}|` + ctx;
  return ctx;
};

const seen = new Map();
root.walkDecls((d) => {
  const rule = d.parent;
  if (!rule || rule.type !== 'rule') return;
  const ctx = ctxOf(rule);
  for (const sel of rule.selectors) {
    const key = `${ctx}${sel.replace(/\s+/g, ' ').trim()}|${d.prop}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push({ d, sel });
  }
});

const dead = [];
for (const [key, list] of seen) {
  if (list.length < 2) continue;
  const last = list[list.length - 1].d;
  for (const { d, sel } of list.slice(0, -1)) {
    // 앞이 !important 이고 뒤가 아니면 앞이 이긴다 — 죽은 게 아니다
    if (d.important && !last.important) continue;
    dead.push({
      line: d.source.start.line, winner: last.source.start.line,
      sel, prop: d.prop, value: d.value.replace(/\s+/g, ' ').trim(),
      winValue: last.value.replace(/\s+/g, ' ').trim(), key,
    });
  }
}
dead.sort((a, b) => a.line - b.line);

if (dead.length) {
  console.error(`\n❌ 덮여서 아무 일도 안 하는 선언 ${dead.length}개:\n`);
  for (const x of dead.slice(0, 40)) {
    const same = x.value === x.winValue;
    console.error(`  ${String(x.line).padStart(5)}줄 → ${x.winner}줄이 이김   ${x.sel} { ${x.prop}: ${x.value} }`
      + (same ? '   (값까지 같음)' : `  →  ${x.winValue}`));
  }
  if (dead.length > 40) console.error(`  … 그리고 ${dead.length - 40}개 더`);
  console.error('\n  앞의 것을 지우거나, 뒤의 것을 앞자리로 옮기세요.\n');
  process.exit(1);
}
console.log(`✅ 덮인 선언 없음 (선언 자리 ${seen.size}가지)`);
