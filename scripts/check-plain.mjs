#!/usr/bin/env node
// 문구에서 실제로 확인한 비문과 뜻이 모호한 사주 별명을 검사한다.
// '기회', '몫', '흐름' 같은 일상어와 비유 자체를 금지하면 오히려 억지스러운
// 대체 표현이 생긴다. 단어의 유무로 자연스러움을 판정하지 않는다.
//
//   node scripts/check-plain.mjs

import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../src/', import.meta.url));

const RULES = [
  { id: '뜻이 모호한 사주 별명', re: /잡아채는 힘|달리 배우는 힘|내 힘을 받아 쓰는|오늘 날 글자|다섯 갈래로 갈라/ },
  { id: '뜻이 불분명한 표현', re: /잘 먹히고 잘 쉬어|붙는 숫자|씨가 앉는 자리|오늘 내 자리|십 년이 어느 쪽으로 도는/ },
  { id: '잘못 붙은 조사', re: /나무을|가운데이에요|쇠을|물를|흙를|불를/ },
];

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p) && !/\.test\./.test(p)) files.push(p);
  }
})(root);

const bad = [];
// 화면에 나가는 글자를 한 줄에서 모두 꺼낸다.
//
// 처음에는 작은따옴표 안의 12자 이상만 봤다. 그래서 세 군데가 통째로 빠져 있었다.
//   - `백틱` 과 "큰따옴표" 로 쓴 문장
//   - 짧은 이름표. '제 몫 하는 자리' 는 아홉 자라 12자 문턱 아래였다
//   - JSX 로 그냥 적은 글. '다섯 칸을 몫대로 더하면' 은 따옴표가 없다
// 검사가 안 보는 자리가 있으면 그 자리로 다시 모인다. 셋 다 본다.
function textsOf(code) {
  const out = [];
  for (const m of code.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)) out.push(m[1] ?? m[2] ?? m[3]);
  // 따옴표를 걷어내고도 한글이 남으면 그건 JSX 로 적은 글이다
  const rest = code.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, ' ').replace(/\{[^}]*\}/g, ' ');
  if (/[가-힣]/.test(rest)) out.push(rest.trim());
  return out;
}

// 주석은 화면에 안 나간다. 줄 머리만 보고 걸러내면 여러 줄 주석의 가운데
// 줄들이 그대로 통과한다. 줄·칸 번호를 지키려고 같은 길이의 공백으로 바꾼다.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

for (const p of files) {
  stripComments(readFileSync(p, 'utf8')).split('\n').forEach((ln, i) => {
    for (const t of textsOf(ln)) {
      if (!/[가-힣]/.test(t)) continue;
      for (const r of RULES) {
        const hit = t.match(r.re);
        if (hit) bad.push(`${p.replace(root, 'src/')}:${i + 1}  [${r.id}: ${hit[0].trim()}]  ${t.slice(0, 60)}`);
      }
    }
  });
}

if (bad.length) {
  console.error(`❌ 읽어도 장면이 안 그려지는 줄 ${bad.length}곳:\n`);
  for (const b of bad.slice(0, 40)) console.error('  - ' + b);
  if (bad.length > 40) console.error(`  ... 그 밖 ${bad.length - 40}곳`);
  console.error('\n  사주 용어는 짧게 설명하고, 조사와 문장 전체의 뜻을 확인하세요.');
  process.exit(1);
}
console.log(`✅ 쉬운 우리말 통과 (검사 파일 ${files.length}개)`);
