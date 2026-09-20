import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';

const INPUT = { year: 1992, month: 3, day: 3, hour: 20 };
const P = computeFourPillars(INPUT);

function dayKey(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
}

function read(at: Date, concern: ConcernKey = 'work', gender: 'male' | 'female' = 'female') {
  const t = computeTiming(INPUT, P, gender, concern, at);
  return { t, r: buildDeepRead(P, t, concern, 'stay', dayKey(at)) };
}

test('같은 달 안에서는 같은 답이 나온다', () => {
  const a = read(new Date('2026-09-15T09:00:00+09:00'));
  const b = read(new Date('2026-09-15T21:30:00+09:00'));
  assert.deepEqual(a.r, b.r);
});

test('달이 바뀌면 답이 바뀐다', () => {
  // 열두 달을 돌면서 이번 달 풀이가 몇 가지로 갈리는지 본다.
  const heads = new Set<string>();
  const subs = new Set<string>();
  const acts = new Set<string>();
  for (let m = 0; m < 12; m += 1) {
    const { r } = read(new Date(Date.UTC(2026, m, 15, 3)));
    heads.add(r.slots[0].outer);
    subs.add(r.sub);
    acts.add(r.actions.join('|'));
  }
  assert.ok(subs.size >= 5, `이번 달 문장이 ${subs.size}가지뿐`);
  assert.ok(heads.size >= 5, `달 풀이가 ${heads.size}가지뿐`);
  assert.ok(acts.size >= 5, `할 일이 ${acts.size}가지뿐`);
});

test('해가 바뀌면 올해 줄이 바뀐다', () => {
  const y26 = read(new Date('2026-06-15T12:00:00+09:00')).r.yearLines[0];
  const y27 = read(new Date('2027-06-15T12:00:00+09:00')).r.yearLines[0];
  assert.notEqual(y26.label, y27.label);
  assert.notEqual(y26.v, y27.v);
});

test('고민이 다르면 답도 다르다', () => {
  const at = new Date('2026-09-15T12:00:00+09:00');
  const seen = new Set<string>();
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, at);
    const r = buildDeepRead(P, t, c.key, null, '2026-09-15');
    seen.add(r.sub + r.slots[0].good);
  }
  assert.equal(seen.size, CONCERNS.length);
});

test('연애는 남녀가 보는 자리가 다르다', () => {
  const at = new Date('2026-09-15T12:00:00+09:00');
  const f = computeTiming(INPUT, P, 'female', 'love', at);
  const m = computeTiming(INPUT, P, 'male', 'love', at);
  assert.notDeepEqual(f.favor, m.favor);
});

test('모든 고민에서 문장이 비지 않는다', () => {
  const at = new Date('2026-11-20T12:00:00+09:00');
  for (const c of CONCERNS) {
    for (const o of c.options) {
      const t = computeTiming(INPUT, P, 'male', c.key, at);
      const r = buildDeepRead(P, t, c.key, o.key, '2026-11-20');
      assert.ok(r.headline.length > 4, `${c.key}/${o.key} 결론 비었음`);
      assert.ok(r.sub.length > 10);
      assert.ok(r.situationLine.length > 10);
      assert.equal(r.actions.length, 3);
      assert.ok(r.actions.every((a) => a.length > 5));
      assert.ok(r.slots.length >= 2);
      assert.ok(r.slots.every((s) => s.outer && s.good && s.care));
      assert.equal(r.yearLines.length, 2);
      assert.ok(r.daeunLine.length > 20);
      // 같은 십성이 겹친 층은 한 줄로 묶이므로 줄 수는 2~5 사이다
      assert.ok(r.why.length >= 2 && r.why.length <= 5, `근거가 ${r.why.length}줄`);
      for (const w of r.why) assert.ok(w.k.length > 1 && w.v.length > 10, `근거 ${w.k} 비었음`);
    }
  }
});

test('할 일에 같은 문장이 두 번 나오지 않는다', () => {
  for (let m = 0; m < 12; m += 1) {
    const { r } = read(new Date(Date.UTC(2026, m, 15, 3)), 'money');
    assert.equal(new Set(r.actions).size, r.actions.length, `${m + 1}월에 중복`);
  }
});

