#!/usr/bin/env node
// 눈먼 검사 잡기 — audit.mjs 의 '무엇이 없다' 검사들이 정말 빨개질 수 있는지 본다.
//
// 왜 필요한가: 점검이 초록인 것과 점검이 일하고 있는 것은 다른 얘기다. 실제로
// 이 앱에서 '오늘 받은 편지가 안 남는다', '잠금 문구가 없다', '내 띠를 다시
// 묻지 않는다' 같은 검사들이 오래 초록이었는데, 그 문자열은 주석에만 있어서
// 자정 처리를 통째로 지워도 통과했다. 그래서 검사마다 그 검사가 잡겠다고 한
// 결함을 브라우저에서 직접 집어넣고, 같은 프로브가 다른 답을 내는지 센다.
//
//   npm run build:web && npm run check:vacuity
//
// verify 에는 넣지 않는다 - 매번 돌리기엔 느리고, 이건 '검사를 고칠 때 한 번'
// 돌리는 도구다. 새 부재 검사를 쓰면 여기에도 한 칸을 같이 넣는다.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const PORT = Number(process.env.VACUITY_PORT ?? 4399);
const BASE = `http://localhost:${PORT}/`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch {} await wait(300); }

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const out = [];
const trial = async (name, probe, inject, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(600);
  if (opts.before) await opts.before(page);
  const clean = await page.evaluate(probe);
  await page.evaluate(inject);
  await wait(300);
  const dirty = opts.reprobe
    ? await page.evaluate(() => [...document.querySelectorAll('.chap__body')]
        .map((b) => (b.innerText || '').trim().length))
    : await page.evaluate(probe);
  out.push({ name, clean: JSON.stringify(clean), dirty: JSON.stringify(dirty),
    proved: JSON.stringify(clean) !== JSON.stringify(dirty) });
  await ctx.close();
};

// 1) 홈: 시작 버튼을 가리는 것이 없다
const CTA_PROBE = () => {
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
  return { reach: !!top && cta.contains(top), veil: veil ? `덮개 ${veil.className || veil.tagName}` : '' };
};
await trial('[홈] 시작 버튼 가림', CTA_PROBE, () => {
  const d = document.createElement('div');
  d.className = 'fake-sheet';
  d.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99';
  document.body.appendChild(d);
});

// 2) 홈: 큰 버튼 하나 / 누르기 전 글자 수
const HOME_SHAPE = () => {
  const hook = document.querySelector('.today-hook');
  return { primary: document.querySelectorAll('.btn--primary').length,
    hookChars: hook ? (hook.innerText || '').replace(/\s+/g, '').length : -1 };
};
await trial('[사주] 홈 큰 버튼 하나', HOME_SHAPE, () => {
  const b = document.createElement('button');
  b.className = 'btn btn--primary'; b.textContent = '생년월일 입력하기';
  document.querySelector('.today-hook').appendChild(b);
});
await trial('[사주] 누르기 전 글자 수', HOME_SHAPE, () => {
  const p = document.createElement('p');
  p.textContent = '모두에게 같은 쪽지가 가지 않아요. 생년월일을 넣으면 쪽지가 달라져요. 오늘 하루를 미리 알고 움직여보세요.';
  document.querySelector('.today-hook').appendChild(p);
});


// ── 결과 화면까지 간 다음 보는 것들 ─────────────────────────
const drawTo = async (page) => {
  await page.locator('.today-hook__cta').first().click();
  await wait(700);
  if (await page.getByRole('button', { name: '다음' }).count()) {
    const box = page.locator('.field__input').first();
    if ((await box.count()) && (await box.inputValue()).trim().length < 2) { await box.fill('김한별'); await wait(200); }
    if ((await page.locator('.field .seg__btn--on').count()) === 0) {
      await page.getByRole('button', { name: '여자' }).first().click(); await wait(200);
    }
    await page.getByRole('button', { name: '다음' }).first().click(); await wait(700);
  }
  if (await page.getByText('요즘 뭐가 고민이에요?', { exact: false }).count()) {
    await page.getByText('일과 이직', { exact: true }).first().click(); await wait(500);
    await page.getByText('다니는데 옮기고 싶어요', { exact: true }).first().click(); await wait(700);
  }
  await page.locator('button.note').first().dispatchEvent('click');
  await wait(4300);
};

