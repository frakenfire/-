#!/usr/bin/env node
// 화면이 정말 안 바뀌었는지 눈 대신 브라우저에게 묻는다.
//
// 왜: CSS 를 지우거나 합칠 때 '괜찮겠지' 는 증거가 아니다. 죽은 선언 125개를
// 지울 때 이 방식으로 확인했다 - 화면 여러 상태에서 보이는 요소 전부의 계산된
// 스타일을 지우기 전후로 찍어 비교했고, 차이가 0줄이었다.
// 그때는 매번 손으로 스크립트를 다시 썼다. 여기 굳혀둔다.
//
// 재는 것: 요소마다 계산된 스타일 서른넷과 제가 직접 들고 있는 글자.
// 못 보는 것: 화면에 안 나오는 상태(여기 순회에 없는 화면), 애니메이션 중간 프레임,
//            이미지 픽셀. 순회에 없는 화면은 영영 안 보이므로 화면을 늘리면 여기도 늘린다.
//
//   npm run build:web
//   npm run check:visual -- --save before.snap     # 고치기 전
//   ...CSS 를 고친다...
//   npm run build:web
//   npm run check:visual -- --save after.snap
//   npm run check:visual -- --diff before.snap after.snap
//
// 한 번에:
//   npm run check:visual -- --twice     # 같은 빌드를 두 번 찍어 흔들리는지 본다
//
// 흔들림부터 확인하는 이유: 스냅샷 자체가 매번 다르면 diff 0줄도 믿을 게 못 된다.
// 이 앱은 날짜 seed 로 문구를 고르고 FAQ 가 돌아가므로, 글자 길이를 타는 값
// (width/height/transform)은 처음부터 비교에서 뺀다.

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright-core')); } catch {
  console.error('❌ playwright-core 가 없어요.  npm i -D playwright-core');
  process.exit(1);
}

const PORT = Number(process.env.VISUAL_PORT ?? 4491);
const BASE = `http://localhost:${PORT}/`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 재는 것. 시계를 묶어 글자가 고정되므로 크기까지 잰다 - 여백이 어긋나는 건
// 대부분 크기로 먼저 드러난다. transform 만 뺀다(애니메이션 중이면 프레임마다
// 행렬이 달라서, 그건 바뀐 게 아니라 찍은 순간이 다른 것이다).
const PROPS = [
  'width', 'height',
  'display', 'position', 'margin', 'padding', 'border', 'borderRadius', 'background',
  'backgroundColor', 'backgroundImage', 'boxShadow', 'color', 'fontSize', 'lineHeight',
  'fontWeight', 'letterSpacing', 'textAlign', 'flex', 'flexDirection', 'justifyContent',
  'alignItems', 'gap', 'gridTemplateColumns', 'opacity', 'transition', 'animation',
  'zIndex', 'overflow', 'whiteSpace', 'wordBreak', 'aspectRatio', 'maxWidth', 'minHeight',
];

function startPreview() {
  return spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore',
  });
}

// 이 앱은 켤 때마다 spin = hashSeed(String(Date.now())) 으로 문구를 새로 고른다.
// 인사말도, 쪽지 고르기 제목도, FAQ 첫 장도 그 숫자에서 나온다. 시계를 안 묶으면
// 같은 빌드를 두 번 찍어도 글자가 달라지고, 그러면 diff 0줄이 나올 수가 없다.
// 시계를 한 시각에 묶어 화면을 되풀이 가능하게 만든다. setTimeout 은 실제 타이머를
// 쓰므로 흐름(쪽지 뽑기 -> 결과)은 그대로 돈다.
const FROZEN = Date.UTC(2026, 8, 20, 3, 0, 0); // 2026-09-20 12:00 KST
const FREEZE = `(() => {
  const R = Date;
  const T = ${FROZEN};
  function F(...a) { return a.length === 0 ? new R(T) : new R(...a); }
  F.prototype = R.prototype;
  F.now = () => T;
  F.parse = R.parse;
  F.UTC = R.UTC;
  window.Date = F;
})()`;

