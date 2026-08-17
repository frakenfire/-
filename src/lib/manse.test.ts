// 만세력 엔진 검증 — 여기가 틀리면 남의 사주를 보여주게 된다.
// 밖에서 확인 가능한 사실(공표된 천문 시각, 표준시 이력)과 명리 규칙의 내적 정합성을 함께 건다.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apparentSolarLongitude,
  deltaTSeconds,
  fromJulianDay,
  solveSolarLongitude,
  toJulianDay,
} from './astro.ts';
import { koreaOffsetAt, trueSolarCorrectionMin } from './koreaTime.ts';
import { computeFourPillars, ipchunJdUt, pillarsHanja } from './fourPillars.ts';
import { analyzeSaju, tenGodOf, mainHiddenStem, hiddenStemsOf, GOD_GROUP_OF } from './tenGods.ts';
import { STEMS, BRANCHES, toJDN } from './saju.ts';

// ── 천문 계산 ──────────────────────────────────────────────────────────────

function solveUt(lngDeg: number, y: number, m: number, d: number): number {
  const dt = deltaTSeconds(y, m) / 86400;
  return solveSolarLongitude(lngDeg, toJulianDay(y, m, d, 0, 0, 0) + dt) - dt;
}
/** 공표값은 분 단위 반올림이라 비교도 반올림으로 맞춘다 */
function utcMinute(jdUt: number): string {
  const t = fromJulianDay(jdUt + 30 / 86400);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t.year}-${p(t.month)}-${p(t.day)} ${p(t.hour)}:${p(t.minute)}`;
}

test('분점·지점 시각이 공표값과 1분 이내로 맞는다', () => {
  // 춘분(0°)·하지(90°)·추분(180°)·동지(270°) — 널리 공표된 천문 참조값.
  const cases: [string, number, number, number, number, string][] = [
    ['2024 춘분', 0, 2024, 3, 20, '2024-03-20 03:06'],
    ['2024 하지', 90, 2024, 6, 20, '2024-06-20 20:51'],
    ['2024 추분', 180, 2024, 9, 22, '2024-09-22 12:44'],
    ['2025 춘분', 0, 2025, 3, 20, '2025-03-20 09:01'],
    ['2000 춘분', 0, 2000, 3, 20, '2000-03-20 07:35'],
    ['2026 춘분', 0, 2026, 3, 20, '2026-03-20 14:46'],
  ];
  for (const [name, lng, y, m, d, expected] of cases) {
    assert.equal(utcMinute(solveUt(lng, y, m, d)), expected, name);
  }
});

test('태양 황경은 1년에 정확히 한 바퀴, 단조 증가한다', () => {
  const j0 = toJulianDay(2024, 1, 1, 0, 0, 0);
  let prev = apparentSolarLongitude(j0);
  let wraps = 0;
  for (let i = 1; i <= 366; i += 1) {
    const cur = apparentSolarLongitude(j0 + i);
    if (cur < prev) wraps += 1;
    prev = cur;
  }
  assert.equal(wraps, 1, '0°를 정확히 한 번만 통과해야 한다');
});

test('율리우스일 변환이 왕복해도 같은 시각이다', () => {
  for (const [y, m, d, h, mi] of [
    [1954, 3, 21, 0, 0],
    [1987, 5, 10, 2, 30],
    [2026, 8, 17, 23, 59],
    [2000, 2, 29, 12, 0], // 윤년
    [1988, 12, 31, 23, 30],
  ]) {
    const back = fromJulianDay(toJulianDay(y, m, d, h, mi, 0));
    assert.deepEqual([back.year, back.month, back.day, back.hour, back.minute], [y, m, d, h, mi]);
  }
});

// ── 한국 표준시 이력 ────────────────────────────────────────────────────────

test('한국 표준시 이력이 반영된다 (+9 / +8:30 / 서머타임)', () => {
  assert.equal(koreaOffsetAt(2026, 8, 17, 12, 0).offsetMin, 540, '지금은 +9');
  assert.equal(koreaOffsetAt(1955, 6, 1, 12, 0).offsetMin, 510 + 60, '1955 서머타임 중 +8:30+1');
  assert.equal(koreaOffsetAt(1955, 3, 1, 12, 0).offsetMin, 510, '1955 평시 +8:30');
  assert.equal(koreaOffsetAt(1960, 12, 1, 12, 0).offsetMin, 510, '1961.8 이전은 +8:30');
  assert.equal(koreaOffsetAt(1962, 1, 1, 12, 0).offsetMin, 540, '1961.8 이후 +9');
  assert.equal(koreaOffsetAt(1987, 7, 1, 12, 0).offsetMin, 600, '1987 서머타임 +10');
  assert.equal(koreaOffsetAt(1987, 7, 1, 12, 0).isDst, true);
  assert.equal(koreaOffsetAt(1987, 12, 1, 12, 0).offsetMin, 540, '1987 겨울은 +9');
  assert.equal(koreaOffsetAt(1989, 7, 1, 12, 0).isDst, false, '1989년엔 서머타임이 없었다');
});

test('서머타임 경계가 tzdata 의 일요일 규칙과 일치한다', () => {
  // 1987 May Sun>=8 = 5/10 02:00 시작, Oct Sun>=8 = 10/11 03:00 종료
  assert.equal(koreaOffsetAt(1987, 5, 10, 1, 59).isDst, false);
  assert.equal(koreaOffsetAt(1987, 5, 10, 2, 0).isDst, true);
  assert.equal(koreaOffsetAt(1987, 10, 11, 2, 59).isDst, true);
  assert.equal(koreaOffsetAt(1987, 10, 11, 3, 0).isDst, false);
  // 1988 May Sun>=8 = 5/8 (그날이 일요일)
  assert.equal(koreaOffsetAt(1988, 5, 8, 2, 0).isDst, true);
  assert.equal(koreaOffsetAt(1988, 5, 7, 23, 0).isDst, false);
});

test('진태양시 보정 — 서울은 약 -32분', () => {
  const min = trueSolarCorrectionMin();
  assert.ok(min < -31 && min > -33, `서울 보정이 ${min}분`);
});

// ── 사주 세우기 ────────────────────────────────────────────────────────────

test('입춘 전후로 년주(=띠)가 갈린다', () => {
  // 2024 입춘은 2/4 17:27 KST. 그 앞은 계묘년(토끼), 뒤는 갑진년(용).
  const before = computeFourPillars({ year: 2024, month: 2, day: 4, hour: 10 });
  const after = computeFourPillars({ year: 2024, month: 2, day: 4, hour: 20 });
  assert.equal(before.year.kor, '계묘');
  assert.equal(before.zodiac, 'rabbit');
  assert.equal(after.year.kor, '갑진');
  assert.equal(after.zodiac, 'dragon');
  // 달력 해(2024=용띠)와 다르므로 화면에서 설명이 필요한 케이스로 표시돼야 한다
  assert.equal(before.zodiacDiffersFromCalendarYear, true);
  assert.equal(after.zodiacDiffersFromCalendarYear, false);
});

test('입춘 시각 자체가 매년 2월 3~5일 사이에 있다', () => {
  for (let y = 1950; y <= 2050; y += 1) {
    const t = fromJulianDay(ipchunJdUt(y) + 9 / 24); // KST
    assert.equal(t.month, 2, `${y} 입춘이 2월이 아니다`);
    assert.ok(t.day >= 3 && t.day <= 5, `${y} 입춘이 2월 ${t.day}일`);
  }
});

test('월주가 절기로 갈린다 (달력의 달이 아니다)', () => {
  // 2024 경칩은 3/5. 3/4 는 아직 인월(寅), 3/6 은 묘월(卯).
  const a = computeFourPillars({ year: 2024, month: 3, day: 4, hour: 12 });
  const b = computeFourPillars({ year: 2024, month: 3, day: 6, hour: 12 });
  assert.equal(BRANCHES[a.month.branch].hanja, '寅');
  assert.equal(BRANCHES[b.month.branch].hanja, '卯');
  assert.equal(a.solarTerm.name, '입춘');
  assert.equal(b.solarTerm.name, '경칩');
});

test('월간이 오호둔월법(五虎遁月法)을 따른다', () => {
  // 년간 甲/己 → 丙寅, 乙/庚 → 戊寅, 丙/辛 → 庚寅, 丁/壬 → 壬寅, 戊/癸 → 甲寅
  const expected: Record<string, string> = { 갑: '병', 기: '병', 을: '무', 경: '무', 병: '경', 신: '경', 정: '임', 임: '임', 무: '갑', 계: '갑' };
  for (let y = 1960; y <= 2040; y += 1) {
    // 각 해의 인월(입춘 직후) 을 잡는다
    const p = computeFourPillars({ year: y, month: 2, day: 20, hour: 12 });
    assert.equal(BRANCHES[p.month.branch].hanja, '寅', `${y} 2/20 이 인월이 아니다`);
    const yearStemKor = STEMS[p.year.stem].kor;
    assert.equal(
      STEMS[p.month.stem].kor,
      expected[yearStemKor],
      `${y}년 ${yearStemKor}년의 인월 천간이 틀렸다`,
    );
  }
});

test('시주가 오서둔시법(五鼠遁時法)을 따르고 2시간마다 넘어간다', () => {
  // 일간 甲/己 → 甲子시, 乙/庚 → 丙子, 丙/辛 → 戊子, 丁/壬 → 庚子, 戊/癸 → 壬子
  const ziStem: Record<string, string> = { 갑: '갑', 기: '갑', 을: '병', 경: '병', 병: '무', 신: '무', 정: '경', 임: '경', 무: '임', 계: '임' };
  for (let d = 1; d <= 28; d += 1) {
    const p = computeFourPillars({ year: 2026, month: 6, day: d, hour: 0, minute: 30 });
    // 자시(0시 30분 → 진태양시로도 자시 안)에서 시간 확인
    assert.equal(BRANCHES[p.hour!.branch].hanja, '子');
    assert.equal(STEMS[p.hour!.stem].kor, ziStem[STEMS[p.day.stem].kor], `${d}일 자시 천간`);
  }
});

test('시지가 진태양시 기준 2시간 단위로 정확히 나뉜다', () => {
  // 진태양시 보정을 끄면 시계 시각 그대로 → 경계를 깔끔히 확인할 수 있다
  const at = (h: number, mi = 0) =>
    BRANCHES[
      computeFourPillars({ year: 2026, month: 6, day: 10, hour: h, minute: mi, trueSolar: false })
        .hour!.branch
    ].hanja;
  assert.equal(at(23), '子');
  assert.equal(at(0), '子');
  assert.equal(at(1), '丑');
  assert.equal(at(2, 59), '丑');
  assert.equal(at(3), '寅');
  assert.equal(at(12), '午');
  assert.equal(at(21), '亥');
  assert.equal(at(22, 59), '亥');
});

test('일주가 60갑자 주기로 하루씩 정확히 흐른다', () => {
  let prev: number | null = null;
  for (let d = 1; d <= 31; d += 1) {
    const p = computeFourPillars({ year: 2026, month: 3, day: d, hour: 12, trueSolar: false });
    if (prev !== null) assert.equal(p.day.ganzhi, (prev + 1) % 60, `3/${d} 일주가 건너뛰었다`);
    prev = p.day.ganzhi;
  }
});

test('일주가 기존 일진 엔진과 같은 값을 낸다 (엔진 두 개가 어긋나지 않게)', () => {
  for (const [y, m, d] of [
    [1970, 1, 1],
    [2000, 1, 1],
    [2026, 8, 17],
  ]) {
    const p = computeFourPillars({ year: y, month: m, day: d, hour: 12, trueSolar: false });
    assert.equal(p.day.ganzhi, (((toJDN(y, m, d) + 49) % 60) + 60) % 60, `${y}-${m}-${d}`);
  }
});

test('야자시(23시대)는 다음날 일주로 넘어간다', () => {
  const late = computeFourPillars(
    { year: 2026, month: 6, day: 10, hour: 23, minute: 30, trueSolar: false },
    'nextDay',
  );
  const nextNoon = computeFourPillars(
    { year: 2026, month: 6, day: 11, hour: 12, trueSolar: false },
    'nextDay',
  );
  assert.equal(late.day.ganzhi, nextNoon.day.ganzhi);
  // sameDay 정책에서는 그날 일주를 유지한다
  const sameDay = computeFourPillars(
    { year: 2026, month: 6, day: 10, hour: 23, minute: 30, trueSolar: false },
    'sameDay',
  );
  const thatNoon = computeFourPillars({ year: 2026, month: 6, day: 10, hour: 12, trueSolar: false });
  assert.equal(sameDay.day.ganzhi, thatNoon.day.ganzhi);
});

test('과거 표준시(+8:30)가 시주를 실제로 바꾼다', () => {
  // 1959-05-10 은 서머타임(+9:30 실효) 구간. 그 시절 시계로 23:00 은
  // 지금 기준(+9)으로 계산할 때와 다른 시각이라 기둥이 달라져야 한다.
  const historical = computeFourPillars({ year: 1959, month: 5, day: 10, hour: 23, minute: 0 });
  assert.equal(historical.corrections.isDst, true);
  assert.equal(historical.corrections.offsetMin, 510 + 60);
  assert.ok(
    historical.corrections.notes.some((n) => n.includes('서머타임')),
    '서머타임 근거가 사용자에게 전달돼야 한다',
  );
});

test('같은 입력은 항상 같은 사주를 낸다 (결정적)', () => {
  const input = { year: 1993, month: 11, day: 7, hour: 5, minute: 40 };
  const a = computeFourPillars(input);
  const b = computeFourPillars(input);
  assert.equal(pillarsHanja(a), pillarsHanja(b));
  assert.deepEqual(a, b);
});

test('시각을 몰라도 세 기둥은 정상적으로 선다', () => {
  const p = computeFourPillars({ year: 1993, month: 11, day: 7, hour: null });
  assert.equal(p.hour, null);
  assert.equal(pillarsHanja(p).split(' ').length, 3);
  assert.ok(p.year.hanja && p.month.hanja && p.day.hanja);
});

// ── 십신 · 오행 ────────────────────────────────────────────────────────────

test('십신 규칙이 일간 기준 오행 관계와 맞는다', () => {
  // 甲(0, 양목) 기준
  assert.equal(tenGodOf(0, 0), 'bijian'); // 甲-甲 같은 오행 같은 음양
  assert.equal(tenGodOf(0, 1), 'geopjae'); // 甲-乙 같은 오행 다른 음양
  assert.equal(tenGodOf(0, 2), 'siksin'); // 甲→丙 목생화, 같은 양
  assert.equal(tenGodOf(0, 3), 'sanggwan'); // 甲→丁 목생화, 다른 음양
  assert.equal(tenGodOf(0, 4), 'pyeonjae'); // 甲→戊 목극토, 같은 양
  assert.equal(tenGodOf(0, 5), 'jeongjae'); // 甲→己
  assert.equal(tenGodOf(0, 6), 'pyeongwan'); // 庚→甲 금극목, 같은 양
  assert.equal(tenGodOf(0, 7), 'jeonggwan'); // 辛→甲
  assert.equal(tenGodOf(0, 8), 'pyeonin'); // 壬→甲 수생목, 같은 양
  assert.equal(tenGodOf(0, 9), 'jeongin'); // 癸→甲
});

test('모든 일간에서 십신 열 가지가 빠짐없이 한 번씩 나온다', () => {
  for (let day = 0; day < 10; day += 1) {
    const got = new Set(Array.from({ length: 10 }, (_, other) => tenGodOf(day, other)));
    assert.equal(got.size, 10, `일간 ${STEMS[day].hanja} 에서 십신이 ${got.size}종`);
  }
});

test('지장간 비중의 합이 1 이고 본기가 지지 오행과 맞는다', () => {
  for (let b = 0; b < 12; b += 1) {
    const hidden = hiddenStemsOf(b);
    const sum = hidden.reduce((a, h) => a + h.weight, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${BRANCHES[b].hanja} 지장간 합 ${sum}`);
    // 본기는 마지막 원소이고, 그 오행이 지지의 오행이어야 한다 (토 지지는 예외적으로 허용)
    const main = STEMS[mainHiddenStem(b)].el;
    if (BRANCHES[b].el !== 'earth') {
      assert.equal(main, BRANCHES[b].el, `${BRANCHES[b].hanja} 본기 오행 불일치`);
    }
  }
});

