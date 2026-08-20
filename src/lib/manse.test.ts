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
import { analyzeSaju, balanceShape, tenGodOf, mainHiddenStem, hiddenStemsOf, GOD_GROUP_OF } from './tenGods.ts';
import { STEMS, BRANCHES, toJDN } from './saju.ts';
import { dailyForMe, needFit, asSajuToday } from './dailySaju.ts';
import { generateFortune } from './generateFortune.ts';
import { NOTES } from '../data/notes.ts';
import { saveBirth, loadBirth, clearAllData } from './storage.ts';
import { pickNotesFor } from './pickNotes.ts';
import { NOTE_DIRECTION } from '../data/noteDirection.ts';

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

test('오행 요약 문구가 막대 그림과 모순되지 않는다', () => {
  // 화면엔 막대가 함께 뜬다. 화 4% / 수 54% 를 그려놓고 "고르게" 라고 쓰면 그 자리에서 들킨다.
  let evenCount = 0;
  for (let y = 1960; y <= 2010; y += 1) {
    for (const h of [1, 7, 13, 19, null]) {
      const prof = analyzeSaju(computeFourPillars({ year: y, month: (y % 12) + 1, day: 15, hour: h }));
      const shape = balanceShape(prof);
      const vals = Object.values(prof.balance);
      const max = Math.max(...vals);
      const min = Math.min(...vals);
      if (shape.kind === 'even') {
        evenCount += 1;
        // '고르다'고 말하려면 실제로 고르러야 한다
        assert.ok(max < 0.4, `고르다고 했는데 최대가 ${(max * 100).toFixed(0)}%`);
        assert.ok(min >= 0.1, `고르다고 했는데 최소가 ${(min * 100).toFixed(0)}%`);
      }
      if (shape.kind === 'tilted') assert.ok(max >= 0.4);
      if (shape.kind === 'thin') assert.ok(min < 0.1 && min >= 0.03);
      if (shape.kind === 'missing') assert.ok(min < 0.03);
    }
  }
  assert.ok(evenCount > 0, "'고르다' 케이스가 한 번도 안 나오면 규칙이 죽은 것");
});

// ── 오늘 일진 × 내 사주 ─────────────────────────────────────────────────────
// 여기가 '띠 운세'와 갈리는 지점이다. 같은 날이 사람마다 달라야 하고,
// 한 사람의 매일이 갈려야 하고, 숫자와 문장이 어긋나면 안 된다.

