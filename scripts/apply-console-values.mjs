#!/usr/bin/env node
// 콘솔에서 발급받은 값을 코드에 안전하게 적용한다.
// 파일을 직접 열어 고칠 필요 없이 한 번에 끝내기 위한 스크립트.
//
//   node scripts/apply-console-values.mjs \
//     --app-name=todaynote-ab12 \
//     --icon=https://static.toss.im/appsintoss/xxxx.png \
//     --ad-group=abcd-1234
//
// 광고 그룹을 지면별로 따로 받았다면:
//   --ad-detail=... --ad-save=... --ad-retry=... --ad-compat=...
// (--ad-group 하나만 주면 네 지면에 모두 같은 값을 넣는다)

import { readFileSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([\w-]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  }),
);

const errors = [];
const done = [];

function edit(file, replacements) {
  const url = new URL(`../${file}`, import.meta.url);
  let text;
  try {
    text = readFileSync(url, 'utf8');
  } catch {
    errors.push(`${file} 을 읽을 수 없어요`);
    return;
  }
  let changed = false;
  for (const [find, replace, label] of replacements) {
    if (!text.includes(find)) {
      // 이미 바꿔둔 경우는 오류가 아니다
      continue;
    }
    text = text.replace(find, replace);
    changed = true;
    done.push(`${file}: ${label}`);
  }
  if (changed) writeFileSync(url, text);
}

// 1) appName
if (args['app-name']) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(args['app-name'])) {
    errors.push(`app-name 형식이 이상해요: "${args['app-name']}" (영문 소문자·숫자·하이픈)`);
  } else {
    edit('granite.config.ts', [
      [`appName: 'today-note'`, `appName: '${args['app-name']}'`, `appName → ${args['app-name']}`],
    ]);
  }
}

// 2) 아이콘 URL
if (args.icon) {
  if (!/^https:\/\//.test(args.icon)) {
    errors.push(`icon 은 https:// 로 시작해야 해요: "${args.icon}"`);
  } else {
    edit('granite.config.ts', [
      [
        `icon: 'https://static.toss.im/appsintoss/placeholder-today-note.png'`,
        `icon: '${args.icon}'`,
        `아이콘 → ${args.icon}`,
      ],
    ]);
  }
}

// 3) 광고 그룹 (지면별 또는 공통)
const ads = {
  REPLACE_REWARD_DETAIL: args['ad-detail'] ?? args['ad-group'],
  REPLACE_REWARD_SAVE: args['ad-save'] ?? args['ad-group'],
  REPLACE_REWARD_RETRY: args['ad-retry'] ?? args['ad-group'],
  REPLACE_REWARD_COMPAT: args['ad-compat'] ?? args['ad-group'],
};
const adEdits = Object.entries(ads)
  .filter(([, v]) => typeof v === 'string' && v.length > 0)
  .map(([k, v]) => [`'${k}'`, `'${v}'`, `${k} → ${v}`]);
if (adEdits.length) edit('src/lib/ads.ts', adEdits);

// ── 결과 ──
if (done.length === 0 && errors.length === 0) {
  console.log(`
사용법:
  node scripts/apply-console-values.mjs \\
    --app-name=콘솔앱ID \\
    --icon=https://static.toss.im/appsintoss/...png \\
    --ad-group=광고그룹ID

지면별로 다른 광고 그룹을 쓰려면 --ad-group 대신:
  --ad-detail=... --ad-save=... --ad-retry=... --ad-compat=...
`);
  process.exit(0);
}

if (done.length) {
  console.log('\n✅ 적용했어요:');
  for (const d of done) console.log(`  - ${d}`);
}
if (errors.length) {
  console.error('\n❌ 문제:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\n다음: npm run check:release 로 확인하세요.\n');