const RESULT_PROBE = () => ({
  share: [...document.querySelectorAll('button')].filter((b) => (b.innerText || '').trim() === '친구한테 보내기').length,
  bottomBtns: document.querySelector('.app__bottom') ? document.querySelector('.app__bottom').querySelectorAll('button').length : -1,
  dataLink: document.querySelectorAll('.data-link').length,
});
await trial('[결과] 공유 버튼 하나 / 아래 바 버튼 하나', RESULT_PROBE, () => {
  const b = document.createElement('button');
  b.textContent = '친구한테 보내기';
  document.querySelector('.app__bottom').appendChild(b);
}, { before: drawTo });
await trial('[사주] 결과에 지우기 줄이 안 따라옴', RESULT_PROBE, () => {
  const b = document.createElement('button');
  b.className = 'data-link'; b.textContent = '넣은 정보 전부 지우기';
  document.querySelector('.app__bottom').appendChild(b);
}, { before: drawTo });

// audit.mjs 가 실제로 쓰는 것과 같은 프로브여야 증명이 성립한다
const CHAP_PROBE = () =>
  [...document.querySelectorAll('.chap__body')].map((b) => (b.innerText || '').trim().length);
await trial('[광고] 본문 덩이가 그냥 보인다', CHAP_PROBE, () => {
  for (const b of document.querySelectorAll('.chap__body')) b.textContent = '광고를 보면 열려요';
}, { before: drawTo, reprobe: true });

const WEEK_PROBE = () => {
  const rows = [...document.querySelectorAll('.week-row')];
  const last = rows[rows.length - 1];
  if (!last) return { hit: false, veil: '칸 없음' };
  const r = last.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const veiled = rows.find((el) => {
    const cs = getComputedStyle(el);
    return cs.filter !== 'none' || parseFloat(cs.opacity) < 0.99;
  });
  return { hit: !!top && last.contains(top), veil: veiled ? '흐림/투명 처리됨' : '', n: rows.length };
};
await trial('[주간] 마지막 칸까지 덮개 없이 눌린다', WEEK_PROBE, () => {
  for (const el of document.querySelectorAll('.week-row')) el.style.filter = 'blur(4px)';
}, { before: async (page) => {
  await page.evaluate(() => window.localStorage.setItem('tomorrowNoteZodiac', 'rat'));
  await page.reload({ waitUntil: 'networkidle' }); await wait(400);
  await drawTo(page);
  await page.locator('.week-row').last().scrollIntoViewIfNeeded().catch(() => {});
  await wait(300);
} });

// 홈에 뽑은 흔적이 안 남는다
const HOME_TRACE = () => ({
  hero: document.querySelectorAll('.score-hero').length,
  score: /점수\s*\d+\s*점/.test(document.body.innerText),
});
await trial('[홈] 뽑고 와도 결과가 안 남는다', HOME_TRACE, () => {
  const d = document.createElement('div');
  d.className = 'score-hero'; d.textContent = '점수 73점';
  document.querySelector('.today-hook').after(d);
}, { before: async (page) => {
  await drawTo(page);
  await page.goto(BASE, { waitUntil: 'networkidle' }); await wait(700);
} });

// 띠는 생년월일에서 따서 채워 둔다 / 뽑는 동안 띠를 고르라고 묻지 않는다
const ZODIAC_PROBE = () => ({
  saved: window.localStorage.getItem('tomorrowNoteZodiac'),
  pickers: document.querySelectorAll('.zodiac-chip').length,
});
await trial('[사주] 띠는 생년월일에서 따서 채워 둔다', ZODIAC_PROBE, () => {
  window.localStorage.removeItem('tomorrowNoteZodiac');
}, { before: drawTo });

// ── design-audit 쪽 ─────────────────────────────────────────
// 여긴 프로브가 collect() 하나라, 그 함수를 design-audit.mjs 에서 그대로 떠다 쓴다.
// 손으로 베껴두면 본체가 바뀐 뒤에도 옛 프로브를 증명하게 된다.
const designSrc = readFileSync(new URL('./design-audit.mjs', import.meta.url), 'utf8');
const COLLECT = designSrc.slice(designSrc.indexOf('function collect()'), designSrc.indexOf('\nfunction auditScreen'));
const runCollect = `(() => { ${COLLECT}; return collect(); })()`;

