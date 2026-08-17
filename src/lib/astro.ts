// 태양 겉보기 황경(黃經) 계산 — 24절기 절입 시각을 초 단위로 구하기 위한 천문 계산.
//
// 왜 필요한가:
//   사주의 월주(月柱)는 양력도 음력도 아닌 '절기력(節氣曆)'을 쓴다. 입춘부터 인월(寅月),
//   경칩부터 묘월(卯月)… 이 경계는 태양 황경이 15°의 배수가 되는 '순간'이라
//   달력만으로는 알 수 없고 천문 계산이 필요하다.
//   경계에 걸친 사람(절입일 출생)의 사주가 통째로 달라지므로 근사로 넘길 수 없다.
//
// 방법: VSOP87D 지구 황경 급수(절단판) + 장동(章動) 주항 + 광행차.
//   - 정확도 ≈ 수 초(arcsecond) → 시간으로 환산해 1분 이내. 상용 만세력과 같은 수준이다.
//   - 서버·네트워크 없이 순수 계산이라 결정적이고, 어느 기기에서든 같은 값이 나온다.
// 출처: Jean Meeus, "Astronomical Algorithms" 2nd ed., ch. 25 (Solar Coordinates) / VSOP87.

const DEG = Math.PI / 180;

/** VSOP87D 지구 황경 급수. [진폭(1e-8 rad), 위상(rad), 각진동수(rad/천년)]
 *  진폭 100 미만 항은 버렸다 — 합쳐도 ~3" 라 목표 정확도(수 초)를 해치지 않는다. */
const L0: [number, number, number][] = [
  [175347046, 0, 0],
  [3341656, 4.6692568, 6283.07585],
  [34894, 4.6261, 12566.1517],
  [3497, 2.7441, 5753.3849],
  [3418, 2.8289, 3.5231],
  [3136, 3.6277, 77713.7715],
  [2676, 4.4181, 7860.4194],
  [2343, 6.1352, 3930.2097],
  [1324, 0.7425, 11506.7698],
  [1273, 2.0371, 529.691],
  [1199, 1.1096, 1577.3435],
  [990, 5.233, 5884.927],
  [902, 2.045, 26.298],
  [857, 3.508, 398.149],
  [780, 1.179, 5223.694],
  [753, 2.533, 5507.553],
  [505, 4.583, 18849.228],
  [492, 4.205, 775.523],
  [357, 2.92, 0.067],
  [317, 5.849, 11790.629],
  [284, 1.899, 796.298],
  [271, 0.315, 10977.079],
  [243, 0.345, 5486.778],
  [206, 4.806, 2544.314],
  [205, 1.869, 5573.143],
  [202, 2.458, 6069.777],
  [156, 0.833, 213.299],
  [132, 3.411, 2942.463],
  [126, 1.083, 20.775],
  [115, 0.645, 0.98],
  [103, 0.636, 4694.003],
  [102, 0.976, 15720.839],
  [102, 4.267, 7.114],
  [99, 6.21, 2146.17],
  [98, 0.68, 155.42],
  [86, 5.98, 161000.69],
  [85, 1.3, 6275.96],
  [85, 3.67, 71430.7],
  [80, 1.81, 17260.15],
  [79, 3.04, 12036.46],
  [75, 1.76, 5088.63],
  [74, 3.5, 3154.69],
  [74, 4.68, 801.82],
  [70, 0.83, 9437.76],
  [62, 3.98, 8827.39],
  [61, 1.82, 7084.9],
  [57, 2.78, 6286.6],
  [56, 4.39, 14143.5],
  [56, 3.47, 6279.55],
  [52, 0.19, 12139.55],
  [52, 1.33, 1748.02],
  [51, 0.28, 5856.48],
  [49, 0.49, 1194.45],
  [41, 5.37, 8429.24],
  [41, 2.4, 19651.05],
  [39, 6.17, 10447.39],
  [37, 6.04, 10213.29],
  [37, 2.57, 1059.38],
  [36, 1.71, 2352.87],
  [36, 1.78, 6812.77],
  [33, 0.59, 17789.85],
  [30, 0.44, 83996.85],
  [30, 2.74, 1349.87],
  [25, 3.16, 4690.48],
];
const L1: [number, number, number][] = [
  [628331966747, 0, 0],
  [206059, 2.678235, 6283.07585],
  [4303, 2.6351, 12566.1517],
  [425, 1.59, 3.523],
  [119, 5.796, 26.298],
  [109, 2.966, 1577.344],
  [93, 2.59, 18849.23],
  [72, 1.14, 529.69],
  [68, 1.87, 398.15],
  [67, 4.41, 5507.55],
  [59, 2.89, 5223.69],
  [56, 2.17, 155.42],
  [45, 0.4, 796.3],
  [36, 0.47, 775.52],
  [29, 2.65, 7.11],
  [21, 5.34, 0.98],
  [19, 1.85, 5486.78],
  [19, 4.97, 213.3],
  [17, 2.99, 6275.96],
  [16, 0.03, 2544.31],
  [16, 1.43, 2146.17],
  [15, 1.21, 10977.08],
  [12, 2.83, 1748.02],
  [12, 3.26, 5088.63],
  [12, 5.27, 1194.45],
  [12, 2.08, 4694],
  [11, 0.77, 553.57],
  [10, 1.3, 6286.6],
  [10, 4.24, 1349.87],
];
const L2: [number, number, number][] = [
  [52919, 0, 0],
  [8720, 1.0721, 6283.0758],
  [309, 0.867, 12566.152],
  [27, 0.05, 3.52],
  [16, 5.19, 26.3],
  [16, 3.68, 155.42],
  [10, 0.76, 18849.23],
  [9, 2.06, 77713.77],
  [7, 0.83, 775.52],
  [5, 4.66, 1577.34],
];
const L3: [number, number, number][] = [
  [289, 5.844, 6283.076],
  [35, 0, 0],
  [17, 5.49, 12566.15],
  [3, 5.2, 155.42],
];
const L4: [number, number, number][] = [
  [114, 3.142, 0],
  [8, 4.13, 6283.08],
];

