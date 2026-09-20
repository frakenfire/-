// 음력(태음태양력) 변환 — 한국 민간력 기준.
//
// 왜 필요한가: 한국에서 나이 있는 분들은 생일을 음력으로만 안다. 음력 날짜를
// 양력인 줄 알고 넣으면 사주 여덟 글자가 통째로 남의 것이 된다. 날짜 하나가
// 아니라 명식 전체가 틀린다. 그래서 여기서 정확히 옮긴다.
//
// 표를 들고 오지 않는다. 이 앱의 절기 계산과 똑같이 천문에서 직접 푼다.
// 표는 어디서 베꼈는지 확인할 수 없고, 범위 밖 연도에서 조용히 죽는다.
//
// 음력의 규칙은 셋뿐이다.
//  (1) 달의 시작 = 삭(합삭, 新月)이 든 날. 한국 표준시 기준의 '날'이다.
//  (2) 동지(태양 황경 270°)가 든 달이 11월이다.
//  (3) 동지달과 다음 동지달 사이에 달이 13개면 윤달이 하나 있다.
//      그중 중기(황경이 30°의 배수)가 들지 않는 첫 달이 윤달이고,
//      앞 달의 번호를 그대로 쓴다 (2월 다음이면 윤2월).
//
// 삭의 시각은 Meeus, Astronomical Algorithms 49장. 오차는 분 단위라
// 날 경계를 가르는 데 충분하다.

import { apparentSolarLongitude, deltaTSeconds, toJulianDay, fromJulianDay } from './astro.ts';

const KST = 9 / 24;
const RAD = Math.PI / 180;
const sin = (deg: number) => Math.sin(deg * RAD);

/** 삭 k 번째의 시각 (TT 율리우스일). k=0 은 2000년 1월 6일 삭. */
function newMoonJde(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  let jde =
    2451550.09766 +
    29.530588861 * k +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4;

  // E 는 지구 궤도 이심률의 세기 보정. 태양항(M)에 곱한다.
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3; // 태양 평균근점이각
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4; // 달 평균근점이각
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4; // 달 위도인수
  const O = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3; // 승교점 황경

  jde +=
    -0.4072 * sin(Mp) +
    0.17241 * E * sin(M) +
    0.01608 * sin(2 * Mp) +
    0.01039 * sin(2 * F) +
    0.00739 * E * sin(Mp - M) -
    0.00514 * E * sin(Mp + M) +
    0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(Mp - 2 * F) -
    0.00057 * sin(Mp + 2 * F) +
    0.00056 * E * sin(2 * Mp + M) -
    0.00042 * sin(3 * Mp) +
    0.00042 * E * sin(M + 2 * F) +
    0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * Mp - M) -
    0.00017 * sin(O) -
    0.00007 * sin(Mp + 2 * M) +
    0.00004 * sin(2 * Mp - 2 * F) +
    0.00004 * sin(3 * M) +
    0.00003 * sin(Mp + M - 2 * F) +
    0.00003 * sin(2 * Mp + 2 * F) -
    0.00003 * sin(Mp + M + 2 * F) +
    0.00003 * sin(Mp - M + 2 * F) -
    0.00002 * sin(Mp - M - 2 * F) -
    0.00002 * sin(3 * Mp + M) +
    0.00002 * sin(4 * Mp);

  // 행성 섭동 — 값은 작지만 날 경계 근처에서 하루를 가른다.
  const A: [number, number][] = [
    [299.77 + 0.107408 * k - 0.009173 * T2, 0.000325],
    [251.88 + 0.016321 * k, 0.000165],
    [251.83 + 26.651886 * k, 0.000164],
    [349.42 + 36.412478 * k, 0.000126],
    [84.66 + 18.206239 * k, 0.00011],
    [141.74 + 53.303771 * k, 0.000062],
    [207.14 + 2.453732 * k, 0.00006],
    [154.84 + 7.30686 * k, 0.000056],
    [34.52 + 27.261239 * k, 0.000047],
    [207.19 + 0.121824 * k, 0.000042],
    [291.34 + 1.844379 * k, 0.00004],
    [161.72 + 24.198154 * k, 0.000037],
    [239.56 + 25.513099 * k, 0.000035],
    [331.55 + 3.592518 * k, 0.000023],
  ];
  for (const [ang, amp] of A) jde += amp * sin(ang);

  return jde;
}

