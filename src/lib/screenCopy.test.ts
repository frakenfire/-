import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { FAVOR_WORD } from '../data/concernFocus.ts';
import { withRo, withJosa } from './josa.ts';
import { CONCERN_GOD } from '../data/concernReadings.ts';
import { TEN_GOD_KO } from './tenGods.ts';
import { CONCERNS, findConcern, type ConcernKey } from '../data/concerns.ts';
import { todayAskOf } from '../data/todayVerdict.ts';

// 화면에 실제로 찍히는 글자를 사람이 읽듯 훑는 검사.
//
// 여기 있는 줄은 전부 한 번은 화면에 나가 있던 말이다. 앱을 눌러 보고
// 글자를 받아 적은 다음, 읽다가 걸린 자리를 하나씩 옮겨 놓았다.

const KEYS = CONCERNS.map((c) => c.key);

function dayKey(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
}

/** 생일 여럿 × 고민 여섯 × 열두 달 — 한 사람 한 날만 보면 갈래를 다 못 밟는다. */
function* everyRead() {
  const BIRTHS = [
    { year: 1992, month: 3, day: 3, hour: 20 },
    { year: 1988, month: 11, day: 27, hour: 7 },
    { year: 2001, month: 6, day: 14, hour: 13 },
  ];
  for (const input of BIRTHS) {
    const p = computeFourPillars(input);
    for (const k of KEYS as ConcernKey[]) {
      for (let m = 0; m < 12; m += 1) {
        const at = new Date(Date.UTC(2026, m, 15, 3));
        const t = computeTiming(input, p, 'female', k, at);
        yield { k, r: buildDeepRead(p, t, k, null, dayKey(at)) };
      }
    }
  }
}

const ALL = [...everyRead()];

test("'으로' 와 '로' 를 받침 보고 가른다", () => {
  assert.equal(withRo('자리와 규칙'), '자리와 규칙으로');
  assert.equal(withRo('거두는 자리'), '거두는 자리로');
  assert.equal(withRo('서울'), '서울로');
  assert.equal(withRo('돈'), '돈으로');
});

test('무엇을 보고 읽었는지가 고민마다 다른 말로 나온다', () => {
  // 한 벌을 여섯 고민에 돌려쓰면 '연애는 자리와 규칙으로 봐요' 가 나온다.
  //
  // 화면에 찍힌 줄만 맞대보면 안 잡힌다. 고민마다 보는 자리 묶음이 달라서,
  // 표를 통째로 돌려써도 나오는 글자는 서로 다르기 때문이다. 표를 직접 본다.
  const GROUPS = ['self', 'output', 'wealth', 'authority', 'support'] as const;
  for (const g of GROUPS) {
    const words = (KEYS as ConcernKey[]).map((k) => FAVOR_WORD[k][g]);
    assert.equal(new Set(words).size, 6, `${g}: 여섯 고민이 ${new Set(words).size}가지 말만 써요`);
  }
  // 그리고 그 말이 실제로 화면 줄에 실려 나가야 한다
  for (const { k, r } of ALL) {
    const head = withJosa(findConcern(k).label, '은는');
    assert.ok(r.chart.focus.startsWith(`${head} `), r.chart.focus);
    const body = r.chart.focus.slice(head.length + 1).split(' 봐요')[0];
    const mine = Object.values(FAVOR_WORD[k]);
    assert.ok(mine.some((w) => body.includes(w)), `${k}: 내 말이 아니에요 - ${body}`);
  }
});

test("'규칙로' 처럼 조사가 어긋난 자리가 없다", () => {
  // 받침 있는 글자 뒤에 바로 '로' 가 붙었으면 틀린 것이다 (ㄹ 받침은 뺀다).
  //
  // 솔직히 적어둔다: 지금 표의 값이 전부 '자리' 로 끝나서 이 줄이 잡을 게
  // 오늘은 없다. withRo 를 통째로 걷어내도 이 검사는 안 울린다. 받침으로
  // 끝나는 말을 표에 새로 넣는 날을 위한 덫이다. 조사 규칙 자체는 바로 위
  // withRo 검사가 지킨다 - 거기는 '규칙으로' 를 글자 그대로 맞대본다.
  const wrong = ALL.filter(({ r }) => {
    const m = r.chart.focus.match(/(.)로 봐요/);
    if (!m) return false;
    const code = m[1].charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return false;
    const batchim = code % 28;
    return batchim !== 0 && batchim !== 8;
  });
  assert.deepEqual([...new Set(wrong.map((w) => w.r.chart.focus))], [], '조사가 어긋났어요');
  assert.ok(ALL.every(({ r }) => / 봐요/.test(r.chart.focus)), '볼 자리가 아예 없어요');
});