function series(terms: [number, number, number][], tau: number): number {
  let sum = 0;
  for (const [a, b, c] of terms) sum += a * Math.cos(b + c * tau);
  return sum;
}

function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/**
 * 장동(章動)에 의한 황경 변화 Δψ (arcsecond).
 * 지구 자전축이 흔들려 생기며 최대 ±17" — 시간으로 환산하면 ±7분이라 절기 계산에서 무시할 수 없다.
 * Meeus ch.22 의 IAU 1980 급수 중 진폭 상위 9항. 잔차는 0.1" 미만이다.
 */
function nutationInLongitude(T: number): number {
  // 달·태양의 기본 각인자
  const D = 297.85036 + 445267.1114800 * T - 0.0019142 * T ** 2 + T ** 3 / 189474;
  const M = 357.52772 + 35999.0503400 * T - 0.0001603 * T ** 2 - T ** 3 / 300000;
  const Mp = 134.96298 + 477198.8673980 * T + 0.0086972 * T ** 2 + T ** 3 / 56250;
  const F = 93.27191 + 483202.0175380 * T - 0.0036825 * T ** 2 + T ** 3 / 327270;
  const Om = 125.04452 - 1934.1362610 * T + 0.0020708 * T ** 2 + T ** 3 / 450000;

  // [계수(0.0001"), T항 계수, D, M, M', F, Ω]
  const TERMS: [number, number, number, number, number, number, number][] = [
    [-171996, -174.2, 0, 0, 0, 0, 1],
    [-13187, -1.6, -2, 0, 0, 2, 2],
    [-2274, -0.2, 0, 0, 0, 2, 2],
    [2062, 0.2, 0, 0, 0, 0, 2],
    [1426, -3.4, 0, 1, 0, 0, 0],
    [712, 0.1, 0, 0, 1, 0, 0],
    [-517, 1.2, -2, 1, 0, 2, 2],
    [-386, -0.4, 0, 0, 0, 2, 1],
    [-301, 0, 0, 0, 1, 2, 2],
  ];

  let sum = 0;
  for (const [c, ct, cd, cm, cmp, cf, com] of TERMS) {
    const arg = (cd * D + cm * M + cmp * Mp + cf * F + com * Om) * DEG;
    sum += (c + ct * T) * Math.sin(arg);
  }
  return sum / 10000;
}

/**
 * 지구력시(TT) 기준 율리우스일 → 태양의 겉보기 황경(도, 0~360).
 * 겉보기(apparent) = 기하 황경 + 장동 + 광행차. 절기 정의가 겉보기 황경 기준이다.
 */