test('결론과 점수가 서로 어긋나지 않는다', () => {
  const at = new Date('2026-09-17T12:00:00+09:00');
  for (const c of CONCERNS) {
    for (const gender of ['male', 'female'] as const) {
      const t = computeTiming(INPUT, P, gender, c.key, at);
      const r = buildDeepRead(P, t, c.key, null, '2026-09-17');
      if (r.verdict === 'now') {
        assert.ok(r.score.total >= 74, `${c.key} 지금이라면서 ${r.score.total}점`);
      }
      assert.ok(r.scoreLine.includes(String(r.score.total)), `${c.key} 점수 줄에 숫자가 없음`);
    }
  }
});

test('타고난 구조는 네 줄이 다 차 있다', () => {
  const at = new Date('2026-09-17T12:00:00+09:00');
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, at);
    const r = buildDeepRead(P, t, c.key, null, '2026-09-17');
    assert.equal(r.shape.rows.length, 5);
    for (const row of r.shape.rows) {
      assert.ok(row.k.length > 2, `${c.key} 제목 비었음`);
      assert.ok(row.v.length > 12, `${c.key} ${row.k} 내용 비었음`);
    }
  }
});

test('지금 왜 이 고민이 커졌나 칸이 다 차 있다', () => {
  const at = new Date('2026-09-17T12:00:00+09:00');
  for (const c of CONCERNS) {
    for (const o of c.options) {
      const t = computeTiming(INPUT, P, 'female', c.key, at);
      const r = buildDeepRead(P, t, c.key, o.key, '2026-09-17');
      assert.ok(r.now.head.length > 5, `${c.key} 제목 비었음`);
      assert.ok(r.now.rows.length >= 2, `${c.key} 칸이 ${r.now.rows.length}개뿐`);
      for (const row of r.now.rows) assert.ok(row.v.length > 15, `${c.key} ${row.k} 비었음`);
      // 세 칸이 같은 말을 반복하면 읽을 이유가 없다
      assert.equal(new Set(r.now.rows.map((x) => x.v)).size, r.now.rows.length, `${c.key} 같은 문장 반복`);
    }
  }
});

test('오늘 행동은 고른 주제에서 나온다', () => {
  const at = new Date('2026-09-17T12:00:00+09:00');
  const seen = new Set<string>();
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, at);
    const r = buildDeepRead(P, t, c.key, null, '2026-09-17');
    assert.ok(r.today.doIt.length > 8, `${c.key} 오늘 할 일 비었음`);
    assert.ok(r.today.avoid.length > 8, `${c.key} 오늘 피할 것 비었음`);
    seen.add(r.today.doIt);
  }
  // 주제가 여섯 개인데 같은 행동이 돌아오면 주제를 물은 뜻이 없다
  assert.equal(seen.size, CONCERNS.length);
});

test('근거에 내 명식이 그대로 펼쳐진다', () => {
  const at = new Date('2026-09-17T12:00:00+09:00');
  const t = computeTiming(INPUT, P, 'female', 'work', at);
  const r = buildDeepRead(P, t, 'work', null, '2026-09-17');
  // 시각까지 넣었으면 네 기둥
  assert.equal(r.chart.pillars.length, 4);
  assert.equal(r.chart.pillars.filter((c) => c.me).length, 1, '나를 뜻하는 기둥이 하나여야 한다');
  for (const c of r.chart.pillars) {
    assert.ok(c.stem.length > 0 && c.branch.length > 0, `${c.k} 글자가 비었음`);
  }
  assert.equal(r.chart.elements.length, 5);
  const sum = r.chart.elements.reduce((a, e) => a + e.pct, 0);
  assert.ok(Math.abs(sum - 100) <= 2, `오행 합이 ${sum}%`);
  assert.equal(r.chart.elements.filter((e) => e.mine).length, 1);
  for (const k of ['dayMaster', 'strength', 'season', 'useful', 'focus', 'today'] as const) {
    assert.ok(r.chart[k].length > 15, `${k} 가 비었음`);
  }
});

test('날이 바뀌면 오늘 줄이 바뀌고, 명식은 그대로다', () => {
  const t = computeTiming(INPUT, P, 'female', 'work', new Date('2026-09-17T12:00:00+09:00'));
  const a = buildDeepRead(P, t, 'work', null, '2026-09-17');
  const b = buildDeepRead(P, t, 'work', null, '2026-09-18');
  assert.notEqual(a.chart.today, b.chart.today, '오늘 줄이 어제와 같으면 매일 볼 이유가 없다');
  assert.notEqual(a.today.doIt, b.today.doIt, '오늘 할 일이 어제와 같으면 안 된다');
  assert.deepEqual(a.chart.pillars, b.chart.pillars, '명식은 날이 바뀌어도 그대로여야 한다');
  assert.deepEqual(a.chart.elements, b.chart.elements);
});

