// 화면에 한자를 노출하지 않는다.
//
// 사주 앱이라 코드 안에는 한자가 많다 — 甲子, 十神, 支藏干. 계산에는 필요하다.
// 하지만 읽는 사람 대부분에게 '壬 큰 물' 은 앞 글자가 그냥 장벽이다.
// 그래서 주석·내부 데이터에는 두되, JSX 로 그려지는 문자열에는 못 들어가게 막는다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const HANJA = /[㐀-䶿一-鿿]/;
// 계산·데이터용으로 한자를 들고 있어도 되는 파일 (화면에 직접 그리지 않는다)
const DATA_FILES = new Set([
  'src/lib/saju.ts',
  'src/lib/fourPillars.ts',
  'src/lib/tenGods.ts',
  'src/lib/manse.ts',
  'src/data/dayMaster.ts',
]);

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
  // 주석은 통과 — 근거를 한자로 적어두는 편이 정확하다.
  // 줄 수를 보존해야 줄 번호가 어긋나지 않으므로, 지우는 대신 줄바꿈만 남긴다.
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  const lines = src.split('\n');
  stripped.split('\n').forEach((code, i) => {
    // 계산용 파일에서도 한자를 들고 있어도 되는 건 hanja 필드 하나뿐이다.
    // 그 외의 문자열(예: ELEMENT_KO 의 '목(木)')은 그대로 화면에 나간다.
    if (DATA_FILES.has(file) && /\bhanja:/.test(code)) return;
    if (HANJA.test(code)) bad.push(`${file}:${i + 1}  ${lines[i].trim().slice(0, 90)}`);
  });
}

// 리터럴 한자만 막으면 반쪽이다. 실제로 화면에 '壬 큰 물' 을 띄운 건
// `${dm.hanja} ${dm.name}` 이었다 — 소스에는 한자가 한 글자도 없었다.
// 그래서 화면을 그리는 파일에서 .hanja 를 읽는 것 자체를 막는다.
const HANJA_FIELD = /\.hanja\b|\bhanja:/;
for (const file of walk('src')) {
  if (!/^src\/(screens|components)\//.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  const lines = src.split('\n');
  stripped.split('\n').forEach((code, i) => {
    if (HANJA_FIELD.test(code)) bad.push(`${file}:${i + 1}  ${lines[i].trim().slice(0, 90)}`);
  });
}

if (bad.length) {
  console.error(`\n❌ 화면 문자열에 한자 ${bad.length}곳:\n`);
  for (const b of bad) console.error('  - ' + b);
  console.error('\n한글로 바꾸거나, 계산용이면 DATA_FILES 에 근거와 함께 추가하세요.\n');
  process.exit(1);
}
console.log(`✅ 한자 규칙 통과 — 화면 문자열에 한자 없음 (검사 파일 ${walk('src').length}개)`);