export function apparentSolarLongitude(jde: number): number {
  const tau = (jde - 2451545) / 365250; // 율리우스 천년
  const L =
    (series(L0, tau) +
      series(L1, tau) * tau +
      series(L2, tau) * tau ** 2 +
      series(L3, tau) * tau ** 3 +
      series(L4, tau) * tau ** 4) /
    1e8; // radians

  // 지구의 일심(日心) 황경 → 태양의 지심(地心) 황경
  const theta = norm360(L / DEG + 180);

  const T = tau * 10; // 율리우스 세기
  const dPsiArcsec = nutationInLongitude(T);

  // 광행차(aberration) — 태양-지구 거리 변동에 따라 -20.15"~-20.85" 라
  // 상수로 두어도 오차 0.4"(≈0.03초) 에 그친다.
  const aberrationDeg = -20.4898 / 3600 / 1.0000002;

  return norm360(theta + dPsiArcsec / 3600 + aberrationDeg);
}

/**
 * ΔT — 지구력시(TT) 와 세계시(UT) 의 차이(초). 지구 자전이 불규칙해 생긴다.
 * Espenak & Meeus 다항식(NASA 채택). 우리가 쓰는 1900~2100 구간만 담았다.
 * 값 자체는 최대 70초 정도지만, 절입 시각이 자정에 붙은 사람의 날짜를 가르므로 넣는다.
 */
export function deltaTSeconds(year: number, month: number): number {
  const y = year + (month - 0.5) / 12;
  if (y < 1900) {
    const t = y - 1860;
    return (
      7.62 +
      0.5737 * t -
      0.251754 * t ** 2 +
      0.01680668 * t ** 3 -
      0.0004473624 * t ** 4 +
      t ** 5 / 233174
    );
  }
  if (y < 1920) {
    const t = y - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  }
  if (y < 1941) {
    const t = y - 1920;
    return 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
  }
  if (y < 1961) {
    const t = y - 1950;
    return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
  }
  if (y < 1986) {
    const t = y - 1975;
    return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
  }
  if (y < 2005) {
    const t = y - 2000;
    return (
      63.86 +
      0.3345 * t -
      0.060374 * t ** 2 +
      0.0017275 * t ** 3 +
      0.000651814 * t ** 4 +
      0.00002373599 * t ** 5
    );
  }
  if (y < 2050) {
    const t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
  }
  const t = y - 1820;
  return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y) + 0 * t;
}

/** UTC 기준 년월일시분초 → 율리우스일(UT). 그레고리력 전용(1583년 이후). */
export function toJulianDay(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const dayFrac = day + (hour + minute / 60 + second / 3600) / 24;
  return (
    Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + dayFrac + b - 1524.5
  );
}

/** 율리우스일(UT) → UTC 년월일시분초. toJulianDay 의 역함수. */
export function fromJulianDay(jd: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  const alpha = Math.floor((z - 1867216.25) / 36524.25);
  const a = z + 1 + alpha - Math.floor(alpha / 4);
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const dayWithFrac = b - d - Math.floor(30.6001 * e) + f;
  const day = Math.floor(dayWithFrac);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  // 초 단위 반올림에서 60초/24시가 튀지 않도록 총 초로 모아 정규화한다.
  let totalSec = Math.round((dayWithFrac - day) * 86400);
  let dayCarry = 0;
  if (totalSec >= 86400) {
    totalSec -= 86400;
    dayCarry = 1;
  }
  const hour = Math.floor(totalSec / 3600);
  const minute = Math.floor((totalSec % 3600) / 60);
  const second = totalSec % 60;

  if (dayCarry === 0) return { year, month, day, hour, minute, second };
  // 자정을 넘긴 경우만 하루 더해 다시 분해한다(월말·연말 처리를 한 곳에서).
  return fromJulianDay(Math.floor(jd + 0.5) + 0.5 + (totalSec + 1) / 86400 - 1 / 86400 + 1e-9);
}

/**
 * 목표 황경(도)에 태양이 도달하는 순간을 뉴턴법으로 찾는다.
 * @param targetDeg 0~360. 절기는 15°의 배수.
 * @param guessJde  탐색 시작 시각(TT 율리우스일). 실제 시각에서 ±20일 이내면 수렴한다.
 * @returns TT 기준 율리우스일
 */
export function solveSolarLongitude(targetDeg: number, guessJde: number): number {
  let jde = guessJde;
  for (let i = 0; i < 12; i += 1) {
    const cur = apparentSolarLongitude(jde);
    // 목표와의 차이를 -180~180 으로 접어 0°/360° 경계(춘분 근처)에서 헤매지 않게 한다.
    let diff = targetDeg - cur;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    // 태양은 하루 약 0.9856° 이동. 이 근사 기울기로도 3~4회면 초 단위로 수렴한다.
    const step = diff / 0.9856473;
    jde += step;
    if (Math.abs(step) < 1e-7) break; // 약 0.01초
  }
  return jde;
}
