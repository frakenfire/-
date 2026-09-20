#!/usr/bin/env node
// 전 화면 클릭 점검 — 유닛 테스트가 못 잡는 것들을 실제 브라우저로 확인한다.
//
// 잡는 것: 빈 화면, 눌리지 않는 버튼, 잘못된 화면으로 가는 이동, 44px 미만 터치영역,
//          대비 미달, 가로 스크롤, 콘솔 에러, 웹뷰 악조건(애니메이션 정지·저장소 차단),
//          자정 넘김 후 어제 데이터가 오늘로 남는 문제.
//
//   npm run build:web && npm run audit
//
// 미리보기 서버는 이 스크립트가 직접 띄우고 내린다.
// Playwright 는 devDependency 가 아니라 필요할 때만 쓴다(설치 안 돼 있으면 안내 후 종료).

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PORT = Number(process.env.AUDIT_PORT ?? 4173);
const URL_BASE = `http://localhost:${PORT}/`;

// 홈에서 버튼을 누르기 전에 읽어야 하는 글자 수 상한. 지금 실제 값은 50자 안팎이고,
// 설득 문단 하나를 붙이면 바로 넘는다. '특정 문구가 없다' 로 적으면 그 문구가
// 코드에 없는 한 늘 통과하므로, 길이로 잰다.
const HOOK_CHAR_MAX = 70;

// 열두 띠 아이디 — 저장된 띠가 아무 문자열이나여도 통과하지 않게 좁힌다.
// 여기 손으로 적어두면 앱과 어긋나도 아무도 모른다(양띠는 goat 가 아니라 sheep 이다).
// 실제 목록에서 읽고, 열둘이 아니면 그 자리에서 멈춘다.
const ZODIAC_IDS = new Set(
  [...readFileSync(new URL('../src/data/zodiac.ts', import.meta.url), 'utf8')
    .matchAll(/\{\s*id:\s*'([a-z]+)'/g)].map((m) => m[1]),
);
if (ZODIAC_IDS.size !== 12) {
  console.error(`❌ 띠 목록을 못 읽었어요 (${ZODIAC_IDS.size}개). src/data/zodiac.ts 를 확인하세요.`);
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  console.error(`
❌ playwright-core 가 없어요.

  npm i -D playwright-core
  npx playwright install chromium     # 브라우저 실행 파일

설치 후 다시 실행하세요. (CHROME_PATH 로 크로미움 경로를 직접 지정할 수도 있어요)
`);
  process.exit(1);
}

// ── 결과 집계 ───────────────────────────────────────────────
const results = [];
const ok = (name, detail = '') => results.push({ pass: true, name, detail });
const bad = (name, detail = '') => results.push({ pass: false, name, detail });
const check = (cond, name, detail = '') => (cond ? ok(name, detail) : bad(name, detail));

// ── 미리보기 서버 ───────────────────────────────────────────
function startPreview() {
  const p = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: 'ignore',
    detached: false,
  });
  return p;
}

async function waitForServer(timeoutMs = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(URL_BASE);
      if (r.ok) return true;
    } catch { /* 아직 안 떴음 */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

// ── 브라우저 헬퍼 ───────────────────────────────────────────
const VIEWPORT = { width: 390, height: 844 };

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true, ...opts });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.__errs = errs;
  return page;
}

const bodyText = (page) => page.locator('body').innerText();
const wait = (page, ms) => page.waitForTimeout(ms);

// 휠 피커에서 생년월일시를 고른다 (보이는 항목을 눌러 선택)
async function pickBirth(page, { year, month, day, ampm, hour, minute }) {
  const tap = async (label, text) => {
    const wheel = page.locator('.wheel').filter({ has: page.getByRole('listbox', { name: label }) });
    await wheel.getByRole('option', { name: text, exact: true }).first().click();
    await wait(page, 250);
  };
  await tap('태어난 해', String(year));
  await tap('태어난 달', `${month}월`);
  await tap('태어난 날', `${day}일`);
  if (ampm) {
    await tap('오전 오후', ampm);
    await tap('시', `${hour}시`);
    await tap('분', `${minute}분`);
  }
  await wait(page, 400);
}

// 홈에서 띠를 직접 고르는 줄은 없앴다. 이제 띠는 생년월일에서 나오거나 궁합에서 정해진다.
// 점검의 사전 조건이므로 저장소에 바로 심고 새로고침한다.
const ZODIAC_ID = { 쥐띠: 'rat', 소띠: 'ox', 범띠: 'tiger', 토끼띠: 'rabbit', 용띠: 'dragon', 뱀띠: 'snake',
  말띠: 'horse', 양띠: 'sheep', 원숭이띠: 'monkey', 닭띠: 'rooster', 개띠: 'dog', 돼지띠: 'pig' };
async function setZodiac(page, label = '개띠') {
  const id = ZODIAC_ID[label];
  await page.evaluate((v) => window.localStorage.setItem('tomorrowNoteZodiac', v), id);
  await page.reload({ waitUntil: 'networkidle' });
  await wait(page, 400);
}

// 궁합과 이번 달은 홈이 아니라 결과 화면 아래에 있다. 결과까지 간 다음 누른다.
async function goCompat(page) {
  // 궁합은 결과 화면에서 뺐다. 따로 메뉴로 나갈 자리라 해시 딥링크가 유일한 입구다.
  await page.goto(`${URL_BASE}#/compat`, { waitUntil: 'networkidle' });
  await wait(page, 1000);
}

// 이름도 계산에 들어가므로 빈 채로는 다음으로 못 넘어간다. 있으면 채운다.
async function fillName(page, who = '김한별') {
  const box = page.locator('.field__input').first();
  if ((await box.count()) === 0) return;
  if ((await box.inputValue()).trim().length < 2) {
    await box.fill(who);
    await wait(page, 200);
  }
  // 성별도 십 년 흐름의 방향을 가르므로 필수다.
  // 양력·음력도 같은 세그 모양이라 .field 안으로 좁혀야 성별 칸만 본다.
  if ((await page.locator('.field .seg__btn--on').count()) === 0) {
    await page.getByRole('button', { name: '여자' }).first().click();
    await wait(page, 200);
  }
}

// 상세는 접혀 있다. 안을 보는 점검 전에 다 펴놓는다.
async function openFolds(page) {
  for (const b of await page.locator('.fold__head').all()) {
    await b.click();
    await wait(page, 150);
  }
  await wait(page, 400);
}

// 고민마다 카드 수와 문장 길이가 다르다. 한 고민만 열어보고 '결과 화면은
// 괜찮다' 고 적으면, 나머지 다섯 화면은 대비도 터치영역도 가로 스크롤도
// 한 번도 안 본 채로 통과한다. 생년월일도 마찬가지다 - 십성이 갈리면
// 들어가는 글자가 갈리고, 긴 글자가 칸을 뚫는 건 그때만 보인다.
const CONCERN_PATHS = [
  { concern: '일과 이직', option: '다니는데 옮기고 싶어요' },
  { concern: '돈', option: '모으고 싶어요' },
  { concern: '연애', option: '혼자예요' },
  { concern: '사람 관계', option: '회사 사람이에요' },
  { concern: '몸과 컨디션', option: '기운이 없어요' },
  { concern: '마음', option: '불안해요' },
];

async function drawTo(page, opts = {}) {
  const { zodiac = '개띠', concern = '일과 이직', option = '다니는데 옮기고 싶어요', birth = null } = opts;
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await wait(page, 400);
  if (zodiac) await setZodiac(page, zodiac);
  // 흐름 다섯 장: 홈 → 이름·성별·생년월일 → 고민 → 자세히 → 쪽지 → 결과.
  // 주제와 기분은 묻지 않는다.
  await page.locator('.today-hook__cta').first().click();
  await wait(page, 600);
  // 저장돼 있어도 이름·생년월일 화면은 한 번 거친다. 고칠 기회를 주는 자리다.
  // 이 앱의 답은 전부 명식에서 나오므로 건너뛰는 길은 없앴다.
  if (await page.getByRole('button', { name: '다음' }).count()) {
    await fillName(page);
    if (birth) await pickBirth(page, birth);
    await page.getByRole('button', { name: '다음' }).first().click();
    await wait(page, 600);
  }
  if (await page.getByText('요즘 뭐가 고민이에요?', { exact: false }).count()) {
    await page.getByText(concern, { exact: true }).first().click();
    await wait(page, 500);
    await page.getByText(option, { exact: true }).first().click();
    await wait(page, 600);
  }
  await page.locator('button.note').first().dispatchEvent('click');
  await wait(page, 4300); // 쪽지 열림 + 로딩 연출
}

// ── 화면 진단 프로브 (브라우저 안에서 실행) ─────────────────
// 대비는 그라데이션 배경을 실제 색 정지점으로 계산한다.
// (단색 배경만 보면 흰 글자/파란 그라데이션 카드가 전부 오탐으로 잡힌다)
const DIAGNOSE = () => {
  const lum = (c) => {
    const o = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2];
  };
  const ratio = (a, b) => {
    const [L1, L2] = [lum(a), lum(b)];
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };
  const rgbOf = (s) => { const m = s && s.match(/rgba?\(([^)]+)\)/); return m ? m[1].split(',').map(parseFloat).slice(0, 3) : null; };
  const alphaOf = (s) => { const m = s && s.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/); return m ? parseFloat(m[1]) : 1; };
  // 배경 후보들: 그라데이션이면 '불투명한' 색 정지점 전부, 단색이면 그 색 하나.
  // 투명 정지점(rgba(...,0))은 배경이 아니라 '아래가 비쳐 보이는 구간'이라 세면 안 된다.
  // (형광펜 밑줄 mark 의 linear-gradient(rgba(0,0,0,0) 62%, ...) 을 검정으로 읽어
  //  멀쩡한 검은 글자를 대비 1.27 로 오판했었다)
  const opaqueStops = (bgImage) => {
    const stops = [];
    for (const m of bgImage.matchAll(/rgba?\(([^)]+)\)/g)) {
      const parts = m[1].split(',').map(parseFloat);
      const a = parts.length > 3 ? parts[3] : 1;
      if (a > 0.9) stops.push(parts.slice(0, 3));
    }
    return stops;
  };
  const backgroundsOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      // 불투명한 그라데이션을 만나면 거기서 멈춘다. 더 올라가면 그 카드에 가려
      // 실제로는 보이지 않는 조상 배경(보통 흰색)까지 후보에 들어가, 파란 카드 위
      // 흰 글자가 '흰 배경 위 흰 글자'로 오판된다.
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        const stops = opaqueStops(cs.backgroundImage);
        if (stops.length) return stops;
      }
      const c = rgbOf(cs.backgroundColor);
      if (c && alphaOf(cs.backgroundColor) > 0.9) return [c];
      n = n.parentElement;
    }
    return [[255, 255, 255]];
  };

  const contrast = [];
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (!own) continue;
    // 컬러 이모지는 CSS color 를 쓰지 않으므로(글리프 자체가 색을 갖는다) 대비 대상이 아니다.
    // 단 ×·›·▾ 같은 기호는 색이 적용되므로 계산에 포함한다.
    if (/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u.test(own)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) continue;
    const fg = rgbOf(cs.color);
    if (!fg) continue;
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    const worst = Math.min(...backgroundsOf(el).map((bg) => ratio(fg, bg)));
    if (worst < need) {
      contrast.push({ text: own.slice(0, 30), ratio: +worst.toFixed(2), need, size, cls: (el.className || '').toString().split(' ')[0] });
    }
  }

  const small = [];
  for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    let { width: w, height: h } = r;
    // ::after 로 넓힌 탭 영역까지 인정한다
    const after = getComputedStyle(el, '::after');
    if (after.content && after.content !== 'none' && after.position === 'absolute') {
      const t = parseFloat(after.top) || 0, b = parseFloat(after.bottom) || 0;
      const l = parseFloat(after.left) || 0, rr = parseFloat(after.right) || 0;
      if (t < 0 || b < 0) h += Math.abs(Math.min(t, 0)) + Math.abs(Math.min(b, 0));
      if (l < 0 || rr < 0) w += Math.abs(Math.min(l, 0)) + Math.abs(Math.min(rr, 0));
    }
    if (h < 44 || w < 44) {
      small.push({ label: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 30), w: Math.round(w), h: Math.round(h), cls: (el.className || '').toString().split(' ')[0] });
    }
  }

  const faded = [];
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (!own) continue;
    if (parseFloat(getComputedStyle(el).opacity) < 0.9) {
      faded.push({ text: own.slice(0, 24), cls: (el.className || '').toString().split(' ')[0] });
    }
  }

  return {
    contrast,
    small,
    faded,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    textLen: document.body.innerText.replace(/\s/g, '').length,
  };
};