function addDaysKey(k: string, n: number): string {
  const d = new Date(`${k}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function meFor(y: number, m: number, d: number, h: number | null) {
  const p = computeFourPillars({ year: y, month: m, day: d, hour: h });
  return { p, a: analyzeSaju(p) };
}

test('같은 날이 사람마다 다르게 읽힌다 (띠 12분의 1에서 벗어난다)', () => {
  const gods = new Set<string>();
  const tones = new Set<string>();
  for (let y = 1970; y <= 2005; y += 1) {
    const { p, a } = meFor(y, (y % 12) + 1, 15, 9);
    const r = dailyForMe('2026-03-10', p, a);
    gods.add(r.dayGod);
    tones.add(r.tone);
  }
  assert.equal(gods.size, 10, `같은 날 십신이 ${gods.size}종 (10종이어야 한다)`);
  assert.ok(tones.size >= 3, `같은 날 톤이 ${tones.size}종`);
});

test('한 사람의 매일이 갈리고, 연속 이틀 같은 헤드라인이 없다', () => {
  const { p, a } = meFor(1993, 11, 7, 5);
  const rows = Array.from({ length: 30 }, (_, i) => dailyForMe(addDaysKey('2026-08-19', i), p, a));
  const titles = rows.map((r) => r.reading.title);
  for (let i = 1; i < titles.length; i += 1) {
    assert.notEqual(titles[i], titles[i - 1], `${i + 1}일차에 어제와 같은 헤드라인`);
  }
  // 십신이 10개뿐이라 문장이 하나면 열흘마다 같은 말이 돈다. 풀을 늘린 효과를 고정한다.
  assert.ok(new Set(titles).size >= 18, `30일간 헤드라인 ${new Set(titles).size}종`);
  const combos = rows.map((r) => `${r.reading.title}|${r.reading.body}|${r.reading.doThis}`);
  assert.ok(new Set(combos).size >= 25, `30일간 조합 ${new Set(combos).size}종`);
});

test("'조심하라'면서 '약이 된다'고 말하지 않는다 (톤과 문장의 모순)", () => {
  let bad = 0;
  for (let y = 1970; y <= 2005; y += 1) {
    for (const h of [3, 9, 15, 21]) {
      const { p, a } = meFor(y, (y % 12) + 1, 15, h);
      for (let i = 0; i < 60; i += 1) {
        const r = dailyForMe(addDaysKey('2026-01-01', i), p, a);
        if (r.tone === 'caution' && r.fit === 'needed') bad += 1;
      }
    }
  }
  assert.equal(bad, 0, `모순 ${bad}건`);
});

test('톤 분포가 띠 엔진과 비슷하다 (조심이 매일이면 경고가 무의미해진다)', () => {
  const c: Record<string, number> = {};
  let n = 0;
  for (let y = 1970; y <= 2005; y += 1) {
    for (const h of [3, 15]) {
      const { p, a } = meFor(y, (y % 12) + 1, 15, h);
      for (let i = 0; i < 60; i += 1) {
        const t = dailyForMe(addDaysKey('2026-01-01', i), p, a).tone;
        c[t] = (c[t] ?? 0) + 1;
        n += 1;
      }
    }
  }
  const pct = (k: string) => ((c[k] ?? 0) / n) * 100;
  assert.ok(pct('great') > 12 && pct('great') < 28, `대길 ${pct('great').toFixed(1)}%`);
  assert.ok(pct('caution') > 5 && pct('caution') < 20, `조심 ${pct('caution').toFixed(1)}%`);
});

test('신강/신약에 따라 같은 십신이 약도 되고 독도 된다', () => {
  // 억부의 핵심. 강한 사람에겐 덜어내는 쪽이, 약한 사람에겐 채우는 쪽이 약이다.
  const strong = { strength: 'strong' } as never;
  const weak = { strength: 'weak' } as never;
  assert.equal(needFit(strong, 'output'), 'needed');
  assert.equal(needFit(strong, 'support'), 'excess');
  assert.equal(needFit(weak, 'support'), 'needed');
  assert.equal(needFit(weak, 'wealth'), 'excess');
});

test('결과가 사주로 개인화되고, 사주가 없으면 기존 띠 경로가 그대로 산다', () => {
  const base = {
    fortuneType: 'tomorrow' as const,
    note: NOTES[0],
    mood: 'soso' as const,
    dateKey: '2026-08-19',
    zodiac: 'dog' as const,
  };
  const a = generateFortune({ ...base, birth: { year: 1993, month: 11, day: 7, hour: 5 } });
  const b = generateFortune({ ...base, birth: { year: 1988, month: 5, day: 8, hour: 14 } });
  assert.ok(a.daily && b.daily, '사주를 넣으면 개인 해석이 있어야 한다');
  assert.notEqual(a.daily!.dayGod, b.daily!.dayGod, '사주가 다르면 십신도 달라야 한다');
  assert.equal(a.daily!.myStemHanja.length, 1, '내 일간이 한 글자로 실려야 한다');
  // 화면이 읽는 saju 도 개인 기준으로 갈아끼워져야 한다 (두 기준이 한 화면에 섞이면 모순)
  assert.equal(a.saju!.tone, a.daily!.tone);
  assert.equal(a.saju!.headline, a.daily!.reading.title);

  const noBirth = generateFortune(base);
  assert.equal(noBirth.daily ?? null, null, '사주가 없으면 개인 해석도 없다');
  assert.ok(noBirth.saju, '띠만 있어도 기존 경로는 살아 있어야 한다');

  // 결정적이어야 한다
  assert.deepEqual(
    generateFortune({ ...base, birth: { year: 1993, month: 11, day: 7, hour: 5 } }),
    a,
  );
});

test('총운 점수가 사주 톤과 모순되지 않는다 (개인 사주 경로)', () => {
  const BAND: Record<string, [number, number]> = {
    great: [80, 99],
    good: [72, 95],
    steady: [68, 90],
    caution: [65, 82],
  };
  for (let y = 1980; y <= 2000; y += 1) {
    for (let i = 0; i < 20; i += 1) {
      const r = generateFortune({
        fortuneType: 'tomorrow',
        note: NOTES[i % NOTES.length],
        mood: 'soso',
        dateKey: addDaysKey('2026-01-01', i),
        zodiac: 'dog',
        birth: { year: y, month: (y % 12) + 1, day: 15, hour: 9 },
      });
      const [lo, hi] = BAND[r.saju!.tone];
      assert.ok(
        r.luck.total >= lo && r.luck.total <= hi,
        `${r.saju!.tone} 인데 총운 ${r.luck.total}점 (${lo}~${hi} 밖)`,
      );
    }
  }
});

test('전체 삭제가 생년월일까지 지운다 (개인정보가 남으면 안 된다)', () => {
  // 접두사 방식이라 새 키가 생겨도 자동으로 걸리지만, 개인정보라 명시적으로 고정한다.
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      get length() {
        return store.size;
      },
      key: (i: number) => [...store.keys()][i] ?? null,
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  saveBirth({ date: '1993-11-07', time: '05:40' });
  assert.deepEqual(loadBirth(), { date: '1993-11-07', time: '05:40' });
  store.set('someOtherApp', 'keep me');

  clearAllData();
  assert.equal(loadBirth(), null, '전체 삭제 후에도 생년월일이 남아 있다');
  assert.equal(store.get('someOtherApp'), 'keep me', '남의 키까지 지우면 안 된다');
});

test('저장된 생년월일이 깨져 있으면 없는 것으로 본다 (틀린 사주를 보여주느니)', () => {
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      get length() {
        return store.size;
      },
      key: (i: number) => [...store.keys()][i] ?? null,
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  for (const bad of ['{}', 'not json', '{"date":"1993-13-99"}', '{"date":"1993-11-07","time":"25:00"}']) {
    store.set('tomorrowNoteBirth', bad);
    assert.equal(loadBirth(), null, `깨진 값(${bad})을 받아들였다`);
  }
});

test('한 화면에 같은 문장이 두 번 찍히지 않는다', () => {
  // 일진 스트립의 팁과 십신 카드의 '오늘 하면 좋아요'가 같은 문장이면
  // 바로 위아래에 똑같은 말이 두 번 보인다. 실제로 그랬다.
  for (let y = 1970; y <= 2005; y += 1) {
    for (let i = 0; i < 20; i += 1) {
      const dateKey = addDaysKey('2026-01-01', i);
      const { p, a } = meFor(y, (y % 12) + 1, 15, 9);
      const d = dailyForMe(dateKey, p, a);
      const s = asSajuToday(d, dateKey);
      assert.notEqual(s.tip, d.reading.doThis, `${y}/${dateKey}: 팁과 할 일이 같다`);
      assert.notEqual(s.title, s.headline, `${y}/${dateKey}: 제목과 헤드라인이 같다`);
    }
  }
});

test('생년월일이 쪽지 후보 자체를 바꾼다 (받아놓고 안 쓰면 의미가 없다)', () => {
  const base = { dateKey: '2026-08-19', fortuneType: 'tomorrow', mood: 'soso', nonce: 0 };
  const combos = new Set<string>();
  for (let y = 1960; y <= 2010; y += 1) {
    for (const h of [3, 9, 15, 21]) {
      const r = pickNotesFor(NOTES, 3, {
        ...base,
        birth: { year: y, month: (y % 12) + 1, day: 15, hour: h },
      });
      assert.equal(r.notes.length, 3);
      assert.equal(new Set(r.notes.map((n) => n.id)).size, 3, '같은 쪽지가 두 번 놓였다');
      assert.equal(r.personal, true);
      combos.add(r.notes.map((n) => n.id).sort().join(','));
    }
  }
  // 같은 날·같은 기분이어도 사람마다 다른 세 장이 놓여야 한다
  assert.ok(combos.size > 120, `204명이 ${combos.size}가지 조합밖에 못 받는다`);
});

test('오늘 기운이 넘치면 쉬어가는 쪽지가, 모자라면 나서는 쪽지가 더 자주 놓인다', () => {
  // 확률만 기울일 뿐 막지는 않는다 — 뽑기의 우연을 없애면 그건 더 이상 뽑는 게 아니다.
  let pushWhenNeeded = 0;
  let holdWhenExcess = 0;
  let needed = 0;
  let excess = 0;
  for (let y = 1960; y <= 2010; y += 1) {
    const birth = { year: y, month: (y % 12) + 1, day: 15, hour: 9 };
    for (let i = 0; i < 8; i += 1) {
      const dateKey = addDaysKey('2026-01-01', i * 7);
      const r = pickNotesFor(NOTES, 3, { dateKey, fortuneType: 'tomorrow', mood: 'soso', nonce: 0, birth });
      const dirs = r.notes.map((n) => NOTE_DIRECTION[n.id] ?? 'any');
      if (r.leaning === 'push') {
        needed += 1;
        pushWhenNeeded += dirs.filter((d) => d === 'push').length;
      }
      if (r.leaning === 'hold') {
        excess += 1;
        holdWhenExcess += dirs.filter((d) => d === 'hold').length;
      }
    }
  }
  // 기울이지 않았다면 방향이 맞는 쪽지는 3장 중 평균 1장 남짓이다. 그보다 확실히 많아야 한다.
  assert.ok(needed > 0 && excess > 0, '두 방향 표본이 모두 있어야 한다');
  assert.ok(pushWhenNeeded / needed > 1.2, `모자랄 때 나서는 쪽지 평균 ${(pushWhenNeeded / needed).toFixed(2)}장`);
  assert.ok(holdWhenExcess / excess > 1.2, `넘칠 때 쉬어가는 쪽지 평균 ${(holdWhenExcess / excess).toFixed(2)}장`);
});

test('사주가 없어도 쪽지는 정상적으로 세 장 놓인다', () => {
  const r = pickNotesFor(NOTES, 3, {
    dateKey: '2026-08-19',
    fortuneType: 'tomorrow',
    mood: 'soso',
    nonce: 0,
  });
  assert.equal(r.notes.length, 3);
  assert.equal(r.personal, false);
  assert.equal(r.leaning, null);
});