async function snapshot() {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.addInitScript(FREEZE);
  const w = (ms = 600) => page.waitForTimeout(ms);
  const lines = [];
  const take = async (tag) => {
    const rows = await page.evaluate((props) => {
      const out = [];
      let i = 0;
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        const cs = getComputedStyle(el);
        const cn = typeof el.className === 'string' ? el.className : '';
        // 제가 직접 들고 있는 글자도 같이 적는다. 계산된 스타일만 보면 글자가
        // 바뀌어도 상자가 그대로인 경우를 못 잡는다 - 실제로 오행 줄 앞의
        // 군더더기 공백 한 칸을 이 스냅샷이 처음엔 못 봤다.
        const own = [...el.childNodes].filter((n) => n.nodeType === 3)
          .map((n) => n.textContent).join('').replace(/\s+/g, ' ');
        out.push(`${el.tagName}.${cn}|${i++}|글자=${JSON.stringify(own)};`
          + props.map((p) => `${p}=${cs[p]}`).join(';'));
      }
      return out;
    }, PROPS);
    for (const r of rows) lines.push(`${tag}\t${r}`);
  };

  // 흐름 그대로 훑는다. 화면을 하나 빼면 그 화면은 영영 안 보게 된다.
  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(800);
  await take('홈');
  await w(300);
  await take('홈펼침');
  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(600);
  await page.locator('.today-hook__cta').first().click(); await w(800);
  await take('생년월일');
  await page.getByText('태어난 시각을 몰라요', { exact: false }).first().click(); await w(400);
  await page.locator('.field__input').first().fill('김한별'); await w(300);
  await page.getByRole('button', { name: '여자' }).first().click(); await w(300);
  await take('생년월일채움');
  await page.getByRole('button', { name: '다음' }).first().click(); await w(900);
  await take('고민');
  await page.getByText('일과 이직', { exact: true }).first().click(); await w(700);
  await take('상황');
  await page.getByText('다니는데 옮기고 싶어요', { exact: true }).first().click(); await w(900);
  await take('쪽지고르기');
  await page.locator('button.note').first().dispatchEvent('click');
  await page.waitForSelector('.drawn', { timeout: 20000 }); await w(1800);
  await take('결과');
  await w(300);
  await w(600);
  await take('결과펼침');
  await page.goto(`${BASE}#/compat`, { waitUntil: 'networkidle' }); await w(1200);
  await take('궁합');
  // 궁합은 짝을 골라야 결과가 나온다. 고르기 전 화면만 찍으면 '속 기운' 줄도
  // 점수 막대도 한 번도 안 보게 된다 - 실제로 그 줄의 군더더기 공백 한 칸을
  // 이 스냅샷이 못 잡았다.
  const pickOne = async (label) => {
    if ((await page.locator('.zodiac-chip').count()) === 0) {
      await page.locator('.compat-pick').last().click(); await w(500);
    }
    await page.locator('.zodiac-chip', { hasText: label }).first().click(); await w(700);
  };
  await pickOne('개띠');
  await pickOne('범띠');
  await w(900);
  await take('궁합짝고름');
  const unlock = page.getByText('광고 보고 결과 열기', { exact: false });
  if (await unlock.count()) { await unlock.first().click(); await w(2600); await take('궁합결과'); }
  // 지우기 확인 - 이 앱에서 빨강을 쓰는 유일한 자리다
  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(600);
  await page.locator('.today-hook__cta').first().click(); await w(900);
  await page.locator('.data-link').first().click(); await w(500);
  await take('삭제확인');
  await browser.close();
  return lines;
}

function parse(text) {
  const map = new Map();
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const [tag, rest] = line.split('\t');
    const [who, idx, styles] = rest.split('|');
    map.set(`${tag}|${idx}`, { tag, who, styles });
  }
  return map;
}

