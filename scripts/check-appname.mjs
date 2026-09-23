// 앱 이름과 말줄임 문자를 지킨다.
//
// 콘솔에 올린 이름은 '오늘의 마음 한장' 인데, 카카오로 보내지는 공유 글과
// 궁합 초대 글에는 옛 이름 '오늘쪽지' 가 그대로 남아 있었다. 화면에는 안
// 뜨는 글자라 화면 점검(design-audit)으로는 한 번도 안 걸렸다. 심사에서
// 이름이 다르면 반려 사유가 되고, 받는 사람도 무슨 앱인지 모른다.
//
// 말줄임 문자(…·⋯)도 같이 본다. 띠 서열 공유 글 가운데에 '⋯' 한 줄이
// 있었다. 기존 검사는 '…'(U+2026)만 보고 있어서 '⋯'(U+22EF)는 통과했다.
//
//   node scripts/check-appname.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NAME = '오늘의 마음 한장';
// 화면·공유 글에 쓰이는 옛 이름들. 'today-note' 는 npm 꾸러미 이름이라 여기 없다.
const OLD = ['오늘쪽지', '오늘 쪽지 뽑기'];

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts|mjs|html)$/.test(f) && !/\.test\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

// 검사 파일 자신과 다른 검사기는 안 본다. 규칙을 설명하려면 그 글자를 써야 한다.
const files = [...walk('src'), 'index.html', 'granite.config.ts'];
const bad = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  stripped.split('\n').forEach((code, i) => {
    for (const old of OLD) {
      if (code.includes(old)) bad.push(`${file}:${i + 1}  '${old}' — 앱 이름은 '${NAME}' 이에요`);
    }
    const dots = code.match(/[…⋯]/);
    if (dots) bad.push(`${file}:${i + 1}  '${dots[0]}' — 말줄임 문자는 안 써요`);
  });
}

// 콘솔에 올린 이름과 코드가 같은지 직접 본다
const granite = readFileSync('granite.config.ts', 'utf8');
if (!granite.includes(`displayName: '${NAME}'`)) {
  bad.push(`granite.config.ts  displayName 이 '${NAME}' 이 아니에요`);
}
if (!readFileSync('index.html', 'utf8').includes(`<title>${NAME}</title>`)) {
  bad.push(`index.html  <title> 가 '${NAME}' 이 아니에요`);
}

if (bad.length) {
  console.error(`\n❌ 이름·문자 ${bad.length}곳:\n`);
  for (const b of bad) console.error('  - ' + b);
  console.error('');
  process.exit(1);
}
console.log(`✅ 앱 이름 '${NAME}' 로 통일, 말줄임 문자 없음 (검사 파일 ${files.length}개)`);
