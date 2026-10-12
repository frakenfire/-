#!/usr/bin/env node
// 스토어 미리보기용 화면 캡처 — 개발 서버(localhost:5173)를 폰 크기로 열어 흐름대로 찍는다.
//   node scripts/store-shots.mjs <출력폴더>
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] || 'store-shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const sleep = (ms) => page.waitForTimeout(ms);
const click = (text) => page.getByRole('button', { name: text }).first().click();

await page.goto('http://localhost:5173/');
await page.evaluate(() => localStorage.clear());
await page.reload();
await sleep(1200);
await page.screenshot({ path: `${out}/1-home.png` });

await click('오늘 쪽지 열어보기');
await sleep(600);
await page.getByPlaceholder('한글 이름').fill('김토스');
await click('여자');
await page.locator('button.btn--primary').click();
await sleep(800);
await page.screenshot({ path: `${out}/2-concern.png` });

await page.getByRole('button', { name: /연애/ }).first().click();
await sleep(700);
await page.getByRole('button', { name: /썸을 타는/ }).first().click();
await sleep(1500);
await page.screenshot({ path: `${out}/3-pick.png` });

await page.locator('.note-grid > *').first().click({ force: true });
await sleep(7000);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(500);
await page.screenshot({ path: `${out}/4-result-top.png` });

async function shotAt(selectorText, file) {
  const el = page.getByText(selectorText, { exact: false }).first();
  await el.scrollIntoViewIfNeeded();
  await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -16));
  await sleep(500);
  await page.screenshot({ path: `${out}/${file}` });
}
await shotAt('언제가 좋을까요', '5-when.png');
await shotAt('왜 ', '6-why.png').catch(() => {});
await shotAt('네 가지 나', '7-four.png').catch(() => {});

await browser.close();
console.log('done');
