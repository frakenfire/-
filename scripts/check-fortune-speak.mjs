// 화면 문구가 '운세 말투' 로 도망가지 못하게 막는다.
//
// 문제는 이랬다. '오늘은 크게 튀지 않고 담담하게 지나가는 기운이에요.'
// 읽고 나면 오늘 무슨 일이 있는지 아무것도 모른다. '기운' 은 무엇이 일어나는지
// 말하지 않고 분위기만 잡는 낱말이고, '흐름' 도 '에너지' 도 '작용' 도 같다.
// 사주를 아는 사람에게만 뜻이 있는 말이거나, 번역체다.
//
// 같은 뜻을 사람이 실제로 쓰는 말로 쓰면 이렇게 된다.
//   '오늘은 특별한 일 없이 평온하게 지나가는 하루예요.'
// 낱말 하나 바꾼 게 아니라, '무슨 일이 있을 것 같은지' 를 적은 것이다.
//
// 왜 화면 점검(audit)만으로는 부족한가: 한 번 뽑은 화면에는 그 사람의 십성·
// 밴드에 걸린 문장만 뜬다. 나머지 수백 개는 안 뜬다. 그래서 소스를 훑는다.
// 주석과 식별자는 뺀다 - 문자열만 화면에 나간다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RULES = [
  ['기운', "무슨 일이 일어나는지로. '좋은 기운이 와요' 가 아니라 '잘 풀릴 것 같아요'"],
  ['에너지', "'힘'·'지치는'·'시간' 처럼 실제로 겪는 말로"],
  ['흐름', "'이번 달'·'요즘'·'잘 되는 일' 처럼 실제 단위나 일로"],
  ['작용', "무엇이 무엇을 어떻게 하는지 동사로"],
  ['담담', "'차분하게'·'특별한 일 없이'"],
  ['평이한', "'무난한'·'큰일 없는'"],
  [/크게 튀|튀진 않|튀지 않/, "'큰일은 없지만'·'특별한 일 없이'"],
  [/강하게 들어(와|오)/, "무엇이 얼마나 되는지로. 세기를 말하지 말고 일을 말한다"],
  [/잔잔한 (하루|날|달|한 달)|잔잔하게 (흘러|지나)/, "'조용한 하루'·'편안하게 지나가는'"],

  // '오후의 한숨 돌리는 시간이에요' 는 '오후의' 가 '시간' 을 꾸미는데 그 사이에
  // '한숨 돌리는' 이 끼어 있다. 읽다가 걸린다. 말을 옮겨 '지금 한숨 돌리는
  // 오후 시간이에요' 로 쓰면 한 번에 읽힌다.
  // 정규식만 쓰면 '내일의 내가 더 잘 정하는 날이에요' 도 걸린다. 그건 멀쩡한
  // 문장이다 - '내일의' 가 '내가' 에 붙고 거기서 문장이 한 번 끊긴다.
  // 가운데에 조사가 있으면 끊긴 것이므로 넘어간다.
  [(t) => {
    const m = t.match(/[가-힣]의\s+([가-힣 ]{1,12}?)(하는|되는|돌리는|쉬는|지나는)\s*(시간|때|날|하루|순간)/);
    if (!m) return false;
    return !/[이가은는을를에도]\s/.test(m[1]);
  }, "'~의' 와 꾸밈 받는 말 사이에 다른 꾸밈말을 끼우지 마세요"],

  // 한국말로 바로 말할 수 있는데 굳이 외래어를 쓴 자리. '컨디션'·'타이밍'·
  // '스트레스'·'팁' 처럼 사람들이 실제로 그 말로 말하는 것은 안 넣는다.
  [/케미|텐션|페이스대로|평소의 페이스|루틴|템포|하이라이트/, "사람들이 실제로 쓰는 우리말로"],
];

// 사람이 평소에 쓰는 말이라 남겨둔 자리. 규칙을 푸는 게 아니라 예외를 적어둔다.
//   '기운이 없어요' 는 고민 화면에서 사용자가 직접 고르는 보기다. 몸이 처졌다는
//   뜻의 일상어지, 운세를 설명하는 말이 아니다.
const ALLOW = ['기운이 없어요'];

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(f) && !/\.test\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

const files = walk('src');
// 화면에 나가는 글자를 한 줄에서 모두 꺼낸다.
//
// 처음에는 따옴표 안만 봤다. 그래서 JSX 로 그냥 적은 글이 통째로 빠졌다.
// 검사는 0곳이라고 했는데 실제 화면 글자를 뽑아 세어보니 '기운' 이 147군데
// 남아 있었다. 명식 카드의 이름표가 전부 JSX 였다. 안 보는 자리가 있으면
// 그 자리로 다시 모인다.
function textsOf(code) {
  const out = [];
  for (const m of code.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)) out.push(m[1] ?? m[2] ?? m[3]);
  const rest = code
    .replace(/'[^']*'|"[^"]*"|`[^`]*`/g, ' ')
    // 코드 안의 정규식은 화면에 안 나간다. /쉬어|미루|루틴/ 같은 목록이 걸렸었다
    .replace(/\/(?:\\.|\[[^\]]*\]|[^/\\\n])+\/[gimsuy]*/g, ' ')
    .replace(/\{[^}]*\}/g, ' ');
  if (/[가-힣]/.test(rest)) out.push(rest.trim());
  return out;
}

const bad = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  stripped.split('\n').forEach((code, i) => {
    for (const t of textsOf(code)) {
      if (!/[가-힣]/.test(t)) continue;
      if (ALLOW.includes(t)) continue;
      for (const [rule, why] of RULES) {
        const hit =
          typeof rule === 'string' ? t.includes(rule)
          : typeof rule === 'function' ? rule(t)
          : rule.test(t);
        if (hit) bad.push(`${file}:${i + 1}  ${t.slice(0, 84)}   ← ${why}`);
      }
    }
  });
}

if (bad.length) {
  console.error(`\n❌ 운세 말투 ${bad.length}곳:\n`);
  for (const b of bad) console.error('  - ' + b);
  console.error("\n  기준: '오늘은 특별한 일 없이 평온하게 지나가는 하루예요.' 만큼 쉬운 말로.\n");
  process.exit(1);
}
console.log(`✅ 운세 말투 없음 (검사 파일 ${files.length}개)`);
