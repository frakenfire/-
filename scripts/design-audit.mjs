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
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url).pathname;
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
// 이 앱은 파랑/회색/주황만 쓴다. 빨강은 '되돌릴 수 없는 삭제' 한 곳만 예외.
//
// 전에는 TDS 초록·빨강 값을 손으로 여덟 개씩 적어두고 그 문자열이 있는지 봤다.
// 세어보니 TDS 초록은 아홉, 빨강은 여덟이었다 - 제일 옅은 aeefd5 와 feafb4 가
// 목록에 없어서, 연초록 카드를 깔아도 이 점검은 조용했다. 그리고 애초에 값을
// 적어 막는 방식은 TDS 밖의 초록(런타임에 계산된 색)을 못 잡는다.
// 색이 아니라 색상환의 각도로 본다 - 초록 자리에 있으면 어디서 온 값이든 잡힌다.
const HUE_BANDS = {
  green: (h) => h >= 85 && h <= 170,
  red: (h) => h >= 340 || h <= 12,
};
// 회색·거의 회색은 각도가 의미 없다. 채도가 이만큼은 돼야 '색'으로 친다.
const HUE_MIN_SAT = 0.25;
function hueSat(css) {
  const m = css && css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const n = m[1].split(',').map(parseFloat);
  if (n.length >= 4 && n[3] < 0.05) return null; // 투명한 건 안 보이는 색이다
  const [r, g, b] = n.slice(0, 3).map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d || !mx) return null;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (Math.round(h * 60) + 360) % 360, s: d / mx };
}
// 한 요소가 쓰는 색 셋(글자·배경·테두리) 중 그 각도 안에 드는 것을 돌려준다.
function hitsBand(c, band) {
  const out = [];
  for (const [k, v] of [['글자', c.color], ['바탕', c.bg], ['테두리', c.border]]) {
    const hs = hueSat(v);
    if (hs && hs.s >= HUE_MIN_SAT && band(hs.h)) out.push(`${k} ${v}`);
  }
  return out;
}
// 빨강을 써도 되는 유일한 자리 — 되돌릴 수 없는 삭제.
const RED_ALLOWED = ['btn--danger'];
// 초록은 지금 한 곳도 없다. 오행 다섯 칸을 색으로 나누던 시절의 예외
// 세 개가 오래 남아 있었는데, 셋 다 화면에 없는 이름이었다.
const GREEN_ALLOWED = [];
// 예외 목록이 낡는 걸 막는다. 여기 적힌 이름이 화면 어디에도 없으면, 그 예외는
// 아무것도 안 봐주면서 '봐주고 있다' 는 착각만 남긴다. 실제로 다섯 개 중
// 다섯 개가 전부 죽은 이름이었고, 그 바람에 CSS 도 같이 살아남아 있었다.
{
  const src = readdirSync(join(root, 'src'), { recursive: true })
    .filter((f) => typeof f === 'string' && f.endsWith('.tsx'))
    .map((f) => readFileSync(join(root, 'src', f), 'utf8')).join('\n');
  const stale = [...RED_ALLOWED, ...GREEN_ALLOWED].filter((c) => !src.includes(c));
  if (stale.length) {
    console.error(`❌ 예외 목록에 화면에 없는 이름이 있어요: ${stale.join(', ')}`);
    console.error('   지웠으면 목록에서도 빼고, 이름을 바꿨으면 여기도 바꿔주세요.');
    process.exit(1);
  }
}
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
    // others 가 비면(사방이 똑같이 두꺼우면) every 는 참이다 — 균일한 4px 테두리를
    // '한쪽만 두껍다' 로 신고하게 된다. 지금 그런 요소가 없어서 안 터졌을 뿐이다.
    if (maxW >= 3 && others.length > 0 && others.every((x) => x <= maxW / 3)) {
      out.oneSided.push(`${cls}[${bw.join('/')}]`);
    }
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
  // 나란히 선 버튼이 서로 붙어 있는가 — 여백 0 은 한 덩어리로 읽혀서 누를 곳을 헷갈리게 한다.
  // 목록 줄(휠 항목·이동 행)은 구분선으로 나뉘어 붙어 있는 게 정상이다. 큰 버튼만 본다.
  //
  // 전에는 세로로 쌓인 쌍만 봤다. '가로로 나란한 건 격자라 gap 이 따로 있다' 는
  // 이유였는데, 그건 확인이 아니라 짐작이다. 그리고 이 앱에서 버튼 둘이 나란히
  // 서는 자리는 삭제 확인(가로 격자) 하나뿐이라, 세로만 보는 동안 이 점검은
  // 열다섯 화면 전부에서 볼 것이 한 쌍도 없었다. 두 방향 다 실제로 잰다.
  out.stuck = [];
  out.btnPairs = 0;
  for (const el of document.querySelectorAll('.btn')) {
    const next = el.nextElementSibling;
    if (!next || !next.matches('.btn')) continue;
    const a = el.getBoundingClientRect();
    const b = next.getBoundingClientRect();
    if (a.width < 1 || b.width < 1) continue;
    const stacked = b.top >= a.bottom - 1;
    const sideBySide = b.left >= a.right - 1;
    if (!stacked && !sideBySide) continue; // 겹쳐 있거나 줄이 바뀐 경우는 여기서 볼 것이 아니다
    out.btnPairs += 1;
    const gap = stacked ? b.top - a.bottom : b.left - a.right;
    if (gap < 6) {
      const cls = (typeof el.className === 'string' ? el.className : '').split(' ')[0] || el.tagName;
      out.stuck.push(`${cls}[${stacked ? '세로' : '가로'} ${Math.round(gap)}px]`);
    }
  }
  out.stuck = [...new Set(out.stuck)];

  out.oneSided = [...new Set(out.oneSided)];
  out.tintTiles = [...new Set(out.tintTiles)];
  out.dashed = [...new Set(out.dashed)];
  // 최상위에 떠 있는 면의 수.
  // 토스 홈 탭처럼 회색 바탕 위에 흰 구역 카드를 여러 장 쌓는 건 토스의 기본 문법이라 세지 않는다.
  // 색이 칠해진 면(틴트·브랜드)만 '떠 있는 면'으로 본다. 그게 많으면 눈이 갈 곳이 없어진다.
  const body = document.querySelector('.app__body');
  const isWhiteCard = (e) => {
    const bg = getComputedStyle(e).backgroundColor;
    return bg === 'rgb(255, 255, 255)' && getComputedStyle(e).boxShadow !== 'none';
  };
  out.floatingList = body ? [...body.children].filter((e) => isSurface(e) && !isWhiteCard(e))
    .map((e) => (typeof e.className === 'string' ? e.className : '').split(' ')[0] || e.tagName) : [];
  out.floating = out.floatingList.length;

  // 점수 막대가 바로 옆 숫자와 같은 말을 하는가.
  // 이 앱에는 점수 막대가 세 종류 있다 — 왜 N점인가요, 네 가지 운, 궁합 세 칸.
  // 한때 '왜 N점인가요' 만 50~92 를 0~100 으로 펴서 그렸고, 그 바람에 73점
  // 막대가 트랙의 56% 에서 끝났다. 같은 화면에서 같은 종류의 숫자를 두 가지
  // 자로 재면, 숫자를 읽은 사람과 그림을 본 사람이 다른 결론에 이른다.
  // (오행 막대는 점수가 아니라 다섯 몫의 비율이라 여기 넣지 않는다)
  const BARS = [
    ['.why-score__row', '.why-score__bar', '.why-score__bar i', '.why-score__v'],
    ['.cat4__row', '.cat4__bar', '.cat4__bar i', '.cat4__v'],
    ['.compat-cat', '.compat-cat__bar', '.compat-cat__fill', '.compat-cat__score'],
  ];
  out.barGap = [];
  out.barCount = 0;
  for (const [rowSel, trackSel, fillSel, valSel] of BARS) {
    for (const row of document.querySelectorAll(rowSel)) {
      const track = row.querySelector(trackSel);
      const fill = row.querySelector(fillSel);
      const val = row.querySelector(valSel);
      if (!track || !fill || !val) continue;
      const tw = track.getBoundingClientRect().width;
      if (tw < 1) continue;
      const shown = Math.round((fill.getBoundingClientRect().width / tw) * 100);
      const said = parseInt((val.textContent || '').replace(/[^0-9]/g, ''), 10);
      if (!Number.isFinite(said)) continue;
      out.barCount += 1;
      if (Math.abs(shown - said) > 4) out.barGap.push(`${rowSel} 숫자 ${said} / 막대 ${shown}%`);
    }
  }
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
  const greens = data.colors
    .filter((c) => !GREEN_ALLOWED.some((a) => c.cls.includes(a)))
    .map((c) => [c.cls, hitsBand(c, HUE_BANDS.green)]).filter(([, hit]) => hit.length);
  check(greens.length === 0, `[${name}] 초록 없음`,
    greens.length ? greens.map(([cls, hit]) => `${cls}: ${hit.join(', ')}`).slice(0, 4).join(' / ')
      : `색 ${data.colors.length}개 검사`);

  const reds = data.colors
    .filter((c) => !RED_ALLOWED.some((a) => c.cls.includes(a)))
    .map((c) => [c.cls, hitsBand(c, HUE_BANDS.red)]).filter(([, hit]) => hit.length);
  check(reds.length === 0, `[${name}] 빨강은 삭제 버튼만`,
    reds.length ? reds.map(([cls, hit]) => `${cls}: ${hit.join(', ')}`).slice(0, 4).join(' / ')
      : `색 ${data.colors.length}개 검사`);

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
  check(data.stuck.length === 0, `[${name}] 버튼끼리 붙어 있지 않음`,
    data.stuck.length ? data.stuck.join(' ') : `나란한 버튼 ${data.btnPairs}쌍`);
  // 11) 점수 막대와 바로 옆 숫자가 같은 말을 하는가 (막대가 없는 화면은 0개로 지나간다)
  check(data.barGap.length === 0, `[${name}] 점수 막대가 옆 숫자와 어긋나지 않음`,
    data.barGap.length ? data.barGap.slice(0, 4).join(' / ') : `막대 ${data.barCount}개`);
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

  // 흐름 그대로: 생년월일 → 고민 → 상황 → 쪽지 → 결과
  await page.locator('.today-hook__cta').first().click(); await w(700);
  await grab('생년월일');
  await page.getByText('태어난 시각을 몰라요', { exact: false }).first().click(); await w(300);
  // 이름과 성별 둘 다 계산에 들어가므로 빈 채로는 다음으로 못 넘어간다
  await page.locator('.field__input').first().fill('김한별'); await w(300);
  await page.getByRole('button', { name: '여자' }).first().click(); await w(300);
  await page.getByRole('button', { name: '다음' }).first().click(); await w(900);
  await grab('고민 고르기');
  await page.getByText('일과 이직', { exact: true }).first().click(); await w(700);
  await grab('상황 질문');
  await page.getByText('다니는데 옮기고 싶어요', { exact: true }).first().click(); await w(900);
  await grab('쪽지 고르기');

  await page.locator('button.note').first().dispatchEvent('click');
  await page.waitForSelector('.drawn', { timeout: 20000 }); await w(1500);
  // 접힌 덩이도 규칙을 지켜야 한다. 다 펴놓고 잰다.
  for (const b of await page.locator('.fold__head').all()) { await b.click(); await w(200); }
  await w(600);
  await grab('결과');

  // 나머지 다섯 고민의 결과 화면. 한 고민만 재고 '결과 화면은 규칙을 지킨다'
  // 고 적으면, 나머지 다섯은 여백 리듬도 면 중첩도 한 번도 안 본 채로 통과한다.
  // 레이아웃 점검은 특히 그렇다 - 들어가는 글자가 길어지면 카드가 달라진다.
  const REST = [
    ['돈', '모으고 싶어요'],
    ['연애', '혼자예요'],
    ['사람 관계', '회사 사람이에요'],
    ['몸과 컨디션', '기운이 없어요'],
    ['마음', '불안해요'],
  ];
  for (const [concern, option] of REST) {
    await page.goto(BASE, { waitUntil: 'networkidle' }); await w(600);
    await page.locator('.today-hook__cta').first().click(); await w(700);
    // 이름·성별은 저장돼 있어 이 화면은 그냥 넘긴다
    await page.getByRole('button', { name: '다음' }).first().click(); await w(800);
    await page.getByText(concern, { exact: true }).first().click(); await w(600);
    await page.getByText(option, { exact: true }).first().click(); await w(800);
    await page.locator('button.note').first().dispatchEvent('click');
    await page.waitForSelector('.drawn', { timeout: 20000 }); await w(1500);
    for (const b of await page.locator('.fold__head').all()) { await b.click(); await w(200); }
    await w(500);
    await grab(`결과(${concern})`);
  }

  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(700);
  await grab('홈(사주 후)');

  // 궁합은 결과 화면에서 뺐다. 따로 메뉴로 나갈 자리라 딥링크로 확인한다.
  await page.goto(`${BASE}#/compat`, { waitUntil: 'networkidle' }); await w(1200);
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

  // 삭제 확인 — 이 앱에서 빨강을 쓰는 유일한 자리이자, 버튼 둘이 나란히 서는
  // 유일한 자리다. 그런데 열다섯 화면을 도는 동안 한 번도 안 들렀다. 안 들른
  // 화면은 규칙을 지키는지 아닌지를 아무도 모른다.
  await page.goto(BASE, { waitUntil: 'networkidle' }); await w(600);
  await page.locator('.today-hook__cta').first().click(); await w(800);
  await page.locator('.data-link').first().click(); await w(500);
  await grab('삭제 확인');

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