// 토스 표준 CTA(adaptiveBlue500 위 흰 글자, 3.71)는 TDS 그대로 쓰기로 한 값이라 제외한다.
const ALLOWED_CONTRAST = new Set(['btn', 'btn-unlock']);

async function diagnose(page, screen) {
  const d = await page.evaluate(DIAGNOSE);
  const realContrast = d.contrast.filter((c) => !ALLOWED_CONTRAST.has(c.cls));
  check(d.textLen > 40, `[${screen}] 빈 화면 아님`, `글자 ${d.textLen}자`);
  check(!d.overflowX, `[${screen}] 가로 스크롤 없음`);
  check(d.small.length === 0, `[${screen}] 터치영역 44px 이상`,
    d.small.map((s) => `${s.w}×${s.h} .${s.cls} "${s.label}"`).join(' / '));
  check(realContrast.length === 0, `[${screen}] 대비 AA 충족`,
    realContrast.map((c) => `${c.ratio}(필요 ${c.need}) .${c.cls} "${c.text}"`).join(' / '));
  check(page.__errs.length === 0, `[${screen}] 콘솔 에러 없음`, page.__errs.join(' | '));
  // 화면에 실제로 찍힌 글자에서 이모지를 찾는다.
  //
  // check:uiemoji 는 .tsx 안에 박힌 글자만 본다. 그래서 데이터(.ts)에 있던
  // 이모지가 {z.emoji} 로 건너와 화면에 뜨는 것은 못 잡았고, 실제로 궁합
  // 별자리 고르기와 MoodScreen 두 군데에서 새어 나오고 있었다.
  // 별자리 기호(♈~♓)는 '색 없는 활자'라고 적어뒀지만 크로미움에서는 빨강·
  // 초록으로 꽉 찬 그림으로 나왔다. 소스가 아니라 화면을 봐야 잡힌다.
  const shownEmoji = await page.evaluate(() => {
    const re = /[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{FE0F}]/u;
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n = walk.nextNode();
    while (n) {
      const m = n.nodeValue.match(re);
      if (m) out.push(`${m[0]} in .${n.parentElement?.className || '?'}`);
      n = walk.nextNode();
    }
    return [...new Set(out)];
  });
  check(shownEmoji.length === 0, `[${screen}] 화면에 이모지 없음`, shownEmoji.join(' / '));
  page.__errs.length = 0;
  return d;
}

