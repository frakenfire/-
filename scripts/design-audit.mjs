#!/usr/bin/env node
// 화면 디자인 감사 — 그려진 DOM 만 본다.
//
// 왜 따로 만드나: 지금까지의 점검은 두 종류였다.
//   (1) 소스 정규식 가드 — 값이 어떻게 만들어졌는지에 따라 새어 나간다.
//       실제로 `${dm.hanja}` 와 myStemHanja 가 두 번 다 빠져나갔다.
//   (2) 클릭 점검(audit.mjs) — 흐름과 동작을 본다. 생김새 규칙은 안 본다.
//
// 그래서 이건 (3) 이다. 모든 화면을 열어 실제로 그려진 글자와 계산된 스타일만
// 훑는다. 소스에 뭐라고 적혀 있든, 어떤 경로로 만들어졌든 상관없다.
//
//   npm run build:web && npm run audit:design

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PORT = Number(process.env.DESIGN_PORT ?? 4174);
const BASE = `http://localhost:${PORT}/`;

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  console.error('❌ playwright-core 가 없어요. npm i -D playwright-core');
  process.exit(1);
}

const results = [];
const check = (cond, name, detail = '') => results.push({ pass: !!cond, name, detail });

// ── 규칙 ────────────────────────────────────────────────────
// TDS 초록·빨강 계열. 이 앱은 파랑/회색/주황만 쓴다.
// 빨강은 '되돌릴 수 없는 삭제' 한 곳만 예외.
const BANNED_COLORS = {
  green: ['3, 178, 108', '2, 118, 72', '21, 196, 126', '2, 162, 98', '2, 147, 89', '2, 132, 80', '63, 213, 153', '118, 228, 184'],
  red: ['240, 68, 82', '228, 41, 57', '210, 32, 48', '188, 27, 42', '165, 25, 38', '246, 101, 112', '251, 136, 144'],
};
const RED_ALLOWED = ['reset-confirm__yes', 'privacy-note__btn--danger'];
// 오행 다섯(목·화·토·금·수)은 UI 장식이 아니라 데이터 범주다. 다섯 칸을 서로
// 구분해야 하므로 한 색으로 못 만든다 — 목(木)의 초록은 여기서만 허용한다.
const GREEN_ALLOWED = ['elbal-row__dot', 'elbal-row__bar', 'pcol__els'];
const HANJA = /[\u{3400}-\u{4DBF}\u{4E00}-\u{9FFF}]/u;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
// 별자리 기호는 활자다(색 없음). 이건 이모지로 치지 않는다.
const STAR_SIGNS = /[\u{2648}-\u{2653}]/u;
// 크기 목록은 손으로 적지 않는다 — 처음에 기억으로 적었다가 19px 을
// 빠뜨려 멀쩡한 화면을 실패로 신고했다. 설치된 패키지에서 직접 읽는다.
const { fixedTypographySizeMap: TDS_MAP } = require('@toss/tds-typography');
const TDS_SIZES = new Set(Object.keys(TDS_MAP).map(Number));

// 페이지 안에서 도는 수집기. 보이는 요소만 훑는다.
function collect() {
  const out = { texts: [], colors: [], weights: [], sizes: [] };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
  };
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const cls = typeof el.className === 'string' ? el.className : '';
    // 자기 자신이 직접 들고 있는 글자만 (부모가 자식 글자를 중복 신고하지 않게)
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .filter(Boolean)
      .join(' ');
    if (own) out.texts.push({ text: own, cls, tag: el.tagName });
    const parentCls = el.parentElement && typeof el.parentElement.className === 'string'
      ? el.parentElement.className : '';
    // 인라인 스타일을 받은 <i> 는 클래스가 없다 — 부모 이름까지 실어 보내야
    // 예외 판단이 된다. (오행 막대의 색점이 여기 걸렸다)
    out.colors.push({ cls: `${cls} ${parentCls}`.trim(), color: cs.color, bg: cs.backgroundColor, border: cs.borderTopColor });
    out.weights.push({ cls, w: Number(cs.fontWeight) });
    out.sizes.push({ cls, size: parseFloat(cs.fontSize), lh: cs.lineHeight });
  }
  // 구조: 섹션 제목이 있는가 (목록이 두 덩어리 이상인 화면에서)
  out.sections = document.querySelectorAll('.sec__title').length;
  out.cardsTopLevel = document.querySelectorAll('.app__body > .card, .app__body > [class$="-card"]').length;
  return out;
}