test('오늘 글자와 내 글자가 만나는 자리가 날마다 바뀐다', () => {
  const t = computeTiming(INPUT, P, 'female', 'work', new Date('2026-09-17T12:00:00+09:00'));
  const days = ['2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21'];
  const seen = new Set(days.map((d) => {
    const r = buildDeepRead(P, t, 'work', null, d);
    return `${r.todayMeet.pillar}|${r.todayMeet.step}|${r.todayMeet.rows.map((x) => x.k + x.rel).join(',')}`;
  }));
  assert.equal(seen.size, days.length, '닷새가 다 달라야 매일 볼 이유가 생긴다');
});

test('명식 기둥마다 십이운성 단계가 붙는다', () => {
  const t = computeTiming(INPUT, P, 'female', 'work', new Date('2026-09-17T12:00:00+09:00'));
  const r = buildDeepRead(P, t, 'work', null, '2026-09-17');
  for (const c of r.chart.pillars) assert.ok(c.step.length > 2, `${c.k} 단계 비었음`);
  assert.ok(r.chart.gongmang.includes('비어 있어요'));
  for (const x of r.chart.sinsal) {
    assert.ok(x.k.length > 2 && x.v.length > 10, `${x.k} 설명 비었음`);
  }
});

test('이름을 넣으면 이름 칸이 생기고, 안 넣으면 없다', () => {
  const t = computeTiming(INPUT, P, 'female', 'work', new Date('2026-09-17T12:00:00+09:00'));
  const withName = buildDeepRead(P, t, 'work', null, '2026-09-17', '김한별');
  const without = buildDeepRead(P, t, 'work', null, '2026-09-17', null);
  assert.ok(withName.name, '이름을 넣었는데 칸이 없음');
  assert.equal(without.name, null);
  assert.equal(withName.name!.letters.length, 3);
});

test('이름이 다르면 이름 풀이도 다르다', () => {
  const t = computeTiming(INPUT, P, 'female', 'work', new Date('2026-09-17T12:00:00+09:00'));
  const seen = new Set(
    ['김한별', '이윤섭', '박지훈', '최서연'].map(
      (n) => buildDeepRead(P, t, 'work', null, '2026-09-17', n).name!.letters.map((l) => l.el).join(','),
    ),
  );
  assert.ok(seen.size >= 3, `이름 넷이 ${seen.size} 가지로만 갈림`);
});

test('이름 판정이 앞뒤로 어긋나지 않는다', () => {
  const t = computeTiming(INPUT, P, 'female', 'work', new Date('2026-09-17T12:00:00+09:00'));
  for (const n of ['김한별', '이윤섭', '박지훈', '최서연', '정하늘', '가나아', '가아마']) {
    const r = buildDeepRead(P, t, 'work', null, '2026-09-17', n);
    const v = r.name!.verdict;
    // 되돌려준다고 해놓고 실어 나르지 않는다고 하면 둘 다 못 믿을 말이 된다
    assert.ok(
      !(/되돌려주는/.test(v) && /않아요|아니에요/.test(v)),
      `${n}: 한 문장 안에서 말이 뒤집힘 — ${v}`,
    );
    assert.ok(v.length > 30, `${n}: 판정이 너무 짧음`);
  }
});

// 밴드 말만 붙이면 61점과 83점이 똑같이 '무난해요'가 된다. 같은 화면 위쪽 표에는
// 이번 달 78점이 찍혀 있는데 아래 칩은 무난해요라고만 하니 앞뒤가 안 맞아 보인다.
test('밴드 칩은 말과 숫자를 같이 단다', () => {
  const bandOf = (n: number) => (n >= 84 ? '좋아요' : n <= 60 ? '조심할 때' : '무난해요');
  for (const c of CONCERNS) {
    const { r } = read(new Date('2026-09-15T09:00:00+09:00'), c.key);
    const chips = [
      ...r.when.map((w) => w.band),
      ...r.slots.map((s) => s.band),
      ...r.monthSlots.map((m) => m.band),
      ...r.yearLines.map((y) => y.band),
    ].filter((b): b is string => typeof b === 'string');
    assert.ok(chips.length >= 12, `${c.key}: 칩이 ${chips.length}개뿐`);
    for (const chip of chips) {
      const m = /^(좋아요|무난해요|조심할 때) (\d+)$/.exec(chip);
      assert.ok(m, `${c.key}: 칩에 숫자가 없어요 — ${chip}`);
      assert.equal(m![1], bandOf(Number(m![2])), `${c.key}: 말과 점수가 어긋나요 — ${chip}`);
    }
  }
  // 위 점수표의 이번 달 칸과 아래 칩의 숫자가 같은 값이어야 한다
  const { t, r } = read(new Date('2026-09-15T09:00:00+09:00'));
  const chip = r.when.find((w) => w.k === '이번 달')!.band!;
  assert.equal(chip, `${'좋아요 무난해요 조심할 때'.split(' ')[['good', 'ok', 'hard'].indexOf(t.thisMonth.band)]} ${t.thisMonth.score}`);
});

