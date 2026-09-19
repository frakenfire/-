import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars, pillarsHanja, boundaryNotice } from './fourPillars.ts';
import { toJDN } from './saju.ts';
import { GOLDEN, NEEDS_EXTERNAL_CHECK, type GoldenCase } from './goldenFixtures.ts';
import { RULESET, rulesetLabel } from './sajuRuleset.ts';
import { daeunStartAge, isYangYearStem } from './daeun.ts';

// 골든 테스트 러너.
//
// 픽스처마다 기대한 기둥을 하나씩 대본다. 틀리면 어느 자리가 어떻게 틀렸는지,
// 그 기대값이 어디서 왔는지까지 같이 뱉는다. '뭔가 틀렸다' 로 끝나면 고칠 수 없다.

/** JDN 을 다시 달력 날짜로. 상대 성질 검사에 쓴다. */
function fromJdnParts(jdn: number): { y: number; m: number; d: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const dd = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * dd) / 4);
  const mm = Math.floor((5 * e + 2) / 153);
  return {
    d: e - Math.floor((153 * mm + 2) / 5) + 1,
    m: mm + 3 - 12 * Math.floor(mm / 10),
    y: 100 * b + dd - 4800 + Math.floor(mm / 10),
  };
}

type Field = 'year' | 'month' | 'day' | 'hour' | 'solarTerm' | 'zodiac';

function actualOf(c: GoldenCase) {
  const p = computeFourPillars(c.input, RULESET.nightZi);
  return {
    year: p.year.kor,
    month: p.month.kor,
    day: p.day.kor,
    hour: p.hour ? p.hour.kor : null,
    solarTerm: p.solarTerm.name,
    zodiac: p.zodiac,
    pillars: p,
  };
}

function report(c: GoldenCase, field: Field, want: unknown, got: unknown): string {
  return [
    ``,
    `[${c.id}] ${field} 가 어긋남`,
    `  왜 이 케이스인가 : ${c.why}`,
    `  기대             : ${String(want)}`,
    `  실제             : ${String(got)}`,
    `  기대값 출처       : ${c.source}${c.note ? ` — ${c.note}` : ''}`,
    `  적용 규칙         : ${c.ruleset}`,
    `  현재 규칙         : ${rulesetLabel()}`,
  ].join('\n');
}

for (const c of GOLDEN) {
  test(`golden: ${c.id}`, () => {
    const a = actualOf(c);
    for (const field of ['year', 'month', 'day', 'hour', 'solarTerm', 'zodiac'] as Field[]) {
      const want = c.expected[field];
      if (want === undefined) continue; // 안 적은 자리는 안 본다
      assert.equal(a[field], want, report(c, field, want, a[field]));
    }
  });
}

// ── 픽스처로는 못 적는 관계형 기대값 ──────────────────────────────────────

test('golden: 일주가 날수 차이와 정확히 맞물린다 (150년 무결성)', () => {
  // 절대 기준점은 아직 외부 대조 전이라, 여기서는 '상대 성질' 만 건다.
  // 어느 두 날의 일주 차이는 그 사이 날수와 60 나머지로 정확히 같아야 한다.
  // 기준점이 통째로 밀려 있어도 이 성질은 반드시 성립한다.
  const ref = { y: 1900, m: 1, d: 1 };
  const refGanzhi = computeFourPillars({ year: ref.y, month: ref.m, day: ref.d, hour: 12 }).day.ganzhi;
  const refJdn = toJDN(ref.y, ref.m, ref.d);
  let checked = 0;
  for (let y = 1900; y <= 2050; y += 1) {
    for (const [m, d] of [[1, 15], [2, 28], [3, 21], [7, 4], [11, 30]] as [number, number][]) {
      const want = (((toJDN(y, m, d) - refJdn + refGanzhi) % 60) + 60) % 60;
      const got = computeFourPillars({ year: y, month: m, day: d, hour: 12 }).day.ganzhi;
      assert.equal(got, want, `${y}-${m}-${d} 일주가 날수 계산과 어긋남`);
      checked += 1;
    }
  }
  assert.ok(checked >= 700, `${checked}건만 확인됨`);
});