function auditScreen(name, data) {
  // 1) 한자
  const hanja = data.texts.filter((t) => HANJA.test(t.text));
  check(hanja.length === 0, `[${name}] 한자 없음`, hanja.map((h) => `${h.cls}"${h.text.slice(0, 24)}"`).join(' / '));

  // 2) 이모지 (별자리 기호 제외)
  const emo = data.texts.filter((t) => EMOJI.test(t.text.replace(STAR_SIGNS, '')));
  check(emo.length === 0, `[${name}] 이모지 없음`, emo.map((h) => `${h.cls}"${h.text.slice(0, 24)}"`).join(' / '));

  // 3) 금지 색 (초록 전면 금지 · 빨강은 삭제 버튼만)
  const greens = data.colors.filter((c) =>
    BANNED_COLORS.green.some((g) => c.color.includes(g) || c.bg.includes(g) || c.border.includes(g)) &&
    !GREEN_ALLOWED.some((a) => c.cls.includes(a)));
  check(greens.length === 0, `[${name}] 초록 없음`, greens.map((c) => c.cls).slice(0, 4).join(' / '));

  const reds = data.colors.filter((c) =>
    BANNED_COLORS.red.some((g) => c.color.includes(g) || c.bg.includes(g) || c.border.includes(g)) &&
    !RED_ALLOWED.some((a) => c.cls.includes(a)));
  check(reds.length === 0, `[${name}] 빨강은 삭제 버튼만`, reds.map((c) => c.cls).slice(0, 4).join(' / '));

  // 4) 글자 굵기 700 이하 (토스 번들 실측: 800·900 은 한 번도 안 씀)
  const heavy = data.weights.filter((w) => w.w > 700);
  check(heavy.length === 0, `[${name}] 굵기 700 이하`, heavy.map((w) => `${w.cls}:${w.w}`).slice(0, 4).join(' / '));

  // 5) 글자 크기가 TDS 스케일 위에 있는가
  const offScale = data.sizes.filter((s) => s.size && !TDS_SIZES.has(Math.round(s.size)));
  check(offScale.length === 0, `[${name}] 크기 TDS 스케일`,
    [...new Set(offScale.map((s) => `${s.cls}:${s.size}px`))].slice(0, 4).join(' / '));
}

async function run() {
  const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore',
  });
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    try { if ((await fetch(BASE)).ok) break; } catch { /* 대기 */ }
    await new Promise((r) => setTimeout(r, 300));
  }

  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const w = (ms = 600) => page.waitForTimeout(ms);
  const grab = async (name) => auditScreen(name, await page.evaluate(collect));

  // ── 화면을 하나도 빠뜨리지 않고 전부 훑는다 ──
  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(700);
  await grab('홈(사주 전)');

  await page.getByText('생년월일 입력하기', { exact: false }).first().click(); await w(700);
  await grab('생년월일');
  await page.getByText('태어난 시각을 몰라요', { exact: false }).first().click(); await w(300);
  await page.getByText('내 사주 보기', { exact: false }).first().click(); await w(900);
  await grab('내 사주');

  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(700);
  await grab('홈(사주 후)');

  await page.getByText('쪽지 뽑기 시작하기').first().click(); await w(600);
  await grab('주제 고르기');
  await page.getByText('오늘의 나', { exact: false }).first().click(); await w(600);
  await grab('기분 고르기');
  await page.locator('button', { hasText: '그냥 그래요' }).first().click(); await w(900);
  await grab('쪽지 고르기');

  await page.locator('[class*="note"]').first().click();
  await page.waitForSelector('.drawn', { timeout: 20000 }); await w(1500);
  await grab('결과');

  await page.getByText('요정이 쓴 편지도 읽기', { exact: false }).first().click(); await w(800);
  await grab('결과(요정 편지)');

  await page.getByText('오늘의 심층 리포트 열기', { exact: false }).first().click(); await w(2800);
  await grab('심층 리포트');

  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(700);
  await page.getByText('오늘 우리 궁합', { exact: false }).first().click(); await w(700);
  await grab('궁합(고르기 전)');
  // 사주가 있으면 '나'가 이미 정해져 피커가 안 열려 있다. 슬롯을 눌러 연다.
  const pickOne = async (label) => {
    if ((await page.locator('.zodiac-chip').count()) === 0) {
      await page.locator('.compat-pick').last().click(); await w(500);
    }
    await page.locator('.zodiac-chip', { hasText: label }).first().click(); await w(700);
  };
  await pickOne('개띠');
  await pickOne('범띠');
  await w(900);
  await grab('궁합(짝 고름)');
  const unlock = page.getByText('광고 보고 결과 열기', { exact: false });
  if (await unlock.count()) { await unlock.first().click(); await w(2600); await grab('궁합 결과'); }

  await browser.close();
  srv.kill();

  // ── 보고 ──
  const fails = results.filter((r) => !r.pass);
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
  }
  console.log('───────────────────────────────────');
  console.log(fails.length ? `통과 ${results.length - fails.length} / ${results.length}  ❌ 실패 ${fails.length}` : `통과 ${results.length} / ${results.length}`);
  process.exit(fails.length ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