function report(beforeText, afterText) {
  const a = parse(beforeText);
  const b = parse(afterText);
  const changes = [];
  for (const [key, before] of a) {
    const after = b.get(key);
    if (!after) { changes.push({ key, tag: before.tag, who: before.who, kind: '사라짐' }); continue; }
    if (before.who !== after.who) {
      changes.push({ key, tag: before.tag, who: `${before.who} → ${after.who}`, kind: '이름 바뀜' });
    }
    const kv = (t) => Object.fromEntries(t.split(';').filter(Boolean).map((s) => {
      const i = s.indexOf('=');
      return [s.slice(0, i), s.slice(i + 1)];
    }));
    const bs = kv(before.styles);
    const as = kv(after.styles);
    for (const p of Object.keys(bs)) {
      if (bs[p] !== as[p]) changes.push({ key, tag: before.tag, who: before.who, kind: p, from: bs[p], to: as[p] });
    }
  }
  for (const key of b.keys()) if (!a.has(key)) changes.push({ key, tag: b.get(key).tag, who: b.get(key).who, kind: '새로 생김' });
  return changes;
}

function printReport(changes, aLen, bLen) {
  if (!changes.length) {
    console.log(`✅ 달라진 것 없음 (요소 ${aLen}개 ↔ ${bLen}개)`);
    return 0;
  }
  const byKind = new Map();
  for (const c of changes) byKind.set(c.kind, (byKind.get(c.kind) ?? 0) + 1);
  console.log(`\n달라진 곳 ${changes.length}군데 (요소 ${aLen}개 ↔ ${bLen}개)\n`);
  console.log('  ' + [...byKind.entries()].map(([k, v]) => `${k} ${v}`).join(' · ') + '\n');
  for (const c of changes.slice(0, 40)) {
    console.log(`  [${c.tag}] ${c.who}`);
    console.log(`     ${c.kind}${c.from !== undefined ? `: ${c.from}  →  ${c.to}` : ''}`);
  }
  if (changes.length > 40) console.log(`  … 그리고 ${changes.length - 40}군데 더`);
  return changes.length;
}

// ── 실행 ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const mode = args[0];

if (mode === '--diff') {
  const [, f1, f2] = args;
  if (!f1 || !f2 || !existsSync(f1) || !existsSync(f2)) {
    console.error('❌ 쓰임새: --diff <앞 파일> <뒤 파일>');
    process.exit(1);
  }
  const t1 = readFileSync(f1, 'utf8'), t2 = readFileSync(f2, 'utf8');
  const n = printReport(report(t1, t2), t1.split('\n').length, t2.split('\n').length);
  process.exit(n ? 1 : 0);
}

const srv = startPreview();
const t0 = Date.now();
while (Date.now() - t0 < 20000) {
  try { if ((await fetch(BASE)).ok) break; } catch { /* 대기 */ }
  await wait(300);
}

try {
  if (mode === '--twice') {
    // 스냅샷 자체가 흔들리면 diff 0줄도 믿을 게 못 된다. 먼저 이것부터 본다.
    const one = (await snapshot()).join('\n');
    const two = (await snapshot()).join('\n');
    const n = printReport(report(one, two), one.split('\n').length, two.split('\n').length);
    if (n) {
      console.error('\n❌ 같은 빌드를 두 번 찍었는데 달라졌어요. 이 상태로는 diff 를 믿을 수 없어요.\n');
      process.exit(1);
    }
    console.log('   같은 빌드를 두 번 찍어도 같아요 — diff 를 믿어도 됩니다.');
  } else if (mode === '--save') {
    const out = args[1];
    if (!out) { console.error('❌ 쓰임새: --save <파일>'); process.exit(1); }
    const lines = await snapshot();
    writeFileSync(out, lines.join('\n'));
    const states = new Set(lines.map((l) => l.split('\t')[0]));
    console.log(`✅ ${out} — 화면 ${states.size}가지 상태, 요소 ${lines.length}개`);
  } else {
    console.error(`쓰임새:
  --save <파일>              지금 빌드를 찍어 파일로 남긴다
  --diff <앞> <뒤>           두 파일을 견줘 달라진 곳을 적는다
  --twice                    같은 빌드를 두 번 찍어 흔들리는지 본다`);
    process.exit(1);
  }
} finally {
  srv.kill();
}