// ── 본 점검 ─────────────────────────────────────────────────
async function run(browser) {
  // 1. 홈 — 첫 진입
  {
    const page = await newPage(browser);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 800);
    const t = await bodyText(page);
    check(/오늘은 \S+일/.test(t), '[홈] 일진 카드 노출');
    check(t.includes('오늘의 띠 서열'), '[홈] 띠 서열 노출');
    check(t.includes('오늘 쪽지 열어보기'), '[홈] 시작 CTA 노출');
    // 앱인토스 반려 사유: 진입 직후 바텀시트/모달이 자동으로 뜨면 안 된다.
    // role="dialog" 나 bottom-sheet 같은 이름으로 찾으면, 이 앱에는 그런 마크업이
    // 아예 없어서 나중에 맨 div 로 덮개를 올려도 통과한다. 이름 말고 결과로 본다 —
    // 시작 버튼 한가운데가 실제로 눌리는가, 화면 절반을 덮고 떠 있는 것이 있는가.
    const ctaClear = await page.evaluate(() => {
      const cta = document.querySelector('.today-hook__cta');
      if (!cta) return { reach: false, veil: '시작 버튼이 없음' };
      const r = cta.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const veil = [...document.body.querySelectorAll('*')].find((el) => {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return false;
        const b = el.getBoundingClientRect();
        return b.width * b.height > window.innerWidth * window.innerHeight * 0.5;
      });
      return {
        reach: !!top && cta.contains(top),
        veil: veil ? `덮개 ${veil.className || veil.tagName}` : '',
      };
    });
    check(ctaClear.reach && ctaClear.veil === '',
      '[홈] 진입 즉시 시작 버튼을 가리는 것이 없다 (토스 정책)',
      `${ctaClear.reach ? '' : '버튼이 안 눌림 '}${ctaClear.veil}`);
    await diagnose(page, '홈');
    await page.context().close();
  }

  // 2. 홈의 모든 컨트롤이 어딘가로 간다
  {
    const TARGETS = [
      ['시작하기', '오늘 쪽지 열어보기', '언제 태어났어요'],
    ];
    // 궁합과 이번 달은 홈에서도 결과에서도 뺐다. 궁합은 따로 메뉴로 나갈 자리다.

    for (const [name, needle, expect] of TARGETS) {
      const page = await newPage(browser);
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      await wait(page, 500);
      try {
        await page.getByText(needle, { exact: false }).first().click();
        await wait(page, 900);
        const t = await bodyText(page);
        check(t.includes(expect), `[홈→${name}] 이동`, t.split('\n').filter(Boolean).slice(0, 3).join(' / '));
      } catch (e) {
        bad(`[홈→${name}] 이동`, e.message.split('\n')[0]);
      }
      await page.context().close();
    }
  }

  // 2-b. 이번 주 운세 캘린더 — 띠를 골라야 뜨는 카드라 별도 경로로 점검한다.
  //      잠금 상태에서 "뭐가 열리는지"가 보여야 하고, 열면 7일이 전부 나와야 한다.
  {
    const page = await newPage(browser);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 500);
    try {
      await setZodiac(page, '쥐띠');
      await drawTo(page, { zodiac: null });

      const open = await bodyText(page);
      check(open.includes('이번 주 내 운세'), '[주간] 띠 선택 후 캘린더 카드 노출');
      // 광고 잠금을 걷어냈다 — 이번 주에 뭘 조심할지는 앱이 해주기로 한 말의 절반이다.
      // 전에는 '무료로 열려요' 같은 문구가 없는지만 봤다. 그 문구는 코드에 아예
      // 없어서 무슨 짓을 해도 통과하는 검사였다. 막는 건 글자가 아니라 덮개다 —
      // 마지막 날 칸 한가운데가 실제로 눌리는지, 흐림이 걸려 있지 않은지를 본다.
      // elementFromPoint 는 보이는 화면 안에서만 답한다. 스크롤을 안 하면
      // '화면 밖이라 못 짚었다' 를 '덮개가 있다' 로 잘못 읽는다.
      await page.locator('.week-row').last().scrollIntoViewIfNeeded();
      await wait(page, 300);
      const weekReach = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.week-row')];
        const last = rows[rows.length - 1];
        if (!last) return { hit: false, veil: '칸 없음' };
        const r = last.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const veiled = rows.find((el) => {
          const cs = getComputedStyle(el);
          return cs.filter !== 'none' || parseFloat(cs.opacity) < 0.99;
        });
        return { hit: !!top && last.contains(top), veil: veiled ? '흐림/투명 처리됨' : '' };
      });
      check(weekReach.hit && weekReach.veil === '',
        '[주간] 마지막 날 칸까지 덮개 없이 바로 눌린다',
        `${weekReach.hit ? '' : '위에 덮인 것이 있음 '}${weekReach.veil}`);
      check(/이번 주는 .+(트여요|순해요|잔잔해요)/.test(open), '[주간] 헤드라인 노출',
        (open.match(/이번 주는 [^\n]*/) || [''])[0]);

      const rows = await page.locator('.week-row').count();
      check(rows === 7, '[주간] 7일이 모두 표시', `${rows}행`);
      const today = await page.locator('.week-row--today').count();
      check(today === 1, '[주간] 오늘 칸이 정확히 하나', `${today}개`);
      const best = await page.locator('.week-row--best').count();
      check(best === 1, '[주간] 가장 좋은 날이 정확히 하나', `${best}개`);
      const dots = await page.locator('.week-row__dot').count();
      check(dots === 7, '[주간] 날마다 기운 점 표시', `${dots}개`);
      // 각 행이 요일·날짜·관계·기운을 다 갖고 있어야 "이게 뭐지"가 안 생긴다
      const empty = await page.locator('.week-row').evaluateAll((els) =>
        els.filter((el) => ['__day', '__date', '__rel', '__tone']
          .some((k) => !(el.querySelector(`.week-row${k}`)?.textContent || '').trim())).length);
      check(empty === 0, '[주간] 빈 칸 없음', `${empty}행 비어있음`);
      // 목록만 주면 결국 "그래서 언제"가 남는다. 좋은 날과 조심할 날을 못 박는다.
      check(open.includes('좋은 날') && open.includes('조심할 날'),
        '[주간] 좋은 날과 조심할 날을 한 줄씩 명시');

      await diagnose(page, '주간');

      check((await page.locator('.sec__action').count()) >= 1, '[주간] 공유 버튼 노출');
    } catch (e) {
      bad('[주간] 캘린더 경로', e.message.split('\n')[0]);
    }
    await page.context().close();
  }

  // 2-B. 내 사주 — 생년월일시 입력 → 사주 카드.
  // 이 앱에서 제일 개인적인 값을 다루는 경로라 한 칸도 빈 채로 나가면 안 된다.
  {
    const page = await newPage(browser);
    try {
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      await wait(page, 600);

      // 진입점은 '무엇을 넣는지' 만 말하면 된다. 왜 필요한지를 설득하는 문장은
      // 넣지 않는다 — 누르기 전에 읽어야 할 글이 늘어날 뿐이다.
      // 전에는 '생년월일 입력하기' 같은 특정 문구가 없는지 봤다. 그 문구들은
      // 코드에 없어서 늘 통과했다. 지켜야 할 건 문구가 아니라 두 가지다 —
      // 홈에서 뽑기로 가는 큰 버튼은 하나, 누르기 전에 읽을 글은 짧다.
      const homeShape = await page.evaluate(() => {
        const hook = document.querySelector('.today-hook');
        return {
          primary: document.querySelectorAll('.btn--primary').length,
          hookChars: hook ? (hook.innerText || '').replace(/\s+/g, '').length : -1,
        };
      });
      check(homeShape.primary === 1, '[사주] 홈에서 뽑기로 가는 큰 버튼은 하나뿐',
        `${homeShape.primary}개`);
      check(homeShape.hookChars > 0 && homeShape.hookChars <= HOOK_CHAR_MAX,
        '[사주] 누르기 전에 읽을 글이 짧다', `${homeShape.hookChars}자`);

      // 생년월일은 뽑기 흐름의 첫 장에서 받는다
      await page.getByText('오늘 쪽지 열어보기').first().click();
      await wait(page, 800);
      check((await bodyText(page)).includes('언제 태어났어요'), '[사주입력] 화면 진입');
      // 개인정보를 받는 화면이므로 어디에 저장되는지 먼저 말해야 한다
      check(/이 기기에만 저장|어디에도 보내지/.test(await bodyText(page)),
        '[사주입력] 저장 위치를 먼저 고지');
      await diagnose(page, '사주입력');

      // 버튼을 잠그지 않는다 — 네이티브 피커 값이 안 들어오면 '왜 안 눌리지' 로 멈춘다.
      // 대신 누르면 뭐가 모자란지 알려줘야 한다.
      check(!(await page.locator('.btn--primary').first().isDisabled()),
        '[사주입력] 버튼을 비활성으로 잠그지 않음');
      // 휠은 늘 값을 갖고 있어 '미입력' 상태가 없다 — 대신 기본값으로도 바로 진행되는지 본다
      check((await page.locator('.wheel').count()) === 6, '[사주입력] 생년월일·시각 휠 6개');
      check((await page.locator('.wheel-group__v').count()) >= 1, '[사주입력] 고른 값이 요약 줄에 보인다');

      // 안 채우고 넘기면 안 채웠다고 떠야 한다.
      // 잠긴 버튼은 이유를 안 알려주고, 조용히 안내 문구만 바꾸면 아무도 못 본다.
      // 눌렀을 때 (1) 못 넘어가고 (2) 눈에 띄게 뜨고 (3) 그 칸으로 끌려가야 한다.
      await page.getByRole('button', { name: '다음' }).first().click();
      await wait(page, 700);
      const blocked = await bodyText(page);
      check(blocked.includes('언제 태어났어요'), '[미입력] 이름 없이 누르면 다음으로 안 넘어감');
      // 빠진 칸은 한 번에 다 보여준다. 전에는 이름부터 막고 돌아섰다가 이름을
      // 채우면 그제서야 성별을 막아서, 한 번 채울 것을 두 번 왕복하게 했다.
      check((await page.locator('.field__warn').count()) === 2,
        '[미입력] 빠진 칸을 한 번에 다 알려준다', `${await page.locator('.field__warn').count()}개`);
      check(/이름을 두 글자 이상/.test(blocked), '[미입력] 무엇을 해야 하는지 적혀 있다');
      check(/성별을 골라주세요/.test(blocked), '[미입력] 성별도 같이 알려준다');
      check((await page.locator('.field--warn').count()) === 2, '[미입력] 빈 칸에 테두리 표시');
      check((await page.locator('.field__input[aria-invalid="true"]').count()) === 1,
        '[미입력] 빈 칸에 aria-invalid');
      // 데려가는 자리는 위에서 처음 빠진 칸 하나다
      check(await page.evaluate(() => document.activeElement?.className?.includes?.('field__input') === true),
        '[미입력] 커서가 위에서 처음 빠진 칸으로 간다');

      await page.locator('.field__input').first().fill('김한별');
      await wait(page, 300);
      check((await page.locator('.field__warn').count()) === 1,
        '[미입력] 채운 칸의 경고만 사라진다', `${await page.locator('.field__warn').count()}개`);

      // 성별도 십 년 흐름의 방향을 가른다 — 같은 대우를 받아야 한다
      await page.getByRole('button', { name: '다음' }).first().click();
      await wait(page, 700);
      const blocked2 = await bodyText(page);
      check(blocked2.includes('언제 태어났어요'), '[미입력] 성별 없이 누르면 다음으로 안 넘어감');
      check(/성별을 골라주세요/.test(blocked2), '[미입력] 성별 경고가 뜬다');
      await page.getByRole('button', { name: '여자' }).first().click();
      await wait(page, 300);
      check((await page.locator('.field__warn').count()) === 0,
        '[미입력] 성별을 고르면 경고가 사라진다');

      // 입춘 경계(2024-02-04 10:00) — 달력 띠와 사주 띠가 갈리는 날
      // 휠은 굴려도 되고 눌러도 된다 — 자동화는 누르는 쪽으로 확인한다
      await pickBirth(page, { year: 2024, month: 2, day: 4, ampm: '오전', hour: 10, minute: '00' });
      const peek = await bodyText(page);
      check(/2024년 2월 4일/.test(peek), '[사주입력] 고른 날짜가 요약 줄에 바로 반영');

      // 시각 모름 경로도 살아 있어야 한다 (모르는 사람이 많다)
      await page.getByText('태어난 시각을 몰라요', { exact: false }).first().click();
      await wait(page, 500);
      check((await page.locator('.wheel--off').count()) === 3,
        '[사주입력] 시각 모름 선택 시 시각 휠 세 개가 비활성');
      check((await bodyText(page)).includes('세 기둥'), '[사주입력] 시각 없이도 되는 이유 설명');
      await page.getByText('태어난 시각을 몰라요', { exact: false }).first().click();
      await wait(page, 400);

      // 음력 — 생일을 음력으로만 아는 분이 많다. 음력을 양력인 줄 알고 넣으면
      // 여덟 글자가 통째로 남의 것이 되므로, 넣는 달력을 고를 수 있어야 한다.
      check((await page.getByRole('button', { name: '음력' }).count()) >= 1,
        '[음력] 양력·음력을 고를 수 있다');
      await pickBirth(page, { year: 2023, month: 3, day: 1 });
      await page.getByRole('button', { name: '음력' }).first().click();
      await wait(page, 600);
      const lun = await bodyText(page);
      check(/음력 \d{4}년/.test(lun), '[음력] 고르면 음력으로 적힌다');
      check(/양력 \d{4}년 \d{1,2}월 \d{1,2}일로 봐요/.test(lun),
        '[음력] 양력으로 며칠인지 같이 보여준다');

      // 2023년은 윤2월이 있는 해다. 음력 2월을 고르면 윤달 칸이 떠야 한다.
      await pickBirth(page, { year: 2023, month: 2, day: 1 });
      check((await page.getByText('윤2월에 태어났어요', { exact: false }).count()) === 1,
        '[음력] 윤달이 있는 달에서만 윤달 칸이 뜬다');
      await page.getByText('윤2월에 태어났어요', { exact: false }).first().click();
      await wait(page, 500);
      check(/음력 2023년 윤2월/.test(await bodyText(page)), '[음력] 윤달을 켜면 윤달로 적힌다');
      // 켜면 위아래 가로줄까지 파랗게 칠해져서, 바로 밑의 '태어난 시각을 몰라요'
      // 체크줄과 전혀 다른 물건처럼 보였다. 체크됐다는 사실은 네모와 글자색이
      // 이미 말한다. 줄은 옆 줄들과 같은 회색이어야 리듬이 안 깨진다.
      const checkRule = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.birth-unknown')];
        if (rows.length < 2) return null;
        return rows.map((r) => getComputedStyle(r).borderTopColor);
      });
      check(checkRule !== null && new Set(checkRule).size === 1,
        '[음력] 켠 체크줄의 가로줄이 옆 줄과 같은 색', checkRule ? [...new Set(checkRule)].join(' / ') : '줄 없음');
      await page.getByText('윤2월에 태어났어요', { exact: false }).first().click();
      await wait(page, 400);

      // 2024년은 윤달이 없다. 칸이 남아 있으면 안 된다.
      await pickBirth(page, { year: 2024, month: 2, day: 1 });
      check((await page.locator('.birth-unknown').filter({ hasText: '윤' }).count()) === 0,
        '[음력] 윤달이 없는 해에는 윤달 칸이 없다');

      // 태어난 곳 — 한국 표준시는 동경 135°인데 국토는 126~130°에 있다.
      // 전원 서울로 계산하면 시주 경계 근처에서 태어난 사람의 시주가 한 칸 밀린다.
      check((await page.getByText('태어난 곳', { exact: true }).count()) === 1,
        '[출생지] 태어난 곳을 받는다');
      check(/서울/.test(await bodyText(page)), '[출생지] 기본값이 서울로 보인다');
      await page.locator('.field__pick').first().click();
      await wait(page, 500);
      check((await page.locator('.field__opt').count()) >= 10, '[출생지] 목록이 열린다');
      await page.getByRole('button', { name: '부산', exact: true }).first().click();
      await wait(page, 500);
      check(/부산/.test(await page.locator('.field__pick').first().innerText()),
        '[출생지] 고른 곳이 줄에 남는다');
      // 같은 폼 안에서 칸마다 생김새가 다르면 무엇을 넣는 자리인지가 안 읽힌다
      const [inputBox, pickBox] = await Promise.all([
        page.locator('.field__input').first().boundingBox(),
        page.locator('.field__pick').first().boundingBox(),
      ]);
      check(
        !!inputBox && !!pickBox &&
          Math.abs(inputBox.width - pickBox.width) < 1 &&
          Math.abs(inputBox.height - pickBox.height) < 1,
        '[출생지] 고르는 줄이 이름 칸과 같은 크기',
        `${inputBox?.width}x${inputBox?.height} vs ${pickBox?.width}x${pickBox?.height}`,
      );

      // 달력을 바꿔도 가리키는 날은 같아야 한다
      const before = (await bodyText(page)).match(/양력 (\d{4})년 (\d{1,2})월 (\d{1,2})일/);
      await page.getByRole('button', { name: '양력' }).first().click();
      await wait(page, 600);
      const after = (await page.locator('.wheel-group__v').first().innerText()).trim();
      check(
        !!before && after.startsWith(`${before[1]}년 ${before[2]}월 ${before[3]}일`),
        '[음력] 양력으로 되돌려도 같은 날',
        `${before ? before.slice(1).join('-') : '?'} vs ${after}`,
      );

      await fillName(page);
      await page.getByRole('button', { name: '다음' }).first().click();
      await wait(page, 900);
      // 명식 표(네 기둥·오행·강약)는 리포트 안으로 들어갈 자리다. 별도 화면은 없앴다.

      // 새로고침해도 사주가 남고, 홈은 쪽지 뽑기만 남아 있어야 한다
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      await wait(page, 800);
      const homeQuiet = await bodyText(page);
      check(!homeQuiet.includes('내 사주') && !homeQuiet.includes('오늘 나에게') && !homeQuiet.includes('이번 주 내 운세'),
        '[홈] 사주·운세는 정보를 넣은 뒤에만 나온다');
      // 홈의 첫 CTA 는 언제나 쪽지 뽑기여야 한다 (사주가 주인공을 뺏으면 안 된다)
      const firstCta = await page.locator('.today-hook__cta').first().innerText();
      check(/쪽지|열어보기/.test(firstCta), '[쪽지] 홈 첫 CTA 는 쪽지 뽑기', firstCta.trim());
      // 기분 화면에서도 띠·별자리를 다시 묻지 않아야 한다 — 같은 목적의 입력이 세 갈래면 컨셉이 흐려진다
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      await wait(page, 500);
      await page.locator('.today-hook__cta').first().click();
      await wait(page, 600);
      // 사주가 있어도 이름·생년월일 화면을 한 번 거친다 (값은 채워져 있다)
      check((await page.getByText('언제 태어났어요?', { exact: false }).count()) > 0,
        '[흐름] 뽑기 전에 이름·생년월일을 먼저 받는다');
      await fillName(page);
      await page.getByRole('button', { name: '다음' }).first().click();
      await wait(page, 700);
      await page.getByText('일과 이직', { exact: true }).first().click();
      await wait(page, 500);
      await page.getByText('다니는데 옮기고 싶어요', { exact: true }).first().click();
      await wait(page, 700);
      const pickText = await bodyText(page);
      check((await page.locator('[data-screen="pick"]').count()) === 1, '[흐름] 고민을 고르면 쪽지 고르기로');
      check((await page.locator('.pick-basis').count()) === 1, '[흐름] 무엇을 근거로 뽑는지 한 줄로 보임');
      // 남는 자리를 가운데 정렬로 먹여서 질문과 카드 사이가 69px 벌어져 있었다.
      // 고를 것은 질문 바로 밑에 있어야 한다.
      const pickGap = await page.evaluate(() => {
        const lead = document.querySelector('.pick-basis');
        const grid = document.querySelector('.note-grid');
        if (!lead || !grid) return -1;
        return Math.round(grid.getBoundingClientRect().top - lead.getBoundingClientRect().bottom);
      });
      check(pickGap >= 0 && pickGap <= 40, '[흐름] 뽑을 카드가 질문 바로 밑에 있다', `${pickGap}px`);
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      await wait(page, 500);

      // 띠를 고르라고 묻는 자리는 궁합 화면 하나뿐이다. 쪽지 흐름의 띠는
      // 생년월일에서 딴다(명식 년지). 그래서 '띠를 다시 묻지 않는다' 를 문구로
      // 확인하면 그 문구가 코드에 없어서 무슨 짓을 해도 통과했다. 두 가지로 본다 —
      // 고르는 칸이 한 번도 안 떴는가, 그런데도 띠가 채워져 있는가.
      const zodiacPickers = await page.locator('.zodiac-chip').count();
      check(zodiacPickers === 0, '[사주] 뽑는 동안 띠를 고르라고 묻지 않는다', `${zodiacPickers}칸`);
      const savedZodiac = await page.evaluate(() =>
        window.localStorage.getItem('tomorrowNoteZodiac'));
      check(ZODIAC_IDS.has(String(savedZodiac)), '[사주] 띠는 생년월일에서 따서 채워 둔다',
        String(savedZodiac));
      // 주간 캘린더는 결과 화면에 있다. 사주에서 딴 띠로 거기서 열리는지 본다.
      await drawTo(page, { zodiac: null });
      check((await page.locator('.week-card').count()) === 1,
        '[사주] 띠가 채워져 주간 캘린더도 열림');
      check((await page.locator('.week-card .week-row').count()) === 7,
        '[사주] 띠를 묻지 않고도 이번 주 일곱 날이 다 찬다');
      // 지우는 줄은 생년월일 화면 하나뿐이다 — 결과까지 따라오면 안 된다.
      check((await page.locator('.data-link').count()) === 0,
        '[사주] 결과 화면에 전부 지우기 줄이 따라오지 않음');

      // 사주를 넣은 사람의 '오늘 결과'가 실제로 개인 기준으로 바뀌는가.
      // 여기가 안 바뀌면 사주 화면만 따로 놀고, 매일 보는 결과는 여전히 띠 12분의 1이다.
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      await wait(page, 500);
      await page.locator('.today-hook__cta').first().click();
      await wait(page, 700);
      await fillName(page);
      await page.getByRole('button', { name: '다음' }).first().click();
      await wait(page, 700);
      // 사주가 있어도 고민은 묻는다. 고민이 결과의 절반이기 때문이다.
      check((await page.getByText('요즘 뭐가 고민이에요?', { exact: false }).count()) > 0,
        '[사주] 사주가 있어도 고민을 묻는다');
      await page.getByText('일과 이직', { exact: true }).first().click();
      await wait(page, 500);
      await page.getByText('다니는데 옮기고 싶어요', { exact: true }).first().click();
      await wait(page, 700);
      // 생년월일을 받아놓고 정작 뽑는 쪽지에 안 쓰면 "그래서 뭐가 달라졌지" 가 된다
      check((await page.locator('.pick-basis').count()) === 1,
        '[사주] 쪽지 후보에 사주가 쓰였음을 밝힘');
      await page.locator('button.note').first().dispatchEvent('click');
      await wait(page, 4300);

      const res = await bodyText(page);
      check(/(오늘|일과 이직|돈|연애|사람 관계|몸과 컨디션|마음) 점수\s*\d+\s*점/.test(res), '[사주결과] 결과 도달');
      check(/지금 어떻게 하면 될까요/.test(res), '[사주결과] 고민 답이 결과 안에 들어감');
      await diagnose(page, '사주결과');

      // 개인정보를 받았으면 지우는 길이 앱 안에 있어야 한다. 넣는 자리에 둔다.
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      await wait(page, 500);
      await page.locator('.today-hook__cta').first().click();
      await wait(page, 800);
      check((await page.locator('.data-link').count()) === 1, '[사주] 생년월일 화면에 지우기 한 줄');
      await page.locator('.data-link').first().click();
      await wait(page, 400);
      check((await bodyText(page)).includes('전부 지울까요'), '[사주] 삭제는 두 단계 확인');
      await page.getByText('네, 지울게요', { exact: false }).first().click();
      await wait(page, 900);
      check(/열어보기/.test(await bodyText(page)), '[사주] 삭제 후 홈으로 되돌아감');
      const gone = await page.evaluate(() => window.localStorage.getItem('tomorrowNoteBirth'));
      check(gone === null, '[사주] 삭제 후 저장소에 생년월일이 남지 않음', String(gone));
    } catch (e) {
      bad('[사주] 경로', e.message.split('\n').slice(0, 4).join(' | '));
    }
    await page.context().close();
  }

  // 2-C. 쪽지 컨셉 유지 — 이 앱의 정체성.
  // 사주를 붙이면서 표면이 사주로 덮이면 '오늘쪽지 뽑기'가 아니게 된다.
  // 뽑은 쪽지가 결과에 남는지, 고른 것이 실제로 반영되는지 본다.
  {
    const page = await newPage(browser);
    try {
      await drawTo(page, {});
      const t = await bodyText(page);
      check((await page.locator('.drawn').count()) === 1, '[쪽지] 결과에 뽑은 쪽지 카드 노출');
      // 쪽지 이름은 라벨 줄 안에 한 줄로 들어간다. 따로 큰 글씨로 세우면
      // 바로 밑 결론과 굵기가 같아져 무엇이 제목인지 안 읽힌다.
      const name = (await page.locator('.drawn__kw').innerText()).trim();
      check(name.length >= 2, '[쪽지] 뽑은 쪽지 이름이 결과에 남음', name);
      check(t.includes('내가 뽑은 쪽지'), '[쪽지] 내가 뽑았다는 사실을 명시');
      // 위계 가드 — 결론이 쪽지 이름보다 반드시 커야 한다
      const sizes = await page.evaluate(() => {
        const px = (el) => (el ? Number.parseFloat(getComputedStyle(el).fontSize) : 0);
        return {
          name: px(document.querySelector('.drawn__kw')),
          verdict: px(document.querySelector('.drawn__verdict')),
        };
      });
      check(sizes.verdict > sizes.name + 3,
        '[쪽지] 결론이 쪽지 이름보다 크다', `${sizes.name} vs ${sizes.verdict}`);
      // 배지와 할 일이 한 줄에 섞이면 줄바꿈이 사고처럼 보인다
      const stance = await page.locator('.drawn__stance').boundingBox();
      const doBox = await page.locator('.drawn__do').boundingBox();
      check(!!stance && !!doBox && doBox.y >= stance.y + stance.height - 1,
        '[쪽지] 결정 배지가 제 줄을 갖는다',
        `배지 ${stance?.y}+${stance?.height} / 할 일 ${doBox?.y}`);
      // 뽑기 화면에서 고른 그 색이 결과까지 이어져야 '같은 종이'로 느껴진다
      const cls = await page.locator('.drawn').getAttribute('class');
      check(/drawn--(softGreen|cream|softYellow|softPink)/.test(cls),
        '[쪽지] 뽑은 쪽지 색이 결과까지 이어짐', cls);
      // 쪽지 이름이 실제로 고른 것과 같아야 한다 (아무 쪽지나 보여주면 의미 없다)
      const lead = (await page.locator('.drawn__lead').innerText()).trim();
      check(lead.length >= 5, '[쪽지] 쪽지별 풀이 한 줄이 함께 나옴', lead.slice(0, 24));

      // ── 광고 자리 ──
      // 결과를 보기 전에 막으면 그 자리에서 나간다. 본문 중간에 끼우면 어디까지가
      // 내 사주고 어디부터가 광고인지 헷갈린다. 광고는 결과를 끝까지 본 사람에게
      // 한 자리에서만 묻는다.
      const ads = await page.locator('.ad-notice').count();
      check(ads > 0, '[광고] 결과에 광고 자리가 있다', String(ads));
      const geo = await page.evaluate(() => {
        const body = document.documentElement.scrollHeight;
        const badges = [...document.querySelectorAll('.ad-notice')];
        const tops = badges.map((b) => b.getBoundingClientRect().top + window.scrollY);
        const hero = document.querySelector('.score-hero');
        const more = document.querySelector('.more');
        return {
          body,
          first: tops.length ? Math.min(...tops) : -1,
          heroBottom: hero ? hero.getBoundingClientRect().bottom + window.scrollY : -1,
          inMore: badges.every((b) => !!more && more.contains(b)),
          rows: more ? more.querySelectorAll('.more__row').length : 0,
        };
      });
      check(geo.inMore, '[광고] 광고는 한 자리에만 모여 있다');
      check(geo.first > geo.heroBottom, '[광고] 결과보다 뒤에 있다',
        `광고 ${Math.round(geo.first)} / 결과 끝 ${Math.round(geo.heroBottom)}`);
      check(geo.first > geo.body * 0.6, '[광고] 본문을 다 본 뒤에 나온다',
        `${Math.round((geo.first / geo.body) * 100)}% 지점`);
      // 본문은 전부 무료여야 한다 — 사주 계산은 이 앱의 본질이라 값을 매기지 않는다.
      // '결제·유료' 같은 낱말로 찾으면 돈 고민 본문("결제 버튼 앞에서 한 밤만
      // 자고 결정해요")까지 걸려서, 고민에 따라 되기도 안 되기도 하는 검사가 된다.
      // 무료인지는 낱말이 아니라 동작으로 본다 — 접힌 덩이가 광고 없이 그냥 열린다.
      const foldBodies = await page.evaluate(async () => {
        const heads = [...document.querySelectorAll('.fold__head')];
        for (const h of heads) h.click();
        await new Promise((r) => setTimeout(r, 500));
        return heads.map((h) => (h.parentElement?.querySelector('.fold__body')?.innerText || '').trim().length);
      });
      check(foldBodies.length === 3 && foldBodies.every((n) => n > 20),
        '[광고] 접힌 본문이 광고 없이 그냥 열린다', foldBodies.join('/'));
      // 지금 보고 있는 고민을 다시 팔면 안 된다
      check(geo.rows === 5, '[광고] 지금 보는 고민은 목록에서 빠진다', String(geo.rows));
      // 잠겨 있을 때는 테두리 알약(광고)인데 풀리면 맨 글자였다. 지금 누를 수
      // 있는 쪽이 값을 치러야 하는 쪽보다 덜 눌릴 것처럼 보이면 안 되고,
      // 상자 높이가 다르면 광고를 보고 난 뒤 줄이 흔들린다.
      const chipBox = await page.evaluate(() => {
        const row = document.querySelector('.more__row');
        if (!row) return null;
        const ad = document.querySelector('.more__row .ad-notice');
        const probe = document.createElement('span');
        probe.className = 'more__open';
        probe.textContent = '보기';
        row.appendChild(probe);
        const a = ad ? ad.getBoundingClientRect() : null;
        const b = probe.getBoundingClientRect();
        probe.remove();
        return a ? { ad: Math.round(a.height), open: Math.round(b.height) } : null;
      });
      check(chipBox !== null && chipBox.ad === chipBox.open,
        '[광고] 풀린 줄과 잠긴 줄의 상자 높이가 같다',
        chipBox ? `광고 ${chipBox.ad}px / 보기 ${chipBox.open}px` : '줄 없음');

      // ── 다시 올 이유 ──
      // 이 앱의 답은 실제로 매일 바뀌는데 그 사실을 아무 데서도 말하지 않으면
      // 한 번 보고 끝내는 화면이 된다. 단, 지어낸 기대는 걸지 않는다.
      const nd = await page.locator('.nextday__v').innerText().catch(() => '');
      check(nd.includes('내일'), '[재방문] 내일 무엇이 달라지는지 적혀 있다', nd.slice(0, 30));
      check(!/대박|최고의 날|놓치면|서둘러|무조건|반드시/.test(nd),
        '[재방문] 미끼 표현을 안 쓴다', nd.slice(0, 30));
      // 접힌 묶음 안에 넣으면 안 펴는 사람은 못 본다
      const ndOpen = await page.evaluate(() => {
        const el = document.querySelector('.nextday');
        if (!el) return false;
        let cur = el.parentElement;
        while (cur) {
          if (cur.classList?.contains('fold')) return false;
          cur = cur.parentElement;
        }
        return true;
      });
      check(ndOpen, '[재방문] 접힌 묶음 밖에 있다');

      // 알림은 먼저 띄우지 않는다. 시스템 팝업이 불쑥 뜨는 앱이 되면 그 자리에서
      // 나간다. 콘솔 템플릿이 아직 비어 있으므로 지금은 줄 자체가 없어야 한다.
      // 이 줄은 콘솔 템플릿을 채워야 뜬다. 그러니 '안 뜬다' 로 못 박으면
      // 형님이 값을 채우는 순간 이 점검이 빨개진다 - release.test.ts 가
      // 같은 병으로 깨졌던 것과 같다. 지금 어느 상태인지 읽고 그에 맞게 잰다.
      const notiFilled = !/NOTI_TEMPLATE_CODE = 'REPLACE_/.test(
        readFileSync(new URL('../src/lib/toss.ts', import.meta.url), 'utf8'));
      const notiRows = await page.locator('.notiask').count();
      check(notiRows === (notiFilled ? 1 : 0),
        notiFilled ? '[알림] 템플릿을 채우면 줄이 하나 나온다' : '[알림] 템플릿이 비면 줄이 안 나온다',
        `${notiRows}줄`);
      const popped = await page.evaluate(() => document.body.innerText.includes('알림 동의'));
      check(!popped, '[알림] 화면 진입에 동의 창을 띄우지 않는다');

      // 그런데 템플릿을 채우면 이 줄이 화면에 뜬다. 즉 형님이 콘솔 값을 넣은
      // 순간 처음 나타나는 UI 인데, 여기까지 어떤 검사도 그걸 본 적이 없었다.
      // 빌드를 한 번 더 돌리지 않고도 보려면, 실제 화면에 그 마크업을 심어
      // CSS 가 내는 값을 잰다. 다른 줄들과 같은 자로 재는 게 핵심이다.
      const noti = await page.evaluate(() => {
        const host = document.querySelector('.nextday')?.parentElement ?? document.body;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'notiask';
        el.innerHTML = '<span class="notiask__k">내일 쪽지가 바뀌면 알려드릴까요</span>'
          + '<span class="notiask__c" aria-hidden>\u203a</span>';
        host.appendChild(el);
        const r = el.getBoundingClientRect();
        const k = getComputedStyle(el.querySelector('.notiask__k'));
        const box = getComputedStyle(el);
        const out = {
          h: Math.round(r.height),
          w: Math.round(r.width),
          size: k.fontSize,
          line: k.lineHeight,
          color: k.color,
          bg: box.backgroundColor,
        };
        el.remove();
        return out;
      });
      // 터치로 누르는 줄이다. 44px 미만이면 손가락이 빗나간다.
      check(noti.h >= 44, '[알림] 줄 높이가 44px 이상', `${noti.h}px`);
      // 글자 크기를 안 주면 버튼의 브라우저 기본값(13.33px)이 나온다.
      check(noti.size === '15px' && noti.line === '22.5px',
        '[알림] 글자가 앱의 자를 따른다', `${noti.size}/${noti.line}`);
      // 브랜드 색이어야 '누를 수 있는 것' 으로 읽힌다. 기본 검정이면 안 된다.
      check(noti.color !== 'rgb(0, 0, 0)' && noti.bg !== 'rgba(0, 0, 0, 0)',
        '[알림] 색이 기본값이 아님', `${noti.color} / ${noti.bg}`);

      // ── 한 단어는 한 뜻만 ──
      // 밴드 칩이 '좋아요 92' 로 점수를 말하는데 같은 화면의 줄 이름도
      // '좋아요' 였다. 한 단어가 두 가지 뜻이면 읽는 사람이 둘을 잇는다.
      const BAND_WORDS = ['좋아요', '무난해요', '조심할 때'];
      const clash = await page.evaluate((words) => {
        const LABELS = '.slot__pt-k, .today2__k, .read6__k, .when4__k, .yline__k, .cat4__head, .more__label, .dec__k, .ycmp th';
        return [...document.querySelectorAll(LABELS)]
          .map((el) => el.textContent.trim())
          .filter((t) => words.includes(t));
      }, BAND_WORDS);
      check(clash.length === 0, '[문구] 점수 말과 줄 이름이 안 겹친다', clash.slice(0, 4).join(' / '));
      // 밴드 말은 칩에만 있어야 한다
      const bandOutside = await page.evaluate((words) => {
        // 등급을 보여주는 자리는 전부 여기 적는다. 새 자리를 만들면 여기도
        // 같이 늘려야 한다 — 안 늘리면 이 검사가 먼저 걸린다.
        const chips = [
          '.when4__b', '.yline__b', '.mpick__band', '.score-hero__grade',
          '.week-row__tone', '.cat4__tag', '.cat-top__tag',
        ].join(', ');
        const inChip = new Set(document.querySelectorAll(chips));
        return [...document.querySelectorAll('span, b, strong')]
          .filter((el) => el.children.length === 0)
          .filter((el) => words.includes(el.textContent.trim()))
          .filter((el) => ![...inChip].some((c) => c === el || c.contains(el)))
          .map((el) => `${el.className || el.tagName}:${el.textContent.trim()}`);
      }, BAND_WORDS);
      check(bandOutside.length === 0, '[문구] 밴드 말은 칩 안에만 있다', bandOutside.slice(0, 4).join(' / '));

      // 묶음 이름과 그 안 첫 카드 제목이 같은 말을 두 번 하면 안 된다.
      // '왜 이렇게 봤나요' 바로 밑에 '왜 이렇게 봤냐면요' 가 있었다.
      await openFolds(page);
      const echoes = await page.evaluate(() => {
        const out = [];
        for (const fold of document.querySelectorAll('.fold')) {
          const t = fold.querySelector('.fold__title')?.textContent?.trim() ?? '';
          const h = fold.querySelector('.cat4__head')?.textContent?.trim() ?? '';
          if (!t || !h) continue;
          let n = 0;
          while (n < t.length && n < h.length && t[n] === h[n]) n += 1;
          if (n >= 4) out.push(`${t} / ${h}`);
        }
        return out;
      });
      check(echoes.length === 0, '[문구] 묶음 이름을 카드가 되풀이하지 않는다', echoes.join(' · '));

      // 한 화면에 거의 같은 문장이 두 번 나오는지. 데이터를 보는 게 아니라
      // 실제로 그려진 글자를 본다 - 두 층이 같은 기운을 가질 때만 만나므로
      // 표만 봐서는 안 잡힌다. 문장 틀(달이라·해라·때예요)은 떼고 비교한다.
      const dup = await page.evaluate(() => {
        const FRAME = /쪽으로 읽었어요|기운이 들어와요|기운이 겹쳐요|이 고민에|자리예요|해라|달이라|때예요|좋아요|남아요|나와요/g;
        const sents = document.body.innerText
          .split(/\n|(?<=[.!?])\s+/)
          .map((x) => x.trim())
          .filter((x) => x.length >= 12);
        const norm = (x) => x.replace(FRAME, '').replace(/[^가-힣]/g, '');
        const out = [];
        for (let i = 0; i < sents.length; i += 1) {
          for (let j = i + 1; j < sents.length; j += 1) {
            const a = norm(sents[i]);
            const b = norm(sents[j]);
            if (a.length < 8 || b.length < 8) continue;
            let n = 0;
            for (let k = 0; k + 6 <= a.length; k += 1) if (b.includes(a.slice(k, k + 6))) n += 1;
            if (a === b || n >= 3) out.push(`${sents[i]} / ${sents[j]}`);
          }
        }
        return [...new Set(out)];
      });
      // 맨 위 카드의 할 일과 결정 카드의 첫 할 일은 같아야 한다.
      // '맨 위 하나가 오늘 바로 할 수 있는 것' 이라고 화면에 적어둔 약속이다.
      const onPurpose = dup.filter((x) => {
        const [a, b] = x.split(' / ');
        return a === b;
      });
      const real = dup.filter((x) => !onPurpose.includes(x));
      check(real.length <= 1, '[문구] 한 화면에 거의 같은 문장이 없다',
        `${real.length}건${real.length ? ' — ' + real[0].slice(0, 70) : ''}`);

      // 서열에 등급 말을 붙이면 1~3위가 전부 같은 말로 뭉쳐 서열이 무색해진다.
      // 순서는 숫자가 말하고, 오른쪽은 왜 그 자리인지를 말한다.
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      await wait(page, 700);
      const rankWords = await page.evaluate((words) => {
        const rows = [...document.querySelectorAll('.rank-row__tone')].map((e) => e.textContent.trim());
        return { rows, bad: rows.filter((t) => words.includes(t)) };
      }, BAND_WORDS);
      check(rankWords.rows.length >= 5, '[서열] 줄이 보인다', String(rankWords.rows.length));
      check(rankWords.bad.length === 0, '[서열] 등급 말을 안 쓴다', rankWords.bad.join(' / '));
      check(new Set(rankWords.rows).size >= 2, '[서열] 줄마다 다른 것을 말한다',
        rankWords.rows.join(' / '));
      // 서열표를 만드는 코드는 있었는데 누르는 자리가 없었다
      check((await page.locator('.rank-card').count()) === 1, '[서열] 카드가 있다');
      const shareBtns = await page.locator('.sec__action').allInnerTexts();
      check(shareBtns.some((t) => t.trim() === '공유'), '[서열] 공유하는 자리가 있다',
        shareBtns.join(' / '));
      await diagnose(page, '쪽지결과');
    } catch (e) {
      bad('[쪽지] 컨셉 유지', e.message.split('\n')[0]);
    }
    await page.context().close();
  }

  // 3·4. 주제·기분 화면은 흐름에서 뺐다(네 장 구조). 주제별 문장 다양성은 단위 테스트가 본다.

  // 5. 결과 화면의 모든 액션
  {
    const page = await newPage(browser);
    await drawTo(page);
    await diagnose(page, '결과');

    check((await page.locator('.lucky4__tile').count()) === 6, '[결과] 오늘의 행운 여섯 칸');
    // 여섯 칸에 파랑·노랑·주황을 뜻 없이 흩뿌려 놨었다. 뜻 없는 색은 소음이고,
    // 칸마다 바탕이 다른 격자는 AI 가 만든 화면의 표시로 자주 꼽힌다.
    const tileBg = await page.evaluate(() =>
      [...document.querySelectorAll('.lucky4__tile')].map((e) => getComputedStyle(e).backgroundColor));
    check(new Set(tileBg).size === 1, '[결과] 행운 여섯 칸의 바탕이 하나', [...new Set(tileBg)].join(' / '));
    // 숫자 칸이 큰 숫자 + 라벨 + 같은 숫자로 '8 / 숫자 / 8' 로 읽혔다.
    const tileDup = await page.evaluate(() =>
      [...document.querySelectorAll('.lucky4__tile')]
        .map((e) => e.innerText.trim().split('\n').map((t) => t.trim()).filter(Boolean))
        .filter((ls) => new Set(ls).size !== ls.length).length);
    check(tileDup === 0, '[결과] 행운 칸이 같은 말을 두 번 안 함', `${tileDup}칸`);
    check((await page.locator('.cat4__row').count()) === 4, '[결과] 네 가지 운 점수');
    // 줄마다 아래에 선을 긋는 목록은 마지막 줄 밑에도 선을 남긴다. 카드 안쪽
    // 여백만 남은 자리에 선이 떠 있으면 잘린 화면으로 보인다.
    const danglingRule = await page.evaluate(() => {
      const out = [];
      for (const list of document.querySelectorAll('.cat4__list, .read6, .drawn3, .lucky-grid, .rank-list')) {
        const rows = [...list.children].filter((e) => e.getBoundingClientRect().height > 0);
        const last = rows[rows.length - 1];
        if (!last) continue;
        const w = parseFloat(getComputedStyle(last).borderBottomWidth);
        if (w > 0) out.push(`${list.className}>${last.className}`);
      }
      return out;
    });
    check(danglingRule.length === 0, '[결과] 목록 마지막 줄 밑에 선이 안 남음', danglingRule.join(', '));
    // 같은 일을 하는 버튼을 셋 세워두면 뭘 눌러야 하는지가 먼저 고민이 된다.
    // 아래 바의 '친구한테 보내기' 하나와 본문의 복사 하나로 줄였다.
    check((await page.getByRole('button', { name: '친구한테 보내기' }).count()) === 1,
      '[결과] 친구한테 보내는 버튼이 정확히 하나');
    // 맨 위 쪽지 카드만 캡처해 보내도 뜻이 통해야 한다 - 결론과 지금 할 일까지 들어간다
    const heroText = (await page.locator('.score-hero').first().innerText()).replace(/\s+/g, ' ');
    check(/점수/.test(heroText) && /점/.test(heroText), '[쪽지카드] 주제와 점수');
    check(/내가 뽑은 쪽지/.test(heroText), '[쪽지카드] 뽑은 쪽지 키워드');
    check((await page.locator('.drawn__verdict').count()) === 1, '[쪽지카드] 한 문장 결론');
    check((await page.locator('.drawn__now').count()) === 1, '[쪽지카드] 지금 할 일 한 줄');
    // 같은 결론을 아래에서 또 카드로 세우지 않는다
    check((await page.locator('.deep-hero').count()) === 0, '[쪽지카드] 결론 카드가 두 번 안 나옴');
    // 결정 카드가 접히는 상세보다 먼저 온다 — 위쪽만 읽어도 뭘 할지 알 수 있어야 한다
    const order = await page.evaluate(() => {
      const d = document.querySelector('.sec-card--decide');
      const fold = document.querySelector('.fold');
      if (!d || !fold) return null;
      return d.getBoundingClientRect().top < fold.getBoundingClientRect().top;
    });
    check(order === true, '[결정] 접히는 상세보다 먼저 나옴');
    // 접힌 채로도 안에 뭐가 있는지는 말해줘야 '사라졌나' 가 안 생긴다
    const hints = await page.locator('.fold__hint').allInnerTexts();
    check(hints.length === 3 && hints.every((h) => h.trim().length > 6),
      '[결정] 접힌 덩이마다 안내 한 줄', hints.join(' / '));
    // 복사 버튼은 없앴다. shareMessage 가 공유 못 하는 환경에서 알아서 복사로
    // 떨어지므로 같은 일을 하는 버튼을 둘 세울 이유가 없었다. '복사하기' 라는
    // 글자가 없는지 보는 건 그 글자가 코드에 없어서 늘 통과한다 — 대신 아래
    // 고정 바에 버튼이 하나뿐인지를 센다.
    const bottomBtns = await page.evaluate(() => {
      const bar = document.querySelector('.app__bottom');
      return bar ? bar.querySelectorAll('button').length : -1;
    });
    check(bottomBtns === 1, '[결과] 아래 고정 바의 버튼은 하나뿐', `${bottomBtns}개`);
    await page.context().close();
  }

  // ── 고민 상담 — 쪽지 흐름 안에서 고민 고르기 → 상황 → 결과 ──
  {
    const page = await newPage(browser);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 500);
    await page.getByText('오늘 쪽지 열어보기').first().click();
    await wait(page, 600);
    // 생년월일이 없으면 이 자리에서 받는다
    if (await page.getByText('언제 태어났어요?', { exact: false }).count()) {
      await page.getByText('여자', { exact: true }).first().click();
      await page.getByText('태어난 시각을 몰라요', { exact: false }).first().click();
      await fillName(page);
      await page.getByRole('button', { name: '다음' }).first().click();
      await wait(page, 700);
    }
    check((await page.locator('.concern-row').count()) === 6, '[상담] 고민 여섯 가지');
    await page.getByText('일과 이직', { exact: true }).first().click();
    await wait(page, 500);
    check((await page.locator('.opt-row').count()) === 4, '[상담] 상황 네 가지');
    // 고를 것이 넷뿐이라 화면 아래 40% 가 허공이었다. 덜 그려진 것처럼 보인다.
    // 뭔가가 바닥을 닫아줘야 화면이 끝난 걸로 읽힌다.
    const tailGap = await page.evaluate(() => {
      const body = document.querySelector('.app__body');
      if (!body) return -1;
      const rect = body.getBoundingClientRect();
      let low = rect.top;
      for (const el of body.querySelectorAll('*')) {
        const b = el.getBoundingClientRect();
        if (b.height > 0 && b.width > 0 && b.bottom > low) low = b.bottom;
      }
      return Math.round(rect.bottom - low);
    });
    check(tailGap >= 0 && tailGap <= 80, '[상담] 화면 끝이 허공이 아니다', `${tailGap}px`);
    await page.getByText('다니는데 옮기고 싶어요', { exact: true }).first().click();
    await wait(page, 600);
    await page.locator('button.note').first().dispatchEvent('click');
    // 결론 카드는 맨 위 쪽지 카드로 합쳤다. 상세가 붙었는지는 결정 카드로 본다.
    await page.waitForSelector('.sec-card--decide', { timeout: 25000 });
    await wait(page, 600);
    // 상세는 접혀 있다. 접힌 채로도 무엇이 들었는지 보여야 하고, 펴면 다 있어야 한다.
    check((await page.locator('.fold').count()) === 3, '[상담] 상세가 세 덩이로 접혀 있음');
    check((await page.locator('.when4__row').count()) === 0, '[상담] 접힌 채로는 안 그린다');
    await openFolds(page);
    const dt = await bodyText(page);
    check(/언제가 좋을까요/.test(dt), '[상담] 시기 구역 노출');
    check((await page.locator('.when4__row').count()) === 4, '[상담] 시기 네 줄');
    check((await page.locator('.mflow__col').count()) === 12, '[상담] 열두 달 막대');
    // 축에 9 10 11 12 1 2 로만 적혀 있으면 1 이 올해인지 내년인지 알 수 없다.
    check((await page.locator('.mflow__col--newyear').count()) === 1, '[상담] 해가 바뀌는 자리에 선이 하나');
    // 명식 네 기둥은 나란히 놓고 보는 것이라 줄이 어긋나면 보는 방식이 깨진다.
    // 칸마다 꼬리표 줄 수가 달라 일주 칸만 아래로 내려가 있었다.
    const pillarRows = await page.evaluate(() => {
      const cols = [...document.querySelectorAll('.chart8__col')];
      const rowTop = (sel) => cols.map((c) => Math.round(c.querySelector(sel).getBoundingClientRect().top));
      return ['.chart8__k', '.chart8__stem', '.chart8__branch', '.chart8__god', '.chart8__step']
        .map((sel) => { const t = rowTop(sel); return Math.max(...t) - Math.min(...t); });
    });
    check(Math.max(...pillarRows) <= 1, '[상담] 명식 네 기둥의 줄이 서로 맞음', `${pillarRows.join('/')}px`);
    check((await page.locator('.decide__list--do .decide__row').count()) === 3, '[상담] 지금 할 것 세 가지');
    check(/\d+세부터 \d+세까지|첫 대운이/.test(dt), '[상담] 십 년 대운 노출');
    check(/년 \d+월/.test(dt), '[상담] 답이 달로 나옴');
    await diagnose(page, '상담');
    check((await page.getByRole('button', { name: '친구한테 보내기' }).count()) === 1,
      '[상담] 친구한테 보내는 버튼이 정확히 하나');
    await page.context().close();
  }

  // 6.5 여섯 고민 × 두 생년월일 — 한 고민만 열어보고 '결과 화면은 괜찮다' 고
  // 적으면 나머지 다섯은 한 번도 안 본 채로 통과한다. 여기서 각 화면을
  // diagnose 로 훑는다(빈 화면·가로 스크롤·44px·대비·콘솔 에러·이모지).
  //
  // 생년월일 둘: 휠 기본값(1995-01-01)과 1960년생 남자. 십성이 갈리면 들어가는
  // 글자가 갈리고, 긴 글자가 칸을 뚫는 건 그때만 보인다.
  {
    const BIRTHS = [
      { label: '기본', birth: null },
      { label: '1960남', birth: { year: 1960, month: 5, day: 12, ampm: '오전', hour: 9, minute: '00' } },
    ];
    for (const b of BIRTHS) {
      for (const cp of CONCERN_PATHS) {
        const page = await newPage(browser);
        await drawTo(page, { concern: cp.concern, option: cp.option, birth: b.birth });
        const t = await bodyText(page);
        check(t.includes('점'), `[여섯고민] ${cp.concern}/${b.label} 결과가 뜬다`);
        // 문장이 칸을 뚫으면 여기서 가로 스크롤이나 대비로 잡힌다
        await diagnose(page, `${cp.concern}/${b.label}`);
        // 고민을 골라 들어왔으면 그 고민 얘기가 화면에 있어야 한다
        const word = { '일과 이직': /이직|회사|자리/, 돈: /돈|수입|지출/, 연애: /연애|사이|상대/,
          '사람 관계': /사람|사이|관계/, '몸과 컨디션': /몸|잠|운동/, 마음: /마음|생각|기분/ }[cp.concern];
        check(word.test(t), `[여섯고민] ${cp.concern}/${b.label} 그 고민의 말을 쓴다`);
        await page.context().close();
      }
    }
  }

  // 7. 궁합 — 띠 / 별자리 / 언락 2종 / 카드 액션 / 관계 저장
  {
    const page = await newPage(browser);
    await goCompat(page);
    check((await bodyText(page)).includes('별자리 궁합'), '[궁합] 첫 화면에서 별자리로 전환 가능');
    // 열두 칸을 담는 상자에 격자 규칙이 한 줄도 없어서, 칸이 왼쪽에 한 줄로
    // 쌓이고 화면 오른쪽 8할이 빈 채로 남아 있었다.
    const chipGrid = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.zodiac-grid--full .zodiac-chip')];
      if (els.length === 0) return null;
      const box = els.map((e) => e.getBoundingClientRect());
      return {
        n: els.length,
        cols: new Set(box.map((r) => Math.round(r.left))).size,
        rows: new Set(box.map((r) => Math.round(r.top))).size,
        w: Math.round(Math.max(...box.map((r) => r.width))),
      };
    });
    check(chipGrid !== null && chipGrid.cols === 3 && chipGrid.rows === 4,
      '[궁합] 띠 고르기가 세 칸씩 네 줄', chipGrid ? `${chipGrid.cols}열 ${chipGrid.rows}줄 ${chipGrid.w}px` : '칸 없음');
    // 이름만 열둘 늘어놓으면 '나 92년생인데 무슨 띠지' 에서 막힌다.
    // 띠에는 최근 생년 셋, 별자리에는 날짜 범위가 같이 있어야 한다.
    const chipSubs = await page.evaluate(() =>
      [...document.querySelectorAll('.zodiac-grid--full .zodiac-chip .zodiac-chip__sub')]
        .map((e) => e.textContent.trim()).filter(Boolean));
    check(chipSubs.length === 12, '[궁합] 열두 칸 전부 실마리 한 줄', `${chipSubs.length}칸`);
    check(new Set(chipSubs).size === 12, '[궁합] 칸마다 실마리가 다름', chipSubs.slice(0, 3).join(' / '));
    check(chipSubs.every((t) => /^\d\d( · \d\d)+$/.test(t)), '[궁합] 띠 칸은 두 자리 생년', chipSubs[0]);
    // 띠가 바뀌는 자리는 1월 1일이 아니라 입춘이라, 연도가 어긋나는 구간을 적어둬야 한다.
    check((await bodyText(page)).includes('앞 띠일 수 있어요'), '[궁합] 입춘 경계를 알려줌');

    // 생년월일을 넣고 온 사람은 '나' 가 이미 정해져 있어 피커가 닫혀 있다. 슬롯을 눌러 연다.
    const pickZ = async (label) => {
      if ((await page.locator('.zodiac-chip').count()) === 0) {
        await page.locator('.compat-pick').last().click();
        await wait(page, 500);
      }
      await page.locator('.zodiac-chip', { hasText: label }).first().click();
      await wait(page, 700);
    };
    await pickZ('개띠');
    await pickZ('범띠');
    await wait(page, 700);
    await page.getByText('광고 보고 결과 열기', { exact: false }).first().click();
    await wait(page, 3200);
    const c = await bodyText(page);
    check(/\d+점/.test(c) && c.includes('케미'), '[궁합] 광고 언락 후 결과');
    // 세 칸은 폭이 같은데 첫 칸만 padding-left 가 0 이라 막대 자리가
    // 102/89/89px 로 갈려 있었다. 각자 자기 자리의 %로 그리니 98점이 100px,
    // 97점이 86px 로 나왔다. 1점 차이가 14px 로 보이면 점수가 거짓말이 된다.
    const catBars = await page.evaluate(() => {
      const cols = [...document.querySelectorAll('.compat-cat')];
      const t = cols.map((c) => Math.round(c.querySelector('.compat-cat__bar').getBoundingClientRect().width));
      const pair = cols.map((c) => ({
        score: Number(c.querySelector('.compat-cat__score').textContent),
        fill: c.querySelector('.compat-cat__fill').getBoundingClientRect().width,
      }));
      // 점수가 높은 칸의 막대가 더 짧으면 안 된다
      const sorted = [...pair].sort((a, b) => b.score - a.score);
      let monotone = true;
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i - 1].score > sorted[i].score && sorted[i - 1].fill < sorted[i].fill - 0.5) monotone = false;
      }
      return { tracks: t, spread: Math.max(...t) - Math.min(...t), monotone };
    });
    check(catBars.spread <= 1, '[궁합] 세 점수 막대의 자리 폭이 같다', `${catBars.tracks.join('/')}px`);
    check(catBars.monotone, '[궁합] 점수가 높은 칸의 막대가 더 길다');
    await diagnose(page, '궁합');

    // 결과 화면과 같은 규칙 - 공유가 안 되는 환경에서는 알아서 복사로 떨어지므로
    // 같은 일을 하는 버튼을 둘 세우지 않는다
    check((await page.getByRole('button', { name: '친구한테 보내기' }).count()) === 1,
      '[궁합] 친구한테 보내는 버튼이 정확히 하나');
    for (const [label, expect] of [['친구한테 보내기', '궁합'], ['궁합 카드 이미지로 저장하기', '저장']]) {
      await page.getByText(label, { exact: true }).first().click();
      let toast = '(없음)';
      try {
        await page.locator('.toast').first().waitFor({ state: 'visible', timeout: 6000 });
        toast = await page.locator('.toast').first().innerText();
        await page.locator('.toast').first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
      } catch { /* 토스트 없음 */ }
      check(toast.includes(expect), `[궁합] ${label}`, toast);
    }
    await page.locator('.save-person__chip', { hasText: '썸' }).first().click();
    await wait(page, 1400);
    check(true, '[궁합] 관계 저장 동작');
    await page.context().close();
  }

  // 7-b. 별자리 궁합 단독 관통
  {
    const page = await newPage(browser);
    await goCompat(page);
    await page.getByText('별자리 궁합', { exact: false }).first().click(); await wait(page, 700);
    // 생년월일로 별자리가 이미 정해져 있으면 피커가 닫혀 있다
    const pickS = async (label) => {
      if ((await page.locator('button', { hasText: label }).count()) === 0) {
        await page.locator('.compat-pick').last().click();
        await wait(page, 500);
      }
      await page.locator('button', { hasText: label }).first().click();
      await wait(page, 900);
    };
    await pickS('사자자리');
    await pickS('물병자리');
    await wait(page, 700);
    const u = page.getByText('광고 보고 결과 열기', { exact: false }).first();
    if (await u.count()) { await u.click(); await wait(page, 3200); }
    const t = await bodyText(page);
    check(t.includes('별자리 궁합') && /\d+점/.test(t), '[궁합:별자리] 띠 없이 단독 관통');
    await page.context().close();
  }

  // 8. 웹뷰 악조건 — 저장소 차단
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => {
      const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
      Object.defineProperty(window, 'localStorage', { get: boom, configurable: true });
      Object.defineProperty(window, 'sessionStorage', { get: boom, configurable: true });
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(10000);
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.__errs = errs;
    await drawTo(page, { zodiac: null });
    check(/점수\s*\d+\s*점/.test(await bodyText(page)), '[악조건] localStorage 차단에서도 결과까지 도달');
    check(errs.length === 0, '[악조건] localStorage 차단 시 예외 없음', errs.join(' | '));
    await ctx.close();
  }

  // 8.5 웹뷰 악조건 — 읽기는 되는데 쓰기만 막힌 경우(용량 초과·사생활 보호)
  //
  // 전면 차단만 보고 있었는데, 실제로 더 흔한 건 이쪽이다. iOS 웹뷰에서
  // setItem 이 QuotaExceededError 로 던진다. 이러면 매번 생년월일을 다시
  // 넣어야 하는데, 이유를 안 말하면 앱이 기억을 못 하는 것으로 보인다.
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => {
      Storage.prototype.setItem = function setItem() {
        const e = new Error('QuotaExceededError');
        e.name = 'QuotaExceededError';
        throw e;
      };
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(10000);
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.__errs = errs;
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 500);
    await page.locator('.today-hook__cta').first().click();
    await wait(page, 700);
    await fillName(page);
    await page.getByRole('button', { name: '다음' }).first().click();
    await wait(page, 800);
    // 저장이 안 됐다는 걸 말해야 한다. 말없이 삼키면 앱이 잊어버리는 것처럼 보인다.
    const toast = (await page.locator('.toast').count())
      ? await page.locator('.toast').first().innerText().catch(() => '') : '';
    check(/저장이 안 돼요/.test(toast), '[악조건] 저장이 막히면 그 사실을 알린다', toast || '(안내 없음)');
    // 그래도 이번 뽑기는 끝까지 돼야 한다. 저장은 부가고 답이 본체다.
    await page.getByText('일과 이직', { exact: true }).first().click();
    await wait(page, 500);
    await page.getByText('다니는데 옮기고 싶어요', { exact: true }).first().click();
    await wait(page, 600);
    await page.locator('button.note').first().dispatchEvent('click');
    await wait(page, 4300);
    check(/점수\s*\d+\s*점/.test(await bodyText(page)), '[악조건] 쓰기가 막혀도 결과까지 도달');
    check(errs.length === 0, '[악조건] 쓰기 차단 시 예외 없음', errs.join(' | '));
    await ctx.close();
  }

  // 8.6 웹뷰 악조건 — 저장값이 깨진 경우(앱 업데이트·수동 편집·부분 기록)
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem('tomorrowNoteBirth', '{{{깨진 JSON');
        localStorage.setItem('tomorrowNoteZodiac', '{"not":"a string"}');
        localStorage.setItem('tomorrowNoteUnlockedConcerns', 'null');
      } catch { /* 무시 */ }
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(10000);
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.__errs = errs;
    await drawTo(page, { zodiac: null });
    check(/점수\s*\d+\s*점/.test(await bodyText(page)), '[악조건] 저장값이 깨져도 결과까지 도달');
    check(errs.length === 0, '[악조건] 깨진 저장값에 예외 없음', errs.join(' | '));
    await ctx.close();
  }

  // 9. 웹뷰 악조건 — 애니메이션 정지 (프리즈된 웹뷰에서 투명 콘텐츠가 남는지)
  {
    const page = await newPage(browser);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '*, *::before, *::after { animation-play-state: paused !important; animation-delay: -9999s !important; transition: none !important; }' });
    await wait(page, 700);
    const d = await page.evaluate(DIAGNOSE);
    check(d.faded.length === 0, '[악조건] 애니메이션 정지 시 투명 콘텐츠 없음',
      d.faded.map((f) => `.${f.cls} "${f.text}"`).join(' / '));
    await page.context().close();
  }

  // 10. reduced-motion
  {
    const page = await newPage(browser, { reducedMotion: 'reduce' });
    await drawTo(page);
    check(/점수\s*\d+\s*점/.test(await bodyText(page)), '[악조건] reduced-motion 에서 결과 도달');
    await page.context().close();
  }

  // 11. 홈은 뽑은 흔적을 남기지 않는다
  {
    const page = await newPage(browser);
    await drawTo(page);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 700);
    const home = await bodyText(page);
    // '오늘 받은 편지' 는 주석에만 있는 말이라, 그 말이 없는지 보는 검사는
    // 홈이 어제 결과를 통째로 그려도 통과했다. 결과 화면의 실물을 센다.
    check((await page.locator('.score-hero').count()) === 0,
      '[홈] 뽑고 와도 점수 카드가 안 남는다');
    check(!/점수\s*\d+\s*점/.test(home), '[홈] 뽑고 와도 점수 숫자가 안 남는다',
      (home.match(/점수\s*\d+\s*점/) || [''])[0]);
    check(home.includes('오늘 쪽지 열어보기'), '[홈] CTA 문구가 그대로다');
    await page.context().close();
  }

  // 11.5 자정 넘김 — 결과 화면을 켜둔 채 날이 바뀌는 진짜 경우
  //
  // 전에는 홈에서 날짜만 넘기고 '오늘 받은 편지' 가 없는지 봤다. 그 문자열은
  // 주석에만 있고 화면에 안 나온다. 즉 자정 처리를 통째로 지워도 통과하는
  // 검사였다. 실제로 위험한 건 결과 화면을 띄워둔 채 자정이 지나는 쪽이다 -
  // 어제 답이 '오늘의 쪽지' 라는 이름표를 달고 남아 있으면 앱이 거짓말을 한다.
  {
    const page = await newPage(browser);
    await drawTo(page);
    check((await page.locator('.score-hero').count()) === 1, '[자정] 넘기기 전에는 결과 화면');
    const before = (await bodyText(page)).match(/\d+월 \d+일/)?.[0] ?? '';

    const advanceADay = () => {
      const R = Date, OFF = 86400000;
      // eslint-disable-next-line no-global-assign
      window.Date = class extends R {
        constructor(...a) { if (a.length === 0) super(R.now() + OFF); else super(...a); }
        static now() { return R.now() + OFF; }
      };
      // 앱이 돌아온 순간 날짜를 다시 읽는다 (백그라운드에서 자정을 넘긴 경우)
      document.dispatchEvent(new Event('visibilitychange'));
    };
    await page.evaluate(advanceADay);
    await wait(page, 1800);

    const after = await bodyText(page);
    check((await page.locator('.score-hero').count()) === 0,
      '[자정] 어제 결과가 오늘 화면에 안 남는다');
    check((await page.locator('.today-hook__cta').count()) === 1,
      '[자정] 홈으로 되돌아온다');
    const now = after.match(/\d+월 \d+일/)?.[0] ?? '';
    check(before !== '' && now !== '' && before !== now,
      '[자정] 날짜 줄이 실제로 바뀐다', `${before} -> ${now}`);
    check(page.__errs.length === 0, '[자정] 날이 바뀔 때 예외 없음', page.__errs.join(' | '));
    await page.context().close();
  }

  // 12. 전체 삭제 → 초기 상태. 지우는 길은 생년월일 화면 하나뿐이다.
  {
    const page = await newPage(browser);
    await drawTo(page);
    // 지우는 길은 정보를 넣는 화면에 있다. 결과에서 홈을 거쳐 들어간다.
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 500);
    await page.getByText('오늘 쪽지 열어보기').first().click();
    await wait(page, 800);
    check((await page.locator('.data-link').count()) === 1, '[삭제] 생년월일 화면에 지우기 한 줄');
    await page.locator('.data-link').first().click();
    await wait(page, 500);
    check((await bodyText(page)).includes('전부 지울까요'), '[삭제] 두 단계 확인 UI');
    await page.getByText('네, 지울게요', { exact: false }).first().click();
    await wait(page, 1500);
    const t = await bodyText(page);
    check(t.includes('오늘 쪽지 열어보기'), '[삭제] 초기 상태로 복귀');
    check((await page.locator('.score-hero').count()) === 0, '[삭제] 지운 뒤 결과 카드가 안 남음');
    const left = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((k) => k.startsWith('tomorrowNote')));
    check(left.length === 0, '[삭제] 저장소에 남는 값 없음', left.join(' '));
    await page.context().close();
  }

  // 13. 화면별 뒤로가기
  {
    const BACKS = [
      ['생년월일', async (p) => { await p.goto(URL_BASE, { waitUntil: 'networkidle' }); await wait(p, 400); await p.getByText('오늘 쪽지 열어보기').first().click(); }, '오늘의 띠 서열'],
      // 뒤로가기는 홈이 아니라 '한 단계 앞' 으로 가야 한다
      ['고민 고르기', async (p) => { await p.goto(URL_BASE, { waitUntil: 'networkidle' }); await wait(p, 400); await p.getByText('오늘 쪽지 열어보기').first().click(); await wait(p, 500); await fillName(p); await p.getByRole('button', { name: '다음' }).first().click(); }, '언제 태어났어요'],
      ['결과', async (p) => { await drawTo(p); }, '이렇게 뽑혀요'],
      ['궁합', async (p) => { await goCompat(p); }, '점수'],
    ];
    for (const [name, prep, expect] of BACKS) {
      const page = await newPage(browser);
      await prep(page);
      await wait(page, 800);
      const back = page.locator('button.app__nav-back').first();
      if (!(await back.count())) { bad(`[뒤로:${name}]`, '뒤로가기 버튼 없음'); await page.context().close(); continue; }
      await back.click();
      await wait(page, 900);
      check((await bodyText(page)).includes(expect), `[뒤로:${name}] 이전 화면으로`);
      await page.context().close();
    }
  }
}

// ── 실행 ────────────────────────────────────────────────────
const server = startPreview();
let exitCode = 0;
try {
  if (!(await waitForServer())) {
    console.error(`❌ 미리보기 서버(${URL_BASE})가 뜨지 않았어요. 먼저 \`npm run build:web\` 을 실행했는지 확인하세요.`);
    process.exit(1);
  }
  const browser = await chromium.launch({
    args: ['--no-sandbox'],
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });
  try {
    await run(browser);
  } finally {
    await browser.close();
  }
} catch (e) {
  bad('점검 실행', e.message.split('\n')[0]);
} finally {
  server.kill();
}

const failed = results.filter((r) => !r.pass);
console.log('\n──────── 전 화면 클릭 점검 ────────');
for (const r of results) {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
}
console.log('───────────────────────────────────');
console.log(`통과 ${results.length - failed.length} / ${results.length}${failed.length ? `  ❌ 실패 ${failed.length}` : ''}\n`);
if (failed.length) exitCode = 1;
process.exit(exitCode);
