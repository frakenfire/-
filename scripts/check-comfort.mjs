// 화면 문구가 '빈 위로' 로 도망가지 못하게 막는다.
//
// 홈 인사가 '저녁엔 좀 느슨해져도 돼요' 였다. 결과는 '애쓰지 않아도 돼요',
// '딱 하나만 끝내도 충분해요', '무리하지 마세요' 로 채워져 있었다.
// 누구에게나, 어떤 날에나 붙는 말이다. 아무것도 알려주지 않으면서
// 다독이는 척만 한다. 형님이 '말도 안 되는 말투' 라고 한 게 이거다.
//
// 사람들이 이 앱을 여는 건 내 고민에 오늘 뭘 하면 되는지를 듣기 위해서다.
// 그러니 허락하고 다독이는 대신, 할 일 하나를 구체적으로 말한다.
//   '저녁엔 좀 느슨해져도 돼요'        → '내일 할 일, 지금 하나 정해둘까요?'
//   '딱 하나만 끝내도 충분해요'         → '오늘은 마감이 제일 가까운 일 하나만 끝내요'
//   '무리하지 말고 일찍 하루를 정리해요' → '밤 10시 전에 휴대폰을 내려놔요'
//
// 왜 화면 점검(audit)만으로는 부족한가: 한 번 뽑은 화면에는 그 사람에게
// 걸린 문장만 나온다. 나머지 수백 개는 안 뜬다. 그래서 소스를 직접 훑는다.
// 주석은 뺀다 - 이 규칙을 설명하는 주석에도 그 말이 나온다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const BANNED = [
  [/(아|어|여|해|와|봐|가|줘|워|려)도 (괜찮아요|돼요|된대요)/, '허락하는 말. 오늘 할 일을 구체적으로'],
  [/(않|안 )아도 (괜찮아요|돼요)/, '허락하는 말. 오늘 할 일을 구체적으로'],
  [/충분해요/, "'이걸로 됐다' 는 다독임. 무엇을 하면 되는지로"],
  [/애쓰|애썼|수고했|수고하셨/, '수고 치하. 앱이 그 사람 하루를 본 적이 없다'],
  [/무리하지|무리 말|무리는 금물/, '아무 날에나 붙는 말. 무엇을 줄일지 콕 집어서'],
  [/느슨/, '분위기만 있는 말. 할 일로'],
  [/나를 챙|스스로를 챙|챙길 시간/, '자기돌봄 상투구. 무엇을 할지로'],
  [/쉬어가도|쉬어 가도/, '허락하는 말. 언제 무엇을 쉴지로'],
  [/편안한 (하루|저녁|밤|시간) 보내/, '인사말 상투구'],
  [/잘하고 있어요|응원해요|토닥/, '근거 없는 칭찬·응원'],
];

// 친구가 친구에게 보내는 한마디는 앱의 말투가 아니라 보내는 사람의 말이다.
// 거기까지 막으면 선물이 딱딱해진다.
const ALLOW_FILES = new Set([['src', 'data', 'gifts.ts'].join(sep)]);

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(f) && !/\.test\.ts$/.test(f)) out.push(p);
  }
  return out;
}

const files = walk('src').filter((f) => !ALLOW_FILES.has(f));
const bad = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  // 주석을 같은 길이의 공백으로 바꿔 줄·칸 번호를 지킨다
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  const lines = src.split('\n');
  stripped.split('\n').forEach((code, i) => {
    for (const [re, why] of BANNED) {
      if (re.test(code)) {
        bad.push(`${file}:${i + 1}  ${lines[i].trim().slice(0, 90)}   ← ${why}`);
        break;
      }
    }
  });
}

if (bad.length) {
  console.error(`\n❌ 빈 위로 말투 ${bad.length}곳:\n`);
  for (const b of bad) console.error('  - ' + b);
  console.error('');
  process.exit(1);
}
console.log('✅ 빈 위로 말투 없음 (검사 파일 ' + files.length + '개)');
