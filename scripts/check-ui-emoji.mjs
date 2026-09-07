// 화면에 이모지를 그리지 않는다.
//
// 근거: 설치된 토스 런타임 번들(prod.ios.rn84.js)에는 이모지가 한 글자도 없다.
// 이모지는 기기마다 다른 그림이 나오고(애플/삼성/윈도우), 글리프가 라인박스를
// 넘쳐 카드 테두리를 뚫기도 한다. 그림이 필요하면 components/Icon.tsx 를 쓴다.
//
// 다만 카카오톡으로 나가는 공유 문구와 저장 이미지에는 이모지가 오히려 맞다.
// 화면과 공유는 다른 매체다 — 그래서 데이터에는 남겨두고, 렌더만 막는다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx$/.test(f)) out.push(p);
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
    // 백틱 문자열은 공유 문구다 — 거기 이모지는 허용한다
    const withoutTemplates = code.replace(/`[^`]*`/g, '');
    if (EMOJI.test(withoutTemplates)) bad.push(`${file}:${i + 1}  ${lines[i].trim().slice(0, 90)}`);
  });
}

if (bad.length) {
  console.error(`\n❌ 화면에 이모지 ${bad.length}곳:\n`);
  for (const b of bad) console.error('  - ' + b);
  console.error('\ncomponents/Icon.tsx 의 선 아이콘을 쓰세요. 공유 문구라면 백틱 문자열 안에 두세요.\n');
  process.exit(1);
}
console.log(`✅ 화면 이모지 없음 (검사 파일 ${walk('src').length}개)`);