test("큰 글자가 말하는 시점과 아래 표의 시점이 같다", () => {
  for (const { r } of ALL) {
    assert.ok(!/두어 달/.test(r.headline), `'두어 달' 이 남아 있어요: ${r.headline}`);
    assert.ok(!/\{when\}/.test(r.headline), `자리를 안 채웠어요: ${r.headline}`);
    const m = r.headline.match(/^(다음 달|(\d)달 뒤)에/);
    if (!m) continue;
    const said = m[2] ? Number(m[2]) : 1;
    // 화면 아래 '가장 좋은 때' 줄이 가리키는 달과 같아야 한다
    const best = r.when.find((x) => x.k === '가장 좋은 때');
    assert.ok(best, '가장 좋은 때 줄이 없어요');
    const shown = best!.v.includes('다음 달') ? 1
      : Number(best!.v.match(/(\d+)달 뒤/)?.[1] ?? 0);
    assert.equal(said, shown, `큰 글자는 ${said}달 뒤, 표는 '${best!.v}'`);
  }
});

test('점수 푸는 줄이 높은 칸을 나쁜 말로 설명하지 않는다', () => {
  // pull 은 좋고 나쁨이 없는 말이라 '가장 높아요' 뒤에 붙으면 뒤집힌다.
  for (const { k, r } of ALL) {
    const pulls = Object.values(CONCERN_GOD[k]).map((g) => g.pull);
    const hit = pulls.find((p) => r.scoreLine.includes(p));
    assert.equal(hit, undefined, `점수 줄에 pull 이 섞였어요: ${hit}`);
  }
});

test('점수 푸는 줄이 몇 점인지까지 말한다', () => {
  for (const { r } of ALL) {
    if (!/가장 높아요/.test(r.scoreLine)) continue;
    assert.ok(/\d+점으로 가장 높아요/.test(r.scoreLine), `점수가 빠졌어요: ${r.scoreLine}`);
    assert.ok(/가장 낮은 건 .+ \d+점이에요/.test(r.scoreLine), `낮은 칸이 빠졌어요: ${r.scoreLine}`);
  }
});

test('비어 있는 자리를 띠로 알려준다', () => {
  for (const { r } of ALL) {
    assert.ok(/띠와 .*띠 해가 비어 있어요/.test(r.chart.gongmang), r.chart.gongmang);
  }
});

test('오늘 글자를 간지 이름으로 들이밀지 않는다', () => {
  const GANZHI = /^[갑을병정무기경신임계][자축인묘진사오미신유술해]$/;
  for (const { r } of ALL) {
    assert.ok(!GANZHI.test(r.todayMeet.pillar), `간지 이름이 그대로예요: ${r.todayMeet.pillar}`);
    assert.ok(/띠$/.test(r.todayMeet.pillar), r.todayMeet.pillar);
  }
});

test('네 가지 나가 오늘을 맨 앞에 놓고 네 층을 다 보여준다', () => {
  for (const { r } of ALL) {
    assert.equal(r.selves.length, 4, '네 줄이 아니에요');
    // 매일 쪽지를 뽑는 앱이다. 오늘이 맨 위여야 한다.
    assert.deepEqual(r.selves.map((x) => x.k),
      ['오늘의 나', '가까운 미래의 나', '먼 미래의 나', '타고난 나']);
    // 타고난 나는 기준이라 견줄 대상이 없다. 나머지 셋은 반드시 견준다.
    assert.equal(r.selves[3].vs, null);
    for (const x of r.selves.slice(0, 3)) {
      assert.ok(x.vs && /타고난 것(보다 (높|낮)아요|과 비슷해요)$/.test(x.vs), `${x.k}: ${x.vs}`);
    }
    const part = (k: string) => r.score.parts.find((p) => p.k === k)!.score;
    assert.equal(r.selves[0].score, part('오늘'));
    assert.equal(r.selves[1].score, Math.round((part('올해') + part('이번 달')) / 2));
    assert.equal(r.selves[2].score, part('지금 지나는 십 년'));
    assert.equal(r.selves[3].score, part('타고난 구조'));
  }
});

test('타고난 것과 견주는 말이 실제 점수와 맞다', () => {
  for (const { r } of ALL) {
    const base = r.selves[3].score;
    for (const x of r.selves.slice(0, 3)) {
      const gap = x.score - base;
      const want = Math.abs(gap) <= 5 ? '타고난 것과 비슷해요'
        : gap > 0 ? '타고난 것보다 높아요' : '타고난 것보다 낮아요';
      assert.equal(x.vs, want, `${x.k} ${x.score} vs ${base}`);
    }
  }
});

