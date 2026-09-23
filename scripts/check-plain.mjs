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
  console.error('\n  무슨 기회인지, 누구 몫인지를 적으세요. 비유 대신 실제로 일어나는 일을 적으세요.');
  process.exit(1);
}
console.log(`✅ 쉬운 우리말 통과 (검사 파일 ${files.length}개)`);