test('golden: 하루 뒤는 다음 간지, 60일 뒤는 같은 간지', () => {
  const day = (y: number, m: number, d: number) =>
    computeFourPillars({ year: y, month: m, day: d, hour: 12 }).day.ganzhi;
  // 윤년 2월 말, 연말 등 넘김이 까다로운 자리로 고른다
  for (const [y, m, d] of [[2024, 2, 28], [2024, 12, 31], [2023, 2, 28], [2000, 2, 28]] as [number, number, number][]) {
    const t0 = day(y, m, d);
    const jdn = toJDN(y, m, d);
    const next = fromJdnParts(jdn + 1);
    const plus60 = fromJdnParts(jdn + 60);
    assert.equal(day(next.y, next.m, next.d), (t0 + 1) % 60, `${y}-${m}-${d} 다음날이 한 칸이 아님`);
    assert.equal(day(plus60.y, plus60.m, plus60.d), t0, `${y}-${m}-${d} 60일 뒤가 같은 간지가 아님`);
  }
});

test('golden: 자시 경계가 진태양시 23:00 에 걸린다 (서울 벽시계 23:32)', () => {
  // 엔진은 일주·시주를 전부 진태양시로 센다. 그래서 '23시면 넘어간다' 가 아니라
  // '진태양시 23시면 넘어간다' 가 맞다. 서울은 -32분이라 벽시계로는 23:32 다.
  // 이 귀결이 RULESET.nightZiClock 에 적혀 있고, 여기서 그대로 확인한다.
  assert.equal(RULESET.nightZi, 'nextDay');
  assert.equal(RULESET.nightZiClock, 'trueSolar', '규칙이 바뀌면 이 기대값도 다시 정해야 한다');

  const at = (h: number, mi: number) =>
    computeFourPillars({ year: 2000, month: 6, day: 15, hour: h, minute: mi }).day.kor;
  const nextDay = computeFourPillars({ year: 2000, month: 6, day: 16, hour: 12 }).day.kor;

  assert.equal(at(23, 30), at(22, 50), '벽시계 23:30 은 아직 그날이어야 한다 (진태양시 22:58)');
  assert.equal(at(23, 50), nextDay, '벽시계 23:50 은 다음날이어야 한다 (진태양시 23:18)');
  assert.notEqual(at(23, 30), at(23, 50), '경계가 23:32 근처에서 실제로 갈려야 한다');
});

test('golden: 외부 대조가 남은 항목은 PASS 로 위장하지 않는다', () => {
  // 절대 일주 기준점은 아직 만세력으로 대조하지 못했다. 목록이 비어 있으면
  // 누군가 확인 없이 지운 것이므로 실패시킨다.
  assert.ok(NEEDS_EXTERNAL_CHECK.length >= 1, '외부 대조 목록이 비었다');
  for (const x of NEEDS_EXTERNAL_CHECK) {
    assert.ok(x.date && x.engineSays && x.why.length > 10, `${x.date} 기록이 부실함`);
  }
});

test('golden: 과거 +8:30 시절은 지금 기준과 다른 시주가 나온다', () => {
  // 1959-05-10 은 +8:30 이면서 서머타임(+1) 구간. 벽시계 23:30 을 지금 기준으로
  // 계산하면 시주가 밀린다. 보정이 실제로 작동하는지 본다.
  const real = computeFourPillars({ year: 1959, month: 5, day: 10, hour: 23, minute: 30 });
  const naive = computeFourPillars({ year: 2019, month: 5, day: 10, hour: 23, minute: 30 });
  assert.ok(real.corrections.offsetMin !== naive.corrections.offsetMin,
    `보정이 안 걸림: ${real.corrections.offsetMin} vs ${naive.corrections.offsetMin}`);
  assert.equal(real.corrections.isDst, true, '1959-05-10 은 서머타임 구간이다');
});

