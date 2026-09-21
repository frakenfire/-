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
// lucky4__swatch 는 '오늘 빛깔' 칸에 그 빛깔 자체를 칠해 보여주는 자리다.
// 색이 곧 내용이라 규칙에서 뺀다. 나무 기운이면 초록, 불 기운이면 빨강이
// 나오는데, 빛깔이 초록이라고 말해놓고 초록을 안 보여줄 수는 없다.
// 좋고 나쁨을 색으로 말하지 말라는 규칙이지, 색을 보여주지 말라는 게 아니다.
const RED_ALLOWED = ['btn--danger', 'lucky4__swatch'];
const GREEN_ALLOWED = ['lucky4__swatch'];
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
const JARGON = /일진|십신|신강|신약|용신|오행|비화|삼합|육합|상충|상형|원진|자형|상파|상생|상극|총운|중길|대길|소길|개운 (컬러|색)|비견|겁재|식신|편재|정재|편관|정관|편인|정인|천간|사주팔자|입춘|만세력|대운|절기/;
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

  // 입력 폼의 리듬 — 이름표는 한 글자, 칸 사이는 한 간격.
  //
  // 생년월일 화면에서 이름표가 13px 셋과 12px 둘로 갈려 있었고, 칸 사이가
  // 28 / 27 / 12 / 11 로 오갔다. 게다가 휠 덩이 둘 사이에만 가로줄이 하나
  // 있어서 다섯 칸 중 둘만 한 묶음처럼 보였다. 아무도 그렇게 정한 적이 없고,
  // .field 와 .wheel-group 이 각자 간격을 들고 있어서 그냥 그렇게 된 것이다.
  out.formLabels = [...new Set([...document.querySelectorAll('.field__k, .wheel-group__k')]
    .map((el) => { const c = getComputedStyle(el); return `${c.fontSize}/${c.lineHeight}/${c.fontWeight}`; }))];
  out.formGaps = [];
  {
    const form = document.querySelector('.birth-form');
    const kids = form ? [...form.children].filter((el) => el.getBoundingClientRect().height > 1) : [];
    for (let i = 1; i < kids.length; i += 1) {
      const a = kids[i - 1].getBoundingClientRect();
      const b = kids[i].getBoundingClientRect();
      out.formGaps.push(Math.round(b.top - a.bottom));
    }
  }

  // 나란히 선 흰 카드 사이는 한 간격이다.
  //
  // 이번 주 카드가 제 모양을 따로 들고 있었다 - 위 여백 14px(옆 카드들은 28px)에
  // 안쪽 여백 18px(옆 카드들은 22/20/20). 같은 물건을 두 벌의 숫자로 그리면
  // 반드시 갈린다. 카드와 카드 사이만 본다 - 히어로 다음이나 구역 제목 다음은
  // 일부러 더 띄우는 자리라 여기서 세지 않는다.
  out.cardGaps = [];
  out.cardPads = [];
  {
    const body = document.querySelector('.app__body');
    const kids = body ? [...body.children].filter((el) => el.getBoundingClientRect().height > 1) : [];
    for (let i = 1; i < kids.length; i += 1) {
      const a = kids[i - 1], b = kids[i];
      if (!a.classList.contains('sec-card') || !b.classList.contains('sec-card')) continue;
      out.cardGaps.push(Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom));
    }
    for (const el of kids.filter((e) => e.classList.contains('sec-card'))) {
      const c = getComputedStyle(el);
      out.cardPads.push(`${c.paddingTop} ${c.paddingRight} ${c.paddingBottom} ${c.paddingLeft}`);
    }
    out.cardPads = [...new Set(out.cardPads)];
  }

  // 종결형이 이어지는가.
  //
  // '종결형 반복' 은 오래 남은 숙제였는데, 재보니 생각보다 나았다 - 결과 화면
  // 문장 108개에서 제일 흔한 끝(예요)이 20%, 같은 끝이 잇달아 나온 최장이 3번,
  // 그마저 가운데 한 줄은 제목이었다. 고칠 게 아니라 지킬 것이었다.
  // 화면에 실제로 그려진 차례대로 세서, 넷이 잇달으면 빨개지게 둔다.
  {
    const SENT = /[가-힣]{2}요[.!?]?$/;
    const ends = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const own = [...el.childNodes].filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim()).filter(Boolean).join(' ');
      if (!own) continue;
      for (const raw of own.split(/(?<=[.!?])\s+/)) {
        const t = raw.trim();
        if (t.length >= 6 && SENT.test(t)) ends.push(t.replace(/[.!?]$/, '').slice(-2));
      }
    }
    let best = ends.length ? 1 : 0;
    let cur = 1;
    let worst = '';
    for (let i = 1; i < ends.length; i += 1) {
      if (ends[i] === ends[i - 1]) { cur += 1; if (cur > best) { best = cur; worst = ends[i]; } } else cur = 1;
    }
    const count = new Map();
    for (const e of ends) count.set(e, (count.get(e) ?? 0) + 1);
    const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['-', 0];
    out.endings = { n: ends.length, run: best, runWord: worst, top: top[0], topShare: ends.length ? Math.round((top[1] / ends.length) * 100) : 0 };
  }

  // 카드 제목은 한 벌이다.
  //
  // 결과 화면을 재보니 17px(행운) / 18px(나머지 여섯) / 20px(이번 주) 세 가지였다.
  // 17px 은 아래에서 18px 로 덮어써서 절반이 처음부터 일을 안 하고 있었고,
  // 20px 은 이번 주 카드를 .sec--card 에서 .sec-card 로 옮기면서 바탕값이
  // 드러난 것이다. 카드 간격과 여백은 재면서 제목 크기는 안 재고 있었다.
  out.cardTitles = [...new Set([...document.querySelectorAll('.sec-card')]
    .map((el) => el.querySelector('.cat4__head, .sec__title, .lucky4__head'))
    .filter(Boolean)
    .map((t) => { const c = getComputedStyle(t); return `${c.fontSize}/${c.lineHeight}/${c.fontWeight}`; }))];

  // 같은 자리에 있는 같은 말은 같은 색이어야 한다.
  //
  // 홈의 띠 서열이 색을 점수(tone)에서 가져오는 바람에, 4위와 9위가 똑같이
  // '무난한 사이' 인데 하나는 파랑 하나는 회색으로 나왔다. 다섯 줄만 보여주던
  // 동안에는 9위가 화면에 없어서 아무도 몰랐다. 같은 클래스에 같은 글자면
  // 같은 색으로 그려져야 한다 - 다르면 읽는 사람은 둘을 다른 것으로 읽는다.
  {
    const seen = new Map();
    for (const el of document.querySelectorAll('body *')) {
      // 이름 전체로 묶으면 못 잡는다. 이 결함이 바로 그랬다 - 4위는
      // rank-row__tone--good, 9위는 --steady 라 이름이 달라서 서로 다른 칸으로
      // 세어졌다. 변종을 가르는 게 아니라 한 덩이로 봐야 색이 갈린 게 보인다.
      const full = typeof el.className === 'string' ? el.className.trim() : '';
      const cls = full.split(' ')[0];
      if (!cls) continue;
      const own = [...el.childNodes].filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim()).filter(Boolean).join(' ');
      if (!own) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(el);
      const key = `${cls}|${own}`;
      const look = `${cs.color}/${cs.fontWeight}`;
      if (!seen.has(key)) seen.set(key, new Set());
      seen.get(key).add(look);
    }
    out.twoFaced = [...seen.entries()].filter(([, v]) => v.size > 1)
      .map(([k, v]) => `${k.split('|')[1]} (${[...v].join(' vs ')})`);
    out.twoFacedSeen = seen.size;
  }

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
  // 11) 입력 폼의 이름표는 한 글자, 칸 사이는 한 간격 (폼이 없는 화면은 0가지로 지나간다)
  const gapSpread = data.formGaps.length ? Math.max(...data.formGaps) - Math.min(...data.formGaps) : 0;
  const formOk = data.formLabels.length <= 1 && gapSpread <= 2;
  check(formOk, `[${name}] 입력 폼의 이름표와 간격이 한 벌`,
    formOk ? `이름표 ${data.formLabels.length}가지 / 칸 사이 ${data.formGaps.join('·') || '없음'}`
      : `이름표 ${data.formLabels.join(' · ')} / 칸 사이 ${data.formGaps.join('·')}`);

  // 12) 나란히 선 카드 사이는 한 간격, 안쪽 여백도 한 벌 (카드가 없는 화면은 0쌍으로 지나간다)
  const cardSpread = data.cardGaps.length ? Math.max(...data.cardGaps) - Math.min(...data.cardGaps) : 0;
  const cardOk = cardSpread <= 2 && data.cardPads.length <= 1;
  check(cardOk, `[${name}] 나란한 카드가 한 간격·한 여백`,
    cardOk ? `카드 사이 ${data.cardGaps.join('·') || '없음'} / 안쪽 ${data.cardPads[0] ?? '없음'}`
      : `카드 사이 ${data.cardGaps.join('·')} / 안쪽 ${data.cardPads.join(' · ')}`);

  // 13) 같은 종결형이 넷 잇달지 않는가 (문장이 열 미만이면 비율은 안 본다)
  const e = data.endings;
  const endOk = e.run <= 3 && (e.n < 10 || e.topShare <= 35);
  check(endOk, `[${name}] 말끝이 이어지지 않음`,
    `문장 ${e.n} · 최장연속 ${e.run}${e.runWord ? `(${e.runWord})` : ''} · 1위 ${e.top} ${e.topShare}%`);

  // 14) 카드 제목이 한 벌인가 (카드가 없는 화면은 0가지로 지나간다)
  check(data.cardTitles.length <= 1, `[${name}] 카드 제목이 한 벌`,
    data.cardTitles.length <= 1 ? `제목 ${data.cardTitles.length}가지${data.cardTitles[0] ? ` (${data.cardTitles[0]})` : ''}`
      : data.cardTitles.join(' · '));

  // 15) 같은 클래스에 같은 글자면 같은 색으로 그려지는가
  check(data.twoFaced.length === 0, `[${name}] 같은 말이 두 얼굴로 안 나옴`,
    data.twoFaced.length ? data.twoFaced.slice(0, 3).join(' / ') : `말 ${data.twoFacedSeen}가지 검사`);

  // 16) 점수 막대와 바로 옆 숫자가 같은 말을 하는가 (막대가 없는 화면은 0개로 지나간다)
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

  // 홈의 '이 답은 이렇게 나와요' 는 접혀 있다. 접힌 채로만 훑으면 그 안의
  // 여섯 문단은 한자도 이모지도 명리 용어도 한 번도 안 본 채로 지나간다.
  // 접었다고 검사에서 빠지면, 접는 순간 그 글은 아무도 안 보는 글이 된다.
  for (const b of await page.locator('.fold__head').all()) { await b.click(); await w(200); }
  await w(500);
  await grab('홈(원리 펼침)');

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
