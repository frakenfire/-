#!/usr/bin/env node
// 쉬운 우리말 검사 — 화면에 나가는 모든 글자에 건다.
//
// '내 몫과 남의 몫이 자주 섞이는 십 년이에요' 를 읽고 무슨 말인지 모르겠다는
// 말을 들었다. 맞는 말이다. 몫이 뭔지, 섞인다는 게 무슨 장면인지 안 나온다.
//
// 국립국어원 공공언어 지침과 쉬운 우리말 자료에서 가져온 네 가지를 건다.
//   1) 장면이 안 그려지는 낱말을 쓰지 않는다 (몫·기회·여건·방식이·결이·흐름이)
//   2) 비유로 설명하지 않는다 (섞이다·깔다·밀어놓다·물꼬·발판·밑거름)
//   3) 동작을 명사로 굳혀 끝내지 않는다 ('~하는 힘이에요' '~하는 법이에요')
//   4) '것' 을 주어로 쓰지 않는다
//
// 처음 걸었을 때 115줄이 걸렸고 전부 고쳤다. 지금은 0이다.
//
//   node scripts/check-plain.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname;

const RULES = [
  { id: '장면이 안 그려지는 낱말',
    re: /몫|기회|여건|구조적|(^|[ .,"'([])방식이|(^|[ .,"'([])결이|(^|[ .,"'([])흐름이|역량|가치관|마인드|밸런스|(^|[ .,"'([])균형이|시너지|프레임|잠재력|에너지가/ },
  { id: '비유', re: /섞이는|섞여|(^|[ .,])깔아|(^|[ .,])깔고|밀어놓|물꼬|발판|주춧돌|날개를|밑거름|불씨|씨앗을|토대를/ },
  { id: '동작을 명사로 굳힌 끝', re: /(연습|습관|힘|법|자세|태도|능력|마음가짐|과정|작업|노력)이에요[.]?$/ },
  { id: "'것' 을 주어로", re: /(^|[.!?]\s)(그 )?것[이은]\s/ },
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
for (const p of files) {
  readFileSync(p, 'utf8').split('\n').forEach((ln, i) => {
    const t0 = ln.trim();
    if (t0.startsWith('//') || t0.startsWith('*') || t0.startsWith('/*')) return;
    for (const m of ln.matchAll(/'([^']{12,})'/g)) {
      const t = m[1];
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
  console.error('\n  무슨 기회인지, 누구 몫인지를 적으세요. 비유 대신 실제로 일어나는 일을 적으세요.');
  process.exit(1);
}
console.log(`✅ 쉬운 우리말 통과 (검사 파일 ${files.length}개)`);