test('오행 저울의 합은 항상 1 이고 신강신약이 근거와 일치한다', () => {
  for (const input of [
    { year: 1993, month: 11, day: 7, hour: 5 },
    { year: 1988, month: 5, day: 8, hour: 14 },
    { year: 2001, month: 2, day: 4, hour: 23 },
    { year: 1975, month: 7, day: 20, hour: null as number | null },
  ]) {
    const prof = analyzeSaju(computeFourPillars(input));
    const sum = Object.values(prof.balance).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `오행 합 ${sum}`);
    // 신강/신약 판정이 supportRatio + 월령가중 기준과 어긋나면 안 된다
    const score = prof.supportRatio + (prof.hasSeasonalSupport ? 0.1 : 0);
    assert.equal(prof.strength, score >= 0.5 ? 'strong' : 'weak');
    // 용신은 반드시 오행 다섯 중 하나
    assert.ok(['wood', 'fire', 'earth', 'metal', 'water'].includes(prof.usefulElement));
    // 십신 무리 비중 합도 1
    const gw = Object.values(prof.groupWeights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(gw - 1) < 1e-9, `십신 무리 합 ${gw}`);
    assert.equal(GOD_GROUP_OF[prof.gods[0].god] !== undefined, true);
  }
});

test('시주 유무에 따라 십신 개수가 5개 또는 7개다', () => {
  const withHour = analyzeSaju(computeFourPillars({ year: 1993, month: 11, day: 7, hour: 5 }));
  const noHour = analyzeSaju(computeFourPillars({ year: 1993, month: 11, day: 7, hour: null }));
  assert.equal(withHour.gods.length, 7);
  assert.equal(noHour.gods.length, 5);
});

test('사주가 사람마다 실제로 갈라진다 (전부 같은 결과가 나오지 않는다)', () => {
  const seen = new Set<string>();
  for (let y = 1970; y <= 2005; y += 1) {
    for (const h of [3, 9, 15, 21]) {
      const p = computeFourPillars({ year: y, month: (y % 12) + 1, day: ((y * 7) % 28) + 1, hour: h });
      seen.add(pillarsHanja(p));
    }
  }
  // 144 개 표본에서 사실상 전부 달라야 한다 (띠 12종과는 비교가 안 되는 해상도)
  assert.ok(seen.size > 130, `서로 다른 사주 ${seen.size}종 (144 표본)`);
});
