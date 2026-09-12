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
// 어른도 사전 없이는 모르는 명리 용어. 화면에 그대로 나오면 아이 눈높이가 아니다.
// 뜻을 풀어 쓴 말(찰떡 사이, 규칙 기운, 오늘 점수)로만 말한다.
const JARGON = /일진|십신|신강|신약|용신|오행|비화|삼합|육합|상충|상형|원진|자형|상파|상생|상극|총운|중길|대길|소길|개운 (컬러|색)|비견|겁재|식신|편재|정재|편관|정관|편인|정인|천간|사주팔자|입춘/;
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
  // ── 'AI 가 만든 티' 로 흔히 꼽히는 모양들 ──
  // '면'은 내용을 담는 블록만 센다. 알약(완전 라운드)·버튼·작은 칩은 물건이지
  // 카드가 아니다 — 처음엔 이것들까지 세느라 멀쩡한 화면을 실패로 신고했다.
  const isSurface = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 80 || r.height < 56) return false;
    if (el.tagName === 'BUTTON' && !el.className.includes('card')) return false;
    const rad = parseFloat(cs.borderRadius) || 0;
    if (rad >= r.height / 2) return false; // 알약
    const bg = cs.backgroundColor;
    return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && rad >= 6;
  };
  out.oneSided = [];   // 한쪽만 두꺼운 색 테두리
  out.tintTiles = [];  // 아이콘을 담은 틴트 사각형
  out.dashed = [];     // 점선 테두리
  out.depth = 0;
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    const cls = (typeof el.className === 'string' ? el.className : '').split(' ')[0];
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => parseFloat(cs['border' + k + 'Width']) || 0);
    // 사방 1px 위에 한쪽만 4px 를 얹은 경우가 실제로 있었다 — '두꺼운 변이 있는지'가
    // 아니라 '한 변이 나머지보다 유독 두꺼운지'를 봐야 잡힌다.
    const maxW = Math.max(...bw);
    const others = bw.filter((x) => x !== maxW);
    if (maxW >= 3 && others.every((x) => x <= maxW / 3)) out.oneSided.push(`${cls}[${bw.join('/')}]`);
    if (['Top', 'Right', 'Bottom', 'Left'].some((k) => cs['border' + k + 'Style'] === 'dashed')) out.dashed.push(cls);
    const r = el.getBoundingClientRect();
    const rad = parseFloat(cs.borderRadius) || 0;
    if (Math.abs(r.width - r.height) < 6 && r.width >= 28 && r.width <= 56 && rad >= 6 && rad < r.width / 2
        && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && el.querySelector(':scope > svg')) out.tintTiles.push(cls);
    if (isSurface(el)) {
      let d = 0, cur = el;
      while (cur && cur !== document.body) { if (isSurface(cur)) d++; cur = cur.parentElement; }
      if (d > out.depth) out.depth = d;
    }
  }
  out.oneSided = [...new Set(out.oneSided)];
  out.tintTiles = [...new Set(out.tintTiles)];
  out.dashed = [...new Set(out.dashed)];
  // 최상위에 떠 있는 면의 수
  const body = document.querySelector('.app__body');
  out.floatingList = body ? [...body.children].filter(isSurface)
    .map((e) => (typeof e.className === 'string' ? e.className : '').split(' ')[0] || e.tagName) : [];
  out.floating = out.floatingList.length;
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

  // 4.5) 명리 용어가 화면에 그대로 나오지 않는가
  const jargon = data.texts.filter((t) => JARGON.test(t.text));
  check(jargon.length === 0, `[${name}] 명리 용어 없음`, jargon.map((t) => t.text.match(JARGON)?.[0] + ':' + t.text.slice(0, 24)).slice(0, 4).join(' / '));

  // 5) 글자 크기가 TDS 스케일 위에 있는가
  const offScale = data.sizes.filter((s) => s.size && !TDS_SIZES.has(Math.round(s.size)));
  check(offScale.length === 0, `[${name}] 크기 TDS 스케일`,
    [...new Set(offScale.map((s) => `${s.cls}:${s.size}px`))].slice(0, 4).join(' / '));

  // ── 아래 넷은 'AI 가 만든 화면' 의 표시로 흔히 꼽히는 모양들이다 ──
  // 6) 한쪽만 두꺼운 색 테두리 — 가장 알아보기 쉬운 표시
  check(data.oneSided.length === 0, `[${name}] 한쪽 두꺼운 테두리 없음`, data.oneSided.slice(0, 3).join(' / '));
  // 7) 아이콘을 비슷한 색조의 작은 상자에 담기
  check(data.tintTiles.length === 0, `[${name}] 아이콘 틴트 상자 없음`, data.tintTiles.slice(0, 3).join(' / '));
  // 8) 점선 테두리 — 목업 광고 자리만 예외
  const dashed = data.dashed.filter((c) => c && !c.includes('ad-banner'));
  check(dashed.length === 0, `[${name}] 점선 테두리 없음`, dashed.slice(0, 3).join(' / '));
  // 9) 면 중첩 — 카드 안의 카드 안의 카드
  check(data.depth <= 2, `[${name}] 면 중첩 2겹 이하`, `${data.depth}겹`);
  // 10) 떠 있는 면이 세 장을 넘으면 '카드 더미' 로 읽힌다
  check(data.floating <= 3, `[${name}] 떠 있는 면 3장 이하`, `${data.floating}장: ${data.floatingList.join(' ')}`);
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
  // DESIGN_SHOTS=디렉터리 를 주면 화면마다 전체 스크린샷도 남긴다(눈으로 훑는 용도).
  const shotsDir = process.env.DESIGN_SHOTS;
  let shotNo = 0;
  const grab = async (name) => {
    if (shotsDir) {
      shotNo += 1;
      const file = `${shotsDir}/${String(shotNo).padStart(2, '0')}_${name.replace(/[^가-힣a-z0-9]+/gi, '_')}.png`;
      await page.screenshot({ path: file, fullPage: true });
    }
    // DESIGN_TEXT=디렉터리 를 주면 화면에 실제로 그려진 글자를 파일로 남긴다(말 난이도 점검용).
    if (process.env.DESIGN_TEXT) {
      const { writeFileSync } = await import('node:fs');
      const txt = await page.evaluate(() => document.querySelector('.app')?.innerText ?? '');
      writeFileSync(`${process.env.DESIGN_TEXT}/${String(shotNo || 0).padStart(2, '0')}_${name.replace(/[^가-힣a-z0-9]+/gi, '_')}.txt`, txt);
    }
    auditScreen(name, await page.evaluate(collect));
  };

  // ── 화면을 하나도 빠뜨리지 않고 전부 훑는다 ──
  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(700);
  await grab('홈(사주 전)');

  await page.getByText('오늘 쪽지 열어보기').first().click(); await w(700);
  await grab('생년월일');
  await page.getByText('태어난 시각을 몰라요', { exact: false }).first().click(); await w(300);
  await page.getByText('이 사주로 쪽지 열기', { exact: false }).first().click(); await w(900);
  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(700);
  await page.locator('.saju-entry--done').first().click(); await w(900);
  await grab('내 사주');

  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(700);
  await grab('홈(사주 후)');

  await page.getByText('오늘 쪽지 열어보기').first().click(); await w(900);
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
