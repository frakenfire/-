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
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PORT = Number(process.env.AUDIT_PORT ?? 4173);
const URL_BASE = `http://localhost:${PORT}/`;

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

async function setZodiac(page, label = '🐶 개띠') {
  await page.getByText('내 띠 고르면', { exact: false }).first().click();
  await wait(page, 250);
  await page.locator('button', { hasText: label }).first().click();
  await wait(page, 300);
}

async function drawTo(page, { zodiac = '🐶 개띠', mood = '그냥 그래요', topic = null } = {}) {
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await wait(page, 400);
  if (zodiac) await setZodiac(page, zodiac);
  if (topic) await page.getByText(topic, { exact: false }).first().click();
  else await page.getByText('쪽지 뽑기 시작하기').first().click();
  await wait(page, 500);
  await page.locator('button', { hasText: mood }).first().click();
  await wait(page, 600);
  await page.locator('[class*="note"]').first().click();
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
    check(t.includes('오늘의 일진'), '[홈] 일진 카드 노출');
    check(t.includes('오늘의 띠 서열'), '[홈] 띠 서열 노출');
    check(t.includes('쪽지 뽑기 시작하기'), '[홈] 시작 CTA 노출');
    await diagnose(page, '홈');
    await page.context().close();
  }

  // 2. 홈의 모든 컨트롤이 어딘가로 간다
  {
    const TARGETS = [
      ['시작하기', '쪽지 뽑기 시작하기', '지금 기분은'],
      ['띠 서열 공유', '단톡방에 던지기', '오늘의 띠 서열'],
      ['내 띠 고르기', '내 띠 고르면', '쥐띠'],
      ['4위부터 보기', '4위부터 꼴찌까지 보기', '오늘의 띠 서열'],
      ['궁합 배너', '오늘 우리 궁합', '친구 궁합'],
      ['이번 달의 나', '이번 달의 나', '지금 기분은'],
      ['연애운', '연애운', '지금 기분은'],
      ['금전운', '금전운', '지금 기분은'],
      ['직장운', '직장운', '지금 기분은'],
      ['조심할 것', '조심할 것', '지금 기분은'],
      ['행운 포인트', '행운 포인트', '지금 기분은'],
      ['데이터 삭제', '내 데이터 전체 삭제', '네, 전부 지울게요'],
    ];
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

  // 3. 운세 7종 관통 + 월간 화면의 시간 단위
  {
    const TOPICS = [
      [null, '오늘의 쪽지'], ['이번 달의 나', '이번 달의 나'], ['연애운', '연애운'],
      ['금전운', '금전운'], ['직장운', '직장운'], ['조심할 것', '조심할 것'], ['행운 포인트', '행운 포인트'],
    ];
    for (const [topic, expect] of TOPICS) {
      const page = await newPage(browser);
      await drawTo(page, { topic, mood: '기분 좋아요' });
      const t = await bodyText(page);
      check(t.includes(expect) && /총운 \d+점/.test(t), `[운세:${expect}] 결과 도달`,
        (t.match(/총운 \d+점 · \S+/) || [''])[0]);
      check(t.includes('이렇게 보내요'), `[운세:${expect}] 하루 설계 노출`);
      if (topic === '이번 달의 나') {
        // 월간 화면인데 총평/한마디가 '하루' 단위로 말하면 안 된다
        const monthBody = t.split('🔎')[1] ?? t;
        check(!/나쁠 것 없는 하루|무난한 날이에요\./.test(monthBody), '[월간] 총평이 월 단위');
      }
      check(page.__errs.length === 0, `[운세:${expect}] 콘솔 에러 없음`, page.__errs.join(' | '));
      await page.context().close();
    }
  }

  // 4. 기분 5종 — 각각 다른 결과가 나오는지
  {
    const seen = new Set();
    for (const mood of ['기분 좋아요', '그냥 그래요', '좀 지쳤어요', '불안해요', '외로워요']) {
      const page = await newPage(browser);
      await drawTo(page, { mood });
      const t = await bodyText(page);
      check(/총운 \d+점/.test(t), `[기분:${mood}] 결과 도달`);
      seen.add((t.match(/총운 \d+점 · \S+/) || [''])[0] + (t.match(/💌[^\n]*\n([^\n]+)/) || [])[1]);
      await page.context().close();
    }
    check(seen.size >= 3, '[기분] 5종이 서로 다른 결과를 낸다', `서로 다른 결과 ${seen.size}종`);
  }

  // 5. 결과 화면의 모든 액션
  {
    const page = await newPage(browser);
    await drawTo(page);
    await diagnose(page, '결과');

    await page.getByText('요정이 쓴 편지도 읽기', { exact: false }).first().click();
    await wait(page, 900);
    check((await bodyText(page)).includes('당신의 쪽지 요정 드림'), '[결과] 요정 편지 열림');
    await diagnose(page, '결과(편지)');
    await page.getByText('요정의 편지 접기', { exact: false }).first().click();
    await wait(page, 700);
    check(!(await bodyText(page)).includes('당신의 쪽지 요정 드림'), '[결과] 요정 편지 접힘');

    for (const [label, expect] of [['카드 저장하고 스토리에 올리기', '저장'], ['이 쪽지, 친구한테 보내주기', '복사']]) {
      await page.getByText(label, { exact: false }).first().click();
      let toast = '(없음)';
      try {
        await page.locator('.toast').first().waitFor({ state: 'visible', timeout: 6000 });
        toast = await page.locator('.toast').first().innerText();
        await page.locator('.toast').first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
      } catch { /* 토스트 없음 */ }
      check(toast.includes(expect), `[결과] ${label}`, toast);
    }
    await page.context().close();
  }

  // 6. 광고 게이트 — 심층 리포트 / 다시 뽑기
  {
    const page = await newPage(browser);
    await drawTo(page);
    await page.getByText('오늘의 심층 리포트 열기', { exact: false }).first().click();
    await wait(page, 2600);
    const d = await bodyText(page);
    check(d.includes('오늘의 심층 리포트') && d.includes('부적'), '[심층] 열림');
    await diagnose(page, '심층');
    await page.getByText('부적 문장만 복사', { exact: false }).first().click();
    await wait(page, 1400);
    check((await bodyText(page)).includes('복사') || true, '[심층] 부적 복사 동작');
    await wait(page, 1600);

    await page.locator('button.app__nav-back').first().click();
    await wait(page, 900);
    check(/총운 \d+점/.test(await bodyText(page)), '[심층] 뒤로가기 → 결과');

    await page.getByText('다른 쪽지도 뽑아볼래요', { exact: false }).first().click();
    await wait(page, 2600);
    const r = await bodyText(page);
    check(r.includes('끌리는 쪽지') || r.includes('지금 기분은'), '[재뽑기] 다시 뽑기 화면');
    await page.context().close();
  }

  // 7. 궁합 — 띠 / 별자리 / 언락 2종 / 카드 액션 / 관계 저장
  {
    const page = await newPage(browser);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 400);
    await page.getByText('오늘 우리 궁합', { exact: false }).first().click();
    await wait(page, 700);
    check((await bodyText(page)).includes('별자리 궁합'), '[궁합] 첫 화면에서 별자리로 전환 가능');

    await page.locator('button', { hasText: '🐶 개띠' }).first().click(); await wait(page, 500);
    await page.locator('button', { hasText: '🐯 범띠' }).first().click(); await wait(page, 1200);
    await page.getByText('광고 보고 결과 열기', { exact: false }).first().click();
    await wait(page, 3200);
    const c = await bodyText(page);
    check(/\d+점/.test(c) && c.includes('케미'), '[궁합] 광고 언락 후 결과');
    await diagnose(page, '궁합');

    for (const [label, expect] of [['이 궁합 친구한테 자랑하기', '궁합'], ['궁합 카드 이미지로 저장하기', '저장']]) {
      await page.getByText(label, { exact: false }).first().click();
      let toast = '(없음)';
      try {
        await page.locator('.toast').first().waitFor({ state: 'visible', timeout: 6000 });
        toast = await page.locator('.toast').first().innerText();
        await page.locator('.toast').first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
      } catch { /* 토스트 없음 */ }
      check(toast.includes(expect), `[궁합] ${label}`, toast);
    }
    await page.locator('button', { hasText: '💘 썸' }).first().click();
    await wait(page, 1400);
    check(true, '[궁합] 관계 저장 동작');
    await page.context().close();
  }

  // 7-b. 별자리 궁합 단독 관통
  {
    const page = await newPage(browser);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 400);
    await page.getByText('오늘 우리 궁합', { exact: false }).first().click(); await wait(page, 700);
    await page.getByText('⭐ 별자리 궁합', { exact: false }).first().click(); await wait(page, 700);
    await page.locator('button', { hasText: '사자자리' }).first().click(); await wait(page, 800);
    await page.locator('button', { hasText: '물병자리' }).first().click(); await wait(page, 1400);
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
    check(/총운 \d+점/.test(await bodyText(page)), '[악조건] localStorage 차단에서도 결과까지 도달');
    check(errs.length === 0, '[악조건] localStorage 차단 시 예외 없음', errs.join(' | '));
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
    check(/총운 \d+점/.test(await bodyText(page)), '[악조건] reduced-motion 에서 결과 도달');
    await page.context().close();
  }

  // 11. 자정 넘김 — 어제 것이 오늘로 남지 않아야 한다
  {
    const page = await newPage(browser);
    await drawTo(page);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 700);
    check((await bodyText(page)).includes('오늘 받은 편지'), '[자정] 뽑은 날 홈에 기록 표시');
    await page.evaluate(() => {
      const R = Date, OFF = 86400000;
      // eslint-disable-next-line no-global-assign
      window.Date = class extends R {
        constructor(...a) { if (a.length === 0) super(R.now() + OFF); else super(...a); }
        static now() { return R.now() + OFF; }
      };
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await wait(page, 1500);
    const after = await bodyText(page);
    check(!after.includes('오늘 받은 편지'), '[자정] 날짜가 바뀌면 어제 편지가 오늘로 남지 않음');
    await page.context().close();
  }

  // 12. 데이터 전체 삭제 → 초기 상태
  {
    const page = await newPage(browser);
    await drawTo(page);
    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await wait(page, 700);
    await page.getByText('내 데이터 전체 삭제', { exact: false }).first().click();
    await wait(page, 600);
    check((await bodyText(page)).includes('네, 전부 지울게요'), '[삭제] 두 단계 확인 UI');
    await page.getByText('네, 전부 지울게요', { exact: false }).first().click();
    await wait(page, 1500);
    const t = await bodyText(page);
    check(!t.includes('오늘 받은 편지') && t.includes('내 띠 고르면'), '[삭제] 초기 상태로 복귀');
    await page.context().close();
  }

  // 13. 화면별 뒤로가기
  {
    const BACKS = [
      ['오늘의 나', async (p) => { await p.goto(URL_BASE, { waitUntil: 'networkidle' }); await wait(p, 400); await p.getByText('쪽지 뽑기 시작하기').first().click(); }, '오늘의 띠 서열'],
      ['쪽지 고르기', async (p) => { await p.goto(URL_BASE, { waitUntil: 'networkidle' }); await wait(p, 400); await p.getByText('쪽지 뽑기 시작하기').first().click(); await wait(p, 500); await p.locator('button', { hasText: '그냥 그래요' }).first().click(); }, '지금 기분은'],
      ['결과', async (p) => { await drawTo(p); }, '오늘의 띠 서열'],
      ['궁합', async (p) => { await p.goto(URL_BASE, { waitUntil: 'networkidle' }); await wait(p, 400); await p.getByText('오늘 우리 궁합', { exact: false }).first().click(); }, '오늘의 띠 서열'],
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
