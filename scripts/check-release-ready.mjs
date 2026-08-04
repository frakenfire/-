// 출시 준비 가드 — 콘솔 연동 placeholder 나 개발용 값이 남아 있으면 실패한다.
// 검토 요청(ait deploy) 전에 `npm run check:release` 로 확인한다.
import { readFileSync } from 'node:fs';

const problems = [];

function check(file, pattern, message) {
  let text = '';
  try {
    text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  } catch {
    problems.push(`${file} 를 읽을 수 없어요`);
    return;
  }
  if (pattern.test(text)) problems.push(`${file}: ${message}`);
}

// P0-05: granite.config 의 콘솔 연동값이 placeholder 면 안 됨
check('granite.config.ts', /placeholder-today-note/, '아이콘이 아직 placeholder 예요 (콘솔 업로드 URL 로 교체)');
check('granite.config.ts', /appName:\s*'today-note'/, 'appName 이 임시값이에요 (콘솔 발급 앱 ID 로 교체)');

// P0-01/05: 광고 그룹 ID 가 아직 REPLACE_ 접두사면 실광고가 안 열림.
// 주의: 파일 전체에서 'REPLACE_' 를 찾으면 안 된다. ads.ts 에는 런타임 안전장치
// (adGroupId.startsWith('REPLACE_')) 와 설명 주석에도 같은 문자열이 있어서,
// 값을 전부 채워도 영원히 통과 못 하는 거짓 실패가 난다.
// AD_GROUPS 객체 안의 '값' 만 본다.
check(
  'src/lib/ads.ts',
  /AD_GROUPS\s*=\s*\{[^}]*:\s*'REPLACE_/,
  'adGroupId 가 아직 REPLACE_ placeholder 예요 (콘솔 발급 adGroupId 로 교체)',
);

if (problems.length > 0) {
  console.error('\n❌ 출시 준비 미완료 — 아래 항목을 먼저 교체하세요:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\n(개발/테스트 빌드에는 문제 없어요. 콘솔 등록값을 채운 뒤 다시 확인하세요.)\n');
  process.exit(1);
}

console.log('✅ 출시 준비 완료 — placeholder 없음, 콘솔 연동값 설정됨');