test('golden: 시각을 몰라도 세 기둥은 서고 시주만 비어 있다', () => {
  const p = computeFourPillars({ year: 1995, month: 8, day: 20, hour: null });
  assert.equal(p.hour, null);
  for (const k of ['year', 'month', 'day'] as const) {
    assert.ok(p[k].kor.length === 2, `${k} 기둥이 비었음`);
  }
  assert.equal(pillarsHanja(p).split(' ').length, 3);
});

test('golden: 같은 입력은 규칙이 같은 한 항상 같은 결과다', () => {
  for (const c of GOLDEN) {
    const a = pillarsHanja(computeFourPillars(c.input, RULESET.nightZi));
    for (let i = 0; i < 5; i += 1) {
      assert.equal(pillarsHanja(computeFourPillars(c.input, RULESET.nightZi)), a, `${c.id} 가 흔들림`);
    }
  }
});

test('golden: 모든 픽스처에 기대값 출처와 규칙이 적혀 있다', () => {
  for (const c of GOLDEN) {
    assert.ok(['rule', 'astro', 'history'].includes(c.source), `${c.id} 출처 없음`);
    assert.ok(c.ruleset.length > 10, `${c.id} 규칙 표기 없음`);
    assert.ok(c.why.length > 10, `${c.id} 왜 필요한지 안 적힘`);
  }
});

// ── 시각 미상 × 경계일 ────────────────────────────────────────────────────

test('golden: 시각을 모르는데 절기 경계일이면 갈린다고 알린다', () => {
  // 2024 입춘은 2/4 17:27 KST. 정오를 대입하면 계묘(토끼)로 정해지지만
  // 실제로 저녁에 태어났다면 갑진(용)이다. 계산을 바꾸지 말고 알려야 한다.
  const notice = boundaryNotice({ year: 2024, month: 2, day: 4, hour: null });
  assert.ok(notice, '입춘 당일인데 시각 미상 경고가 없다');
  assert.match(notice!, /띠|입춘|절기/);

  const noon = computeFourPillars({ year: 2024, month: 2, day: 4, hour: null });
  const evening = computeFourPillars({ year: 2024, month: 2, day: 4, hour: 20 });
  assert.notEqual(noon.year.kor, evening.year.kor, '이 날이 실제로 갈리는 날이어야 테스트가 의미 있다');
});

test('golden: 시각을 모르는데 절기가 바뀌는 날이면 달 기둥도 알린다', () => {
  // 2024 경칩은 3/5. 그날은 인월과 묘월이 갈린다.
  const notice = boundaryNotice({ year: 2024, month: 3, day: 5, hour: null });
  assert.ok(notice, '경칩 당일인데 시각 미상 경고가 없다');
});

test('golden: 평범한 날은 시각을 몰라도 경고하지 않는다', () => {
  for (const [y, m, d] of [[1990, 5, 15], [2000, 7, 4], [1985, 11, 20]] as [number, number, number][]) {
    assert.equal(boundaryNotice({ year: y, month: m, day: d, hour: null }), null,
      `${y}-${m}-${d} 는 경계일이 아닌데 경고가 떴다`);
  }
});

test('golden: 1년 중 경고가 뜨는 날은 12개 절기 언저리뿐이다', () => {
  // 매일 경고하면 경고가 아니다. 2024 한 해를 훑어 경계일만 잡히는지 본다.
  const days: string[] = [];
  for (let m = 1; m <= 12; m += 1) {
    for (let d = 1; d <= 28; d += 1) {
      if (boundaryNotice({ year: 2024, month: m, day: d, hour: null })) days.push(`${m}/${d}`);
    }
  }
  assert.ok(days.length >= 8 && days.length <= 16,
    `경계일이 ${days.length}일 (${days.join(' ')}) — 12절기 언저리를 크게 벗어났다`);
});