/** TT 율리우스일 → 한국 표준시 기준 '며칠'. 날짜 하나를 정수로 센 값. */
function kstDayOf(jde: number): number {
  const rough = fromJulianDay(jde);
  const jdUT = jde - deltaTSeconds(rough.year, rough.month) / 86400;
  return Math.floor(jdUT + KST + 0.5);
}

/** 한국 표준시 기준 '며칠'의 자정 → TT 율리우스일 */
function kstMidnightJde(day: number): number {
  const jdUT = day - 0.5 - KST;
  const rough = fromJulianDay(jdUT);
  return jdUT + deltaTSeconds(rough.year, rough.month) / 86400;
}

/** 양력 날짜 → 한국 표준시 기준 '며칠' */
function kstDayFromSolar(year: number, month: number, day: number): number {
  return Math.floor(toJulianDay(year, month, day, 0, 0, 0) + 0.5);
}

/** 한국 표준시 기준 '며칠' → 양력 날짜 */
function solarFromKstDay(day: number): { year: number; month: number; day: number } {
  const d = fromJulianDay(day - 0.5 + 1e-7);
  return { year: d.year, month: d.month, day: d.day };
}

/** 삭 k 번째가 든 날 */
function newMoonDay(k: number): number {
  return kstDayOf(newMoonJde(k));
}

/** 그 날 이전(같은 날 포함)의 마지막 삭이 몇 번째인지 */
function newMoonIndexOnOrBefore(day: number): number {
  let k = Math.round((day - 2451550.09766) / 29.530588861);
  // 추정에서 한두 칸 어긋날 수 있다. 양쪽으로 좁힌다.
  while (newMoonDay(k) > day) k -= 1;
  while (newMoonDay(k + 1) <= day) k += 1;
  return k;
}

/** 중기 번호 — 태양 황경을 30°로 나눈 몫. 이 값이 달 안에서 바뀌면 중기가 든 것이다. */
function majorTermIndex(day: number): number {
  return Math.floor(apparentSolarLongitude(kstMidnightJde(day)) / 30);
}

/** 그 해 동지(황경 270°)가 든 날 */
function winterSolsticeDay(year: number): number {
  // 12월 22일 언저리에서 시작해 뉴턴법으로 푼다 (astro 의 해찾기와 같은 방식).
  let jde = toJulianDay(year, 12, 22, 0, 0, 0);
  for (let i = 0; i < 12; i += 1) {
    const cur = apparentSolarLongitude(jde);
    let diff = 270 - cur;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const step = diff / 0.9856473;
    jde += step;
    if (Math.abs(step) < 1e-7) break;
  }
  return kstDayOf(jde);
}

export type LunarMonth = {
  /** 이 달이 시작하는 날 (한국 표준시 기준 '며칠') */
  start: number;
  /** 다음 달이 시작하는 날 */
  next: number;
  /** 음력 달 번호 1~12 */
  num: number;
  /** 윤달이면 true */
  leap: boolean;
  /** 이 달이 속한 음력 해 */
  lunarYear: number;
};

const suiCache = new Map<number, LunarMonth[]>();

/**
 * 동지달에서 다음 동지달까지 한 바퀴(歲)를 세운다.
 * solarYear 의 12월 동지로 끝나는 구간이다 — 즉 시작은 solarYear-1 의 동지달.
 */
