// 화면 문구가 '구간' 으로 도망가지 못하게 막는다.
//
// 결과 화면에서 제일 큰 글자가 '곧 돈이 도는 구간이 와요' 였다. 돈이 언제
// 어떻게 도는지 아무것도 말하지 않는다. 이 앱은 달 단위로 계산하므로
// '이 달', '이번 달', '2026년 10월' 처럼 실제 단위로 쓸 수 있다.
//
// 왜 화면 점검(audit)만으로는 부족한가: 한 번 뽑은 화면에는 그 사람의
// 십성·밴드에 걸린 문장만 나온다. 나머지 수백 개는 안 뜬다. 그래서 소스를
// 직접 훑는다. 주석은 뺀다 - 이 규칙을 설명하는 주석에도 그 단어가 나온다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BANNED = [
  ['구간', "'이 달'·'이번 달'·'올해' 처럼 실제 단위로. 아니면 그 고민의 명사로"],
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
  // 주석을 같은 길이의 공백으로 바꿔 줄·칸 번호를 지킨다
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  const lines = src.split('\n');
  stripped.split('\n').forEach((code, i) => {
    for (const [word, why] of BANNED) {
      if (code.includes(word)) bad.push(`${file}:${i + 1}  ${lines[i].trim().slice(0, 80)}   ← ${why}`);
    }
  });
}

if (bad.length) {
  console.error(`\n❌ 뜬구름 잡는 말 ${bad.length}곳:\n`);
  for (const b of bad) console.error('  - ' + b);
  console.error('');
  process.exit(1);
}
console.log('✅ 뜬구름 표현 없음 (검사 파일 ' + walk('src').length + '개)');