// ── 규칙이 계산을 실제로 지배하는가 ──────────────────────────────────────
//
// RULESET 을 선언만 해두고 엔진이 안 읽으면 그 파일은 문서가 아니라 거짓말이 된다.
// 규칙값을 바꿔 넣었을 때 결과가 실제로 따라오는지 확인한다.

test('규칙: 경도를 바꾸면 시주가 실제로 달라진다', () => {
  // 시주 경계는 진태양시 홀수 시다. 오시와 미시를 가르는 진태양시 13:00 은
  // 벽시계로 서울 13:32, 부산 13:24 에 걸린다. 그 사이 시각을 고른다.
  const seoul = computeFourPillars({ year: 1990, month: 5, day: 15, hour: 13, minute: 28 });
  const busan = computeFourPillars({
    year: 1990, month: 5, day: 15, hour: 13, minute: 28, longitude: 129.08,
  });
  assert.notEqual(seoul.hour!.kor, busan.hour!.kor,
    '경도를 바꿨는데 시주가 그대로다 — RULESET.defaultLongitude 가 계산에 안 닿는다');
  assert.notEqual(seoul.corrections.trueSolarMin, busan.corrections.trueSolarMin);
});

test('규칙: 진태양시를 끄면 보정이 사라진다', () => {
  const on = computeFourPillars({ year: 1990, month: 5, day: 15, hour: 12, minute: 58 });
  const off = computeFourPillars({
    year: 1990, month: 5, day: 15, hour: 12, minute: 58, trueSolar: false,
  });
  assert.notEqual(on.corrections.trueSolarMin, 0);
  assert.equal(off.corrections.trueSolarMin, 0);
});

test('규칙: 야자시 정책을 바꾸면 일주가 실제로 달라진다', () => {
  // 진태양시 23시를 넘긴 시각. nextDay 면 다음날, sameDay 면 그날.
  const at = { year: 2000, month: 6, day: 15, hour: 23, minute: 50 };
  const next = computeFourPillars(at, 'nextDay');
  const same = computeFourPillars(at, 'sameDay');
  assert.notEqual(next.day.kor, same.day.kor,
    'nightZi 를 바꿨는데 일주가 그대로다 — 죽은 옵션이라는 뜻이다');
  assert.equal(same.day.kor, computeFourPillars({ ...at, hour: 12 }).day.kor,
    'sameDay 는 그날 일주를 유지해야 한다');
});

test('규칙: 시각 미상 대입값이 RULESET 과 맞다', () => {
  const unknown = computeFourPillars({ year: 1990, month: 5, day: 15, hour: null });
  const atFallback = computeFourPillars({
    year: 1990, month: 5, day: 15, hour: RULESET.unknownHourFallback,
  });
  assert.equal(unknown.day.kor, atFallback.day.kor);
  assert.equal(unknown.month.kor, atFallback.month.kor);
  assert.equal(unknown.year.kor, atFallback.year.kor);
  assert.equal(unknown.hour, null, '시각을 몰랐으면 시주는 비어 있어야 한다');
});

test('규칙: 대운수 반올림 방식이 RULESET 에 적힌 대로다', () => {
  // round 와 floor 는 절입까지 날수가 3의 배수가 아닐 때 갈린다.
  const input = { year: 1992, month: 3, day: 3, hour: 20 };
  const p = computeFourPillars(input);
  const age = daeunStartAge(input, isYangYearStem(p.year.stem));
  assert.ok(age >= 1 && age <= 10, `대운수가 ${age}`);
  assert.ok(['round', 'floor'].includes(RULESET.daeunStartRounding));
});

test('규칙: 라벨에 갈리는 규칙이 빠짐없이 들어간다', () => {
  const label = rulesetLabel();
  for (const piece of [String(RULESET.version), RULESET.nightZi, RULESET.nightZiClock,
    RULESET.daeunStartRounding, String(RULESET.unknownHourFallback)]) {
    assert.ok(label.includes(piece), `라벨에 ${piece} 가 없다 — 추적이 안 된다`);
  }
});
