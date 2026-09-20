// granite.config.ts 를 설치된 SDK 타입과 대조한다.
//
// 왜 타입체크만으로는 부족한가: tsc 는 '있는 키가 맞는 타입인가' 만 본다.
// 기본값에 기대어 안 적은 값, 또는 SDK 가 deprecated 로 표시한 값을 쓰는 것은
// 통과한다. 이 앱이 실제로 걸린 것도 그런 것이었다 - 당겨서 새로고침이
// 기본으로 켜져 있는데 이 앱 화면은 새로고침을 못 견딘다.
//
// SDK 를 올릴 때 이 검사가 같이 깨지는 것이 목적이다. 문서가 아니라
// node_modules 안의 타입을 읽는다.
import { readFileSync, existsSync } from 'node:fs';

const CONFIG = 'granite.config.ts';
const TYPES = 'node_modules/@apps-in-toss/web-framework/dist/config/index.d.ts';

if (!existsSync(TYPES)) {
  console.error(`\n❌ SDK 타입(${TYPES})을 못 찾았습니다. 설치가 안 됐거나 경로가 바뀌었습니다.\n`);
  process.exit(1);
}
const types = readFileSync(TYPES, 'utf8');
const cfg = readFileSync(CONFIG, 'utf8');
// 주석 안의 값은 설정이 아니다
const code = cfg.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

const bad = [];

// 1) webViewProps.type 은 'partner' 만 살아 있다. 나머지는 SDK 가 deprecated 로 적었다.
const typeUsed = (code.match(/type:\s*'(\w+)'/) || [])[1];
if (typeUsed !== 'partner') bad.push(`webViewProps.type 이 '${typeUsed}' 입니다. SDK 는 'partner' 만 남겨뒀습니다`);
if (!/@deprecated[\s\S]{0,80}'external'/.test(types)) {
  bad.push("SDK 가 더 이상 'external' 을 deprecated 로 적지 않습니다. 타입이 바뀌었으니 이 검사를 다시 보세요");
}

// 2) 당겨서 새로고침. 이 앱의 화면은 새로고침을 못 견딘다(결과가 사라지고 홈으로 간다).
if (!/pullToRefreshEnabled:\s*false/.test(code)) {
  bad.push('pullToRefreshEnabled 를 false 로 적어두세요. 결과 화면에서 당기면 답이 날아갑니다');
}
if (!/pullToRefreshEnabled\?:/.test(types)) {
  bad.push('SDK 에 pullToRefreshEnabled 가 없어졌습니다. 이 검사를 다시 보세요');
}

// 3) 쓰지 않는 네이티브 권한을 적어두면 심사에서 이유를 물어본다.
const perms = (code.match(/permissions:\s*\[([^\]]*)\]/) || [])[1];
if (perms === undefined) bad.push('permissions 가 없습니다. SDK 가 필수로 요구합니다');
else if (perms.trim() !== '') bad.push(`permissions 에 ${perms.trim()} 이 적혀 있습니다. 실제로 쓰는 것만 남기세요`);

// 4) 빌드 산출물 경로가 실제 빌드와 맞아야 한다.
if (!/outdir:\s*'dist'/.test(code)) bad.push("outdir 이 'dist' 가 아닙니다. vite 산출물과 맞춰야 합니다");

if (bad.length) {
  console.error(`\n❌ granite.config.ts 와 SDK 가 어긋난 곳 ${bad.length}곳:\n`);
  for (const b of bad) console.error('  - ' + b);
  console.error('');
  process.exit(1);
}
console.log('✅ granite.config.ts 가 설치된 SDK 와 맞음');
