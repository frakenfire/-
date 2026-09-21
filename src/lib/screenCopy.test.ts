import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { FAVOR_WORD } from '../data/concernFocus.ts';
import { withRo, withJosa } from './josa.ts';
import { CONCERN_GOD } from '../data/concernReadings.ts';
import { CONCERNS, findConcern, type ConcernKey } from '../data/concerns.ts';

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
