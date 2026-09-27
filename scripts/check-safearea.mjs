// 화면 맨 아래가 홈 인디케이터에 가리지 않는가.
//
// 브라우저에서는 이걸 못 잰다. safe-area 인셋이 0 이라 아래 여백이 32px 로
// 보이고 다 멀쩡해 보인다. 기기에서는 그 32px 을 홈 인디케이터가 그대로
// 덮어서 맨 아래 카드가 바에 딱 붙는다. 실제로 그렇게 나갔다.
//
// 그래서 화면 바닥에 닿는 자리는 아래 인셋을 반드시 더해야 한다.
//   --sab  토스 브릿지가 넘겨주는 값 (SDK 의 useSafeAreaInsets 가 bottom 을 준다)
//   env(safe-area-inset-bottom)  브릿지가 없을 때 폴백
// 둘 중 하나만 쓰면 안 된다. env 만 쓰면 토스 WebView 에서 0 이 나오고,
// --sab 만 쓰면 일반 브라우저에서 아무 값이 없다.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/globals.css', import.meta.url), 'utf8');
const toss = readFileSync(new URL('../src/lib/toss.ts', import.meta.url), 'utf8');

const fail = [];

// 1) 브릿지가 하단 인셋을 CSS 변수로 넘기는가
if (!/--sab['"`]?,\s*`\$\{insets\.bottom\}px`/.test(toss) && !toss.includes("setProperty('--sab'")) {
  fail.push("toss.ts 가 --sab 를 안 넘겨요. 넘기지 않으면 토스 WebView 에서 아래 인셋이 0 이에요");
}
if (!/insets\.bottom/.test(toss)) {
  fail.push('toss.ts 가 insets.bottom 을 안 읽어요');
}

// 2) 바닥에 닿는 자리가 인셋을 더하는가
const BOTTOM_RULES = ['.app__body', '.app__bottom'];
for (const sel of BOTTOM_RULES) {
  const m = new RegExp(`\\n${sel.replace('.', '\\.')}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(css);
  if (!m) {
    fail.push(`${sel} 규칙을 못 찾았어요`);
    continue;
  }
  const body = m[1];
  const padLine = /padding(-bottom)?:[\s\S]*?;/.exec(body);
  if (!padLine) {
    fail.push(`${sel} 에 아래 여백이 없어요`);
    continue;
  }
  const pad = padLine[0];
  if (!pad.includes('--sab')) {
    fail.push(`${sel} 의 아래 여백이 --sab 를 안 더해요 — 기기에서 홈 인디케이터가 덮어요`);
  }
  if (!pad.includes('env(safe-area-inset-bottom')) {
    fail.push(`${sel} 의 아래 여백에 env(safe-area-inset-bottom) 폴백이 없어요`);
  }
}

// 3) env 를 맨몸으로 쓰는 자리가 남아 있는가 (--sab 를 안 거치면 브릿지 값이 죽는다)
const noComments = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
for (const line of noComments.split('\n')) {
  if (!line.includes('env(safe-area-inset-bottom')) continue;
  if (line.includes('--sab')) continue;
  fail.push(`env(safe-area-inset-bottom) 을 맨몸으로 써요 — var(--sab, env(...)) 로 감싸세요: ${line.trim()}`);
}

if (fail.length) {
  console.error('\n❌ 화면 맨 아래가 홈 인디케이터에 가릴 수 있어요\n');
  for (const f of fail) console.error('   ' + f);
  console.error('');
  process.exit(1);
}
console.log(`✅ 바닥에 닿는 자리가 하단 인셋을 더함 (${BOTTOM_RULES.join(', ')})`);
