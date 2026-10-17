// 화면에 나오는 한국어 문장을 전부 표로 뽑는다.
//
// 왜: 말투를 한 줄씩 소스에서 고치면 수천 줄을 여러 파일에서 찾아야 한다.
// 표로 뽑아서 사람이든 GPT 든 한자리에서 고치고, copy-import.mjs 로 되돌려 넣는다.
//
//   node scripts/copy-export.mjs            → release/copy/문구표.csv
//
// 표의 '지금 문구' 칸은 소스에 적힌 그대로다. 줄바꿈은 \n 두 글자로, ${...} 와 {...} 는
// 코드가 값을 끼우는 자리라 그대로 둬야 한다. copy-import 는 이 칸을 그대로 찾아 바꾼다.
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// 계산·데이터용이라 화면 말투와 상관없는 파일. 지명, 간지 이름, 시험용 값 같은 것들.
const SKIP = new Set([
  'data/birthPlace.ts',
  'lib/lunar.ts',
  'lib/fourPillars.ts',
  'lib/sajuRuleset.ts',
  'lib/goldenFixtures.ts',
  'lib/sajuDebug.ts',
  'lib/astro.ts',
  'lib/josa.ts',
  'lib/nameSound.ts',
]);

// 파일이 화면 어디에 나오는지. 고치는 사람이 맥락을 알게 한다.
const AREA = {
  'screens/HomeScreen.tsx': '홈 화면',
  'screens/ResultScreen.tsx': '결과 화면',
  'screens/BirthScreen.tsx': '생년월일 입력 화면',
  'screens/CompatScreen.tsx': '친구 궁합 화면',
  'screens/ConcernScreen.tsx': '고민 고르기 화면',
  'screens/ConcernAskScreen.tsx': '고민 상황 묻기 화면',
  'screens/NotePickScreen.tsx': '쪽지 고르기 화면',
  'screens/RevealScreen.tsx': '쪽지 여는 중 화면',
  'screens/GiftScreen.tsx': '행운 반쪽 받는 화면',
  'data/copy.ts': '홈 인사말과 공통 문구',
  'data/howItWorks.ts': '홈 아래 설명',
  'data/dayDesign.ts': '결과: 오늘 이렇게 보내요',
  'data/resultTemplates.ts': '결과: 쪽지 본문',
  'data/readings.ts': '결과: 등급별 한 줄',
  'data/moodEcho.ts': '결과: 기분 맞춤 한마디',
  'data/detailContent.ts': '결과: 네 가지 운 풀이와 부적 문장',
  'data/todayVerdict.ts': '고민 답: 오늘의 답',
  'data/situationPlan.ts': '고민 답: 상황별 계획',
  'data/concernReadings.ts': '고민 답: 풀이',
  'data/verdictBySituation.ts': '고민 답: 상황별 판정',
  'data/concernNow.ts': '고민 답: 지금 할 일',
  'data/concernDay.ts': '고민 답: 오늘 이 고민',
  'data/concernDayOverride.ts': '고민 답: 오늘 이 고민(예외)',
  'data/concernFocus.ts': '고민 답: 볼 점',
  'data/concernGodOverride.ts': '고민 답: 사주 예외',
  'data/concerns.ts': '고민 목록과 질문',
  'data/decision.ts': '고민 답: 할까 말까',
  'data/gifts.ts': '행운 반쪽 한마디',
  'data/notes.ts': '쪽지 이름',
  'data/luckyFood.ts': '행운 음식',
  'data/zodiac.ts': '띠',
  'data/starSign.ts': '별자리',
  'lib/saju.ts': '홈: 띠별 오늘 운세',
  'lib/compat.ts': '친구 궁합 풀이',
  'lib/starCompat.ts': '별자리 궁합 풀이',
  'lib/deepRead.ts': '고민 답: 상세 풀이',
  'lib/dayVibe.ts': '홈: 오늘 한 줄',
  'lib/share.ts': '공유할 때 나가는 글',
};
function areaOf(rel) {
  if (AREA[rel]) return AREA[rel];
  if (rel.startsWith('components/')) return '화면 조각: ' + rel.slice(11).replace(/\.tsx?$/, '');
  if (rel.startsWith('data/')) return '사주 풀이 문구: ' + rel.slice(5).replace(/\.ts$/, '');
  return '계산 문구: ' + rel.replace(/\.tsx?$/, '');
}

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(f) && !/\.test\.ts$/.test(f) && !/\.d\.ts$/.test(f)) out.push(p);
  }
  return out;
}

const WORDY = /[가-힣]{2,}/;
// 말투가 드러나는 건 문장이다. '아침', '연애' 같은 한 단어 이름표는 뺀다.
const SENTENCE = (t) => WORDY.test(t) && (/\s/.test(t) || /[요다까죠][.?!]?$/.test(t));

const blank = (m) => m.replace(/[^\n]/g, ' ');
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

const rows = [];
for (const file of walk('src')) {
  const rel = relative('src', file).split(sep).join('/');
  if (SKIP.has(rel)) continue;
  const src = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  const lit = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
  let m;
  while ((m = lit.exec(code))) {
    const inner = src.slice(m.index + 1, m.index + m[0].length - 1);
    if (!SENTENCE(inner)) continue;
    // 정규식 조각은 문구가 아니다
    if (/\(\?[:=!]|\\[dsw]|\[\^/.test(inner)) continue;
    rows.push({ rel, line: lineOf(src, m.index), text: inner });
  }
  if (file.endsWith('.tsx')) {
    const noLit = code.replace(lit, blank);
    const jsx = /(?<=[>}])([^<>{}]*[가-힣][^<>{}]*)(?=[<{])/g;
    while ((m = jsx.exec(noLit))) {
      const raw = m[1];
      const text = raw.trim();
      if (!SENTENCE(text) || /[;=()]/.test(text)) continue;
      const at = m.index + raw.indexOf(text);
      rows.push({ rel, line: lineOf(src, at), text });
    }
  }
}

rows.sort((a, b) => (a.rel === b.rel ? a.line - b.line : a.rel < b.rel ? -1 : 1));
rows.forEach((r, i) => (r.no = i + 1));

const csvCell = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const head = ['번호', '영역', '위치', '지금 문구', '고친 문구'];

mkdirSync('release/copy', { recursive: true });
// 파일 하나로 낸다. 받는 사람이 여러 개를 챙기지 않게.
const OUT = 'release/copy/문구표.csv';
const lines = [head.map(csvCell).join(',')];
for (const r of rows) lines.push([r.no, areaOf(r.rel), 'src/' + r.rel + ':' + r.line, r.text, ''].map(csvCell).join(','));
// 엑셀이 한글을 깨지 않게 BOM 을 붙인다
writeFileSync(OUT, '﻿' + lines.join('\r\n') + '\r\n', 'utf8');
console.log('✅ 문장 ' + rows.length + '줄 → ' + OUT);