// 결정 카드가 아래 열두 달 차트의 이번 달 칸을 그대로 다시 적고 있었다.
// 200줄 떨어져 있어도 같은 문장이면 '맨날 같네'가 된다.
test('결정 카드와 열두 달 차트가 같은 문장을 쓰지 않는다', () => {
  for (const c of CONCERNS) {
    for (let m = 0; m < 12; m += 1) {
      const { r } = read(new Date(Date.UTC(2026, m, 15, 3)), c.key);
      const chartLine = r.monthSlots[0].outer;
      assert.ok(
        !r.sub.includes(chartLine),
        `${c.key} ${m + 1}월: 결정 카드가 차트 문장을 그대로 씀 — ${chartLine}`,
      );
    }
  }
});

// 같은 십성이 두 자리에 걸리면 같은 문장이 두 번 나온다.
// 올해·내년 표의 '유리하게 쓰는 법'과 열두 달 차트의 '좋아요'가 그랬다.
test('해 표와 달 차트가 같은 문장을 쓰지 않는다', () => {
  const hits: string[] = [];
  for (const c of CONCERNS) {
    for (let m = 0; m < 12; m += 1) {
      const { r } = read(new Date(Date.UTC(2026, m, 15, 3)), c.key);
      const cells = r.yearCompare.flatMap((y) => [y.thisYear, y.nextYear]);
      for (const slot of r.monthSlots) {
        for (const line of [slot.good, slot.care, slot.outer]) {
          if (cells.includes(line)) hits.push(`${c.key} ${m + 1}월 ${slot.label}: ${line}`);
        }
      }
    }
  }
  assert.equal(hits.length, 0, `겹치는 문장 ${hits.length}개\n  ${hits.slice(0, 6).join('\n  ')}`);
});

// 다시 올 이유를 만드는 줄. '내일 대박' 같은 미끼를 쓰면 다음 날 한 번 속고
// 다시는 안 온다. 실제로 내일 일진을 계산한 말이어야 한다.
test('내일 한 줄이 날마다 실제로 바뀐다', () => {
  const lines = new Set<string>();
  for (let d = 1; d <= 20; d += 1) {
    const { r } = read(new Date(Date.UTC(2026, 8, d, 3)));
    assert.ok(r.todayMeet.nextDay.length > 8, `${d}일: 너무 짧아요`);
    lines.add(r.todayMeet.nextDay);
  }
  // 열흘 천간이 한 바퀴 도므로 스무 날이면 여러 갈래가 나와야 한다
  assert.ok(lines.size >= 4, `스무 날에 ${lines.size}가지뿐`);
});

test('내일 한 줄에 미끼 표현을 안 쓴다', () => {
  const BAIT = /대박|최고의 날|놓치면|서둘러|기회를 잡|반드시|무조건|행운이 쏟아/;
  for (const c of CONCERNS) {
    for (let d = 1; d <= 12; d += 1) {
      const { r } = read(new Date(Date.UTC(2026, 8, d, 3)), c.key);
      assert.ok(!BAIT.test(r.todayMeet.nextDay), `${c.key} ${d}일: ${r.todayMeet.nextDay}`);
      assert.ok(r.todayMeet.nextDay.includes('내일'), `${c.key} ${d}일: 내일 얘기가 아님`);
    }
  }
});

test('내일 한 줄이 같은 날 안에서는 안 바뀐다', () => {
  const a = read(new Date('2026-09-15T09:00:00+09:00')).r.todayMeet.nextDay;
  const b = read(new Date('2026-09-15T21:30:00+09:00')).r.todayMeet.nextDay;
  assert.equal(a, b);
});
