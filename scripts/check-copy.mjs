// 화면 문구에서 'AI 가 쓴 글' 로 읽히는 문장부호를 막는다.
//
// 긴 줄표(—)는 영어권 AI 글의 대표적인 표시이고, 한국어 화면에서는 원래 거의
// 안 쓰는 부호다. 그런데 이 앱의 문구와 답변에 계속 끼어들고 있었다.
// 줄표 자리는 마침표나 쉼표로 끊는다. 짧은 줄표(–)와 말줄임(…)도 같이 본다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BANNED = [
  ['—', '긴 줄표(—)는 마침표나 쉼표로'],
  ['–', '짧은 줄표(–)는 물결(~)이나 쉼표로'],
  ['…', '말줄임(…)은 마침표 세 개도 쓰지 말고 문장을 끝내기'],
];

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(f) && !/\.test\.ts$/.test(f)) out.push(p);
  }
  return out;
}

const bad = [];
for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  const lines = src.split('\n');
  stripped.split('\n').forEach((code, i) => {
    for (const [ch, why] of BANNED) {
      if (code.includes(ch)) bad.push(`${file}:${i + 1}  ${lines[i].trim().slice(0, 80)}   ← ${why}`);
    }
  });
}

if (bad.length) {
  console.error(`\n❌ 화면 문구에 AI 티 나는 부호 ${bad.length}곳:\n`);
  for (const b of bad) console.error('  - ' + b);
  console.error('');
  process.exit(1);
}
console.log(`✅ 문구 부호 통과 (검사 파일 ${walk('src').length}개)`);