test('네 줄에 십신 이름이 안 나온다', () => {
  // '겨루는 기운' 이라고 적으면 읽고 나서 아무것도 안 정해진다.
  //
  // '기운' 이라는 낱말 자체를 막으면 안 된다. 몸과 컨디션에는 '기운이 차는
  // 방식' 처럼 몸의 기운을 말하는 자리가 있다. 막을 것은 십신 이름이다.
  const GODS = Object.values(TEN_GOD_KO);
  for (const { r } of ALL) {
    for (const x of r.selves) {
      const hit = GODS.find((g) => x.line.includes(g));
      assert.equal(hit, undefined, `${x.k}: ${x.line}`);
      assert.ok(x.line.endsWith('.'), `문장으로 안 끝나요: ${x.line}`);
    }
  }
});

test("'원래 ~ 사람이에요' 같은 비문이 없다", () => {
  // pull 은 '일이 일어나는' 서술이라 타고난 층에 붙이면
  // '원래 같은 자리를 두고 겹치는 사람이 생기는 사람이에요' 가 된다.
  for (const { k, r } of ALL) {
    const pulls = Object.values(CONCERN_GOD[k]).map((g) => g.pull);
    const natal = r.selves[3].line;
    assert.ok(!pulls.some((p) => natal.includes(p)), `타고난 줄에 pull 이 붙었어요: ${natal}`);
  }
});

test('오늘 하나만 놓고 묻고 답한다', () => {
  for (const { k, r } of ALL) {
    assert.ok(r.todayAsk.q.startsWith('오늘'), r.todayAsk.q);
    assert.ok(r.todayAsk.q.endsWith('?'), r.todayAsk.q);
    // 답은 두 줄이다. 첫 줄이 예·아니요, 둘째 줄이 그래서 뭘 하라는 것.
    const lines = r.todayAsk.a.split('\n');
    assert.equal(lines.length, 2, `두 줄이 아니에요: ${r.todayAsk.a}`);
    assert.ok(lines.every((l) => l.endsWith('.')), r.todayAsk.a);
    // '기운' 이라는 낱말 자체는 막지 않는다. 몸과 컨디션에는 '기운이
    // 돌아와요' 처럼 몸의 기운을 말하는 자리가 있다. 막을 것은 십신 이름이다.
    const god = Object.values(TEN_GOD_KO).find((g) => r.todayAsk.a.includes(g));
    assert.equal(god, undefined, `십신 이름이 들어갔어요: ${r.todayAsk.a}`);
    // 오늘 점수 밴드에서 나와야 한다. 따로 고르면 위 표와 어긋난다.
    assert.equal(r.todayAsk.band, r.score.parts.find((p) => p.k === '오늘')!.band, k);
  }
});

test('오늘 답이 밴드마다 갈린다', () => {
  // 셋이 같은 말이면 점수를 본 적이 없는 것과 같다.
  const byBand = new Map<string, Set<string>>();
  for (const { r } of ALL) {
    if (!byBand.has(r.todayAsk.band)) byBand.set(r.todayAsk.band, new Set());
    byBand.get(r.todayAsk.band)!.add(r.todayAsk.a);
  }
  const all = [...byBand.values()].flatMap((v) => [...v]);
  assert.equal(new Set(all).size, all.length, '다른 밴드가 같은 답을 써요');
});

test('오늘 묻는 말이 고른 상황마다 다르다', () => {
  // '지금은 쉬는 중이에요' 를 고른 사람에게 '이직 얘기를 꺼내도 될까요' 라고
  // 물으면 꺼낼 자리가 없는 사람에게 묻는 말이 된다. 상황을 물어놓고 답에
  // 안 쓰는 것이 이 앱에서 제일 오래된 구멍이었다.
  for (const c of CONCERNS) {
    const qs = new Set(c.options.map((o) => todayAskOf(c.key, o.key, 'ok').q));
    assert.equal(qs.size, c.options.length,
      `${c.key}: 상황 ${c.options.length}가지인데 묻는 말은 ${qs.size}가지`);
  }
});

test('상황마다 답도 다르고, 밴드마다 또 갈린다', () => {
  const seen = new Set<string>();
  for (const c of CONCERNS) {
    for (const o of c.options) {
      for (const b of ['good', 'ok', 'hard'] as const) {
        const { a } = todayAskOf(c.key, o.key, b);
        assert.ok(!seen.has(a), `같은 답을 두 자리에서 써요: ${a}`);
        seen.add(a);
        assert.equal(a.split('\n').length, 2, `두 줄이 아니에요: ${a}`);
      }
    }
  }
  // 고민 여섯 x 상황 넷 x 밴드 셋
  assert.equal(seen.size, 72, `${seen.size}개만 있어요`);
});

test('상황을 안 골라도 답이 나온다', () => {
  for (const c of CONCERNS) {
    const r = todayAskOf(c.key, null, 'ok');
    assert.ok(r.q.endsWith('?') && r.a.includes('\n'), `${c.key}: ${r.q}`);
    // 없는 상황 키가 와도 터지지 않는다
    assert.equal(todayAskOf(c.key, 'nope', 'ok').q, r.q);
  }
});