const designTrial = async (name, pick, inject, before) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(600);
  if (before) await before(page);
  const clean = pick(await page.evaluate(runCollect));
  await page.evaluate(inject);
  await wait(300);
  const dirty = pick(await page.evaluate(runCollect));
  out.push({ name, clean: JSON.stringify(clean), dirty: JSON.stringify(dirty),
    proved: JSON.stringify(clean) !== JSON.stringify(dirty) });
  await ctx.close();
};

// 옛 점검은 TDS 초록·빨강 값을 손으로 적어둔 목록이라, 제일 옅은 두 값을 빠뜨렸다.
// 색상환 각도로 보는 지금 점검이 그 둘을 잡는지 본다.
const greenHits = (d) => d.colors.filter((c) => /174, 239, 213/.test(c.bg)).length;
await designTrial('[디자인] 옅은 초록 바탕을 잡는다', greenHits, () => {
  document.querySelector('.today-hook').style.background = 'rgb(174, 239, 213)';
});
const redHits = (d) => d.colors.filter((c) => /254, 175, 180/.test(c.bg)).length;
await designTrial('[디자인] 옅은 빨강 바탕을 잡는다', redHits, () => {
  document.querySelector('.today-hook').style.background = 'rgb(254, 175, 180)';
});

// 버튼 둘이 나란히 서는 자리는 삭제 확인 하나뿐이다. 붙여놓으면 잡히는가.
const stuckOf = (d) => ({ pairs: d.btnPairs, stuck: d.stuck });
await designTrial('[디자인] 나란한 버튼이 붙으면 잡는다', stuckOf, () => {
  const box = document.querySelector('.clear-ask__btns');
  box.style.gap = '0px';
}, async (page) => {
  // 지우기 줄은 넣어둔 정보가 있어야 나온다 - 한 번 뽑고 와야 보인다.
  await drawTo(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(600);
  await page.locator('.today-hook__cta').first().click();
  await wait(900);
  await page.locator('.data-link').first().click();
  await wait(500);
});

// 물어보는 동안 아래 바에 다른 큰 버튼이 없다
const ASK_PROBE = () => ({
  bottom: document.querySelectorAll('.app__bottom .btn').length,
  ask: document.querySelectorAll('.clear-ask__btns .btn').length,
});
await trial('[삭제] 물어보는 동안 다른 큰 버튼이 없다', ASK_PROBE, () => {
  const bar = document.createElement('div');
  bar.className = 'app__bottom';
  const b = document.createElement('button');
  b.className = 'btn btn--primary'; b.textContent = '다음';
  bar.appendChild(b);
  document.querySelector('.app').appendChild(bar);
}, { before: async (page) => {
  await drawTo(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(600);
  await page.locator('.today-hook__cta').first().click();
  await wait(900);
  await page.locator('.data-link').first().click();
  await wait(500);
} });

// 나란한 카드가 한 간격·한 여백
const CARD_PROBE = (d) => ({ gaps: d.cardGaps, pads: d.cardPads });
await designTrial('[디자인] 카드 하나만 다른 요리법이면 잡는다', CARD_PROBE, () => {
  const cards = [...document.querySelector('.app__body').children]
    .filter((el) => el.classList.contains('sec-card'));
  const victim = cards[cards.length - 1];
  victim.style.marginTop = '14px';
  victim.style.padding = '18px';
}, drawTo);

await browser.close();
srv.kill();

let bad = 0;
for (const r of out) {
  if (r.proved) console.log(`✅ ${r.name}  — ${r.clean} → ${r.dirty}`);
  else { bad += 1; console.log(`❌ ${r.name}  — 결함을 넣어도 그대로: ${r.clean}`); }
}
console.log('───────────────────────────────────');
if (bad) {
  console.log(`눈먼 검사 ${bad}개 / ${out.length}개`);
  process.exit(1);
}
console.log(`검사 ${out.length}개 전부 결함을 넣으면 빨개져요`);