function buildSui(solarYear: number): LunarMonth[] {
  const cached = suiCache.get(solarYear);
  if (cached) return cached;

  const startK = newMoonIndexOnOrBefore(winterSolsticeDay(solarYear - 1));
  const endK = newMoonIndexOnOrBefore(winterSolsticeDay(solarYear));
  const count = endK - startK; // 12 또는 13

  const starts: number[] = [];
  for (let i = 0; i <= count; i += 1) starts.push(newMoonDay(startK + i));

  // 윤달 찾기 — 중기가 없는 첫 달. 0번(동지달)은 동지가 들어 있으니 언제나 제외된다.
  let leapAt = -1;
  if (count === 13) {
    for (let i = 1; i < count; i += 1) {
      if (majorTermIndex(starts[i]) === majorTermIndex(starts[i + 1])) {
        leapAt = i;
        break;
      }
    }
    // 13개인데 중기 빠진 달을 못 찾으면 계산이 어긋난 것이다. 조용히 넘기지 않는다.
    if (leapAt === -1) throw new Error(`음력 ${solarYear}: 13개월인데 윤달을 못 찾았어요`);
  }

  const months: LunarMonth[] = [];
  let num = 11;
  let lunarYear = solarYear - 1;
  for (let i = 0; i < count; i += 1) {
    const leap = i === leapAt;
    if (!leap && i > 0) {
      num += 1;
      if (num > 12) {
        num = 1;
        lunarYear += 1;
      }
    }
    months.push({ start: starts[i], next: starts[i + 1], num, leap, lunarYear });
  }

  suiCache.set(solarYear, months);
  return months;
}

export type LunarDate = {
  year: number;
  month: number;
  day: number;
  /** 윤달이면 true */
  leap: boolean;
};

/** 양력 → 음력 */
export function solarToLunar(year: number, month: number, day: number): LunarDate {
  const d = kstDayFromSolar(year, month, day);
  // 12월 하순은 다음 바퀴에 들어가 있을 수 있다. 둘 다 세워 들어맞는 쪽을 쓴다.
  const next = buildSui(year + 1);
  const months = d >= next[0].start ? next : buildSui(year);
  for (const m of months) {
    if (d >= m.start && d < m.next) {
      return { year: m.lunarYear, month: m.num, day: d - m.start + 1, leap: m.leap };
    }
  }
  throw new Error(`음력으로 옮길 수 없는 날짜예요: ${year}-${month}-${day}`);
}

/** 음력 → 양력. 없는 날짜(윤달이 아닌 해의 윤달, 30일이 없는 달의 30일)면 null. */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  leap = false,
): { year: number; month: number; day: number } | null {
  if (lunarMonth < 1 || lunarMonth > 12 || lunarDay < 1 || lunarDay > 30) return null;
  // 음력 11·12월은 앞 바퀴 머리에, 1~10월은 뒤 바퀴 몸통에 들어 있다.
  for (const sui of [buildSui(lunarYear), buildSui(lunarYear + 1)]) {
    for (const m of sui) {
      if (m.lunarYear !== lunarYear || m.num !== lunarMonth || m.leap !== leap) continue;
      if (lunarDay > m.next - m.start) return null;
      return solarFromKstDay(m.start + lunarDay - 1);
    }
  }
  return null;
}

/** 그 음력 해의 윤달 번호. 윤달이 없으면 null. */
export function leapMonthOf(lunarYear: number): number | null {
  for (const sui of [buildSui(lunarYear), buildSui(lunarYear + 1)]) {
    for (const m of sui) {
      if (m.lunarYear === lunarYear && m.leap) return m.num;
    }
  }
  return null;
}

/** 그 음력 달의 날수 (29 또는 30). 없는 달이면 null. */
export function lunarMonthLength(
  lunarYear: number,
  lunarMonth: number,
  leap = false,
): number | null {
  for (const sui of [buildSui(lunarYear), buildSui(lunarYear + 1)]) {
    for (const m of sui) {
      if (m.lunarYear === lunarYear && m.num === lunarMonth && m.leap === leap) {
        return m.next - m.start;
      }
    }
  }
  return null;
}
