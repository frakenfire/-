// 사주팔자(四柱八字) — 태어난 순간을 네 기둥(년·월·일·시), 여덟 글자로 세운다.
//
// 이 파일이 하는 일은 딱 하나: '사람이 기억하는 시계 시각' 을 '명리가 쓰는 좌표' 로 옮기는 것.
// 그 사이에 함정이 네 개 있고, 하나라도 빠뜨리면 남의 사주가 나온다.
//
//  (1) 년주는 1월 1일이 아니라 '입춘' 에 바뀐다. 2월 3일생과 2월 5일생은 띠가 다르다.
//  (2) 월주는 달력의 달이 아니라 '절기' 로 나뉜다. 경계는 태양 황경 15°의 배수 — 천문 계산이 필요하다.
//  (3) 태어난 해에 한국 표준시가 +8:30 이었거나 서머타임 중이었을 수 있다.
//  (4) 명리는 시계 시각이 아니라 태양의 실제 위치(진태양시)로 시주를 세운다. 서울은 -32분.
//
// 학파가 갈리는 지점은 옵션으로 열어두되 기본값을 명시한다 (아래 NightZiPolicy 참고).

import { apparentSolarLongitude, deltaTSeconds, toJulianDay, fromJulianDay, solveSolarLongitude } from './astro.ts';
import { koreaOffsetAt, SEOUL_LONGITUDE } from './koreaTime.ts';
import { STEMS, BRANCHES, toJDN, type Element } from './saju.ts';
import type { ZodiacId } from '../data/zodiac.ts';

export type Pillar = {
  /** 천간 인덱스 0~9 (0=甲) */
  stem: number;
  /** 지지 인덱스 0~11 (0=子) */
  branch: number;
  /** '갑자' */
  kor: string;
  /** '甲子' */
  hanja: string;
  /** 60갑자 인덱스 0~59 */
  ganzhi: number;
};

export type BirthInput = {
  /** 양력 생년월일. 음력 입력은 UI 단계에서 양력으로 변환해 넘긴다. */
  year: number;
  month: number;
  day: number;
  /** 태어난 시각(24시간제). 모르면 null — 시주 없이 세 기둥만 세운다. */
  hour: number | null;
  minute?: number;
  /** 태어난 곳의 경도. 기본 서울. 진태양시 보정에 쓴다. */
  longitude?: number;
  /** 진태양시 보정 사용 여부. 기본 true (한국 명리 통설). */
  trueSolar?: boolean;
};

/**
 * 야자시(夜子時, 23:00~24:00) 처리 — 학파가 갈리는 대표 지점.
 *  - 'nextDay'(기본): 자시가 하루의 시작이므로 23시부터 다음날 일주를 쓴다. 한국 만세력 다수설.
 *  - 'sameDay': 23시대는 그날의 일간을 유지하고 지지만 子 로 본다(조자시/야자시 구분설).
 */
export type NightZiPolicy = 'nextDay' | 'sameDay';

export type FourPillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  /** 태어난 시각을 모르면 null */
  hour: Pillar | null;
  /** 일간 — 명리에서 '나' 자신을 가리키는 글자 */
  dayStem: number;
  dayMaster: { hanja: string; kor: string; el: Element };
  /** 사주상의 띠 (입춘 기준이라 양력 1~2월생은 달력 띠와 다를 수 있다) */
  zodiac: ZodiacId;
  /** 달력 나이 띠와 사주 띠가 다른 경우 true — 화면에서 반드시 설명해야 하는 케이스 */
  zodiacDiffersFromCalendarYear: boolean;
  /** 계산에 실제로 적용된 보정들 — 사용자에게 근거로 보여준다 */
  corrections: {
    /** 적용된 UTC 오프셋(분) */
    offsetMin: number;
    isDst: boolean;
    /** 진태양시 보정(분). 미적용 시 0 */
    trueSolarMin: number;
    notes: string[];
  };
  /** 절기 기준으로 이 사주가 속한 달 — '입춘~경칩(인월)' 같은 표기용 */
  solarTerm: { name: string; startLongitude: number };
};

// ── 60갑자 조립 ──────────────────────────────────────────────────────────
function pillarOf(stem: number, branch: number): Pillar {
  const s = ((stem % 10) + 10) % 10;
  const b = ((branch % 12) + 12) % 12;
  // 60갑자 인덱스 — 천간 10 / 지지 12 의 최소공배수 주기에서의 위치.
  let ganzhi = 0;
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === s && i % 12 === b) {
      ganzhi = i;
      break;
    }
  }
  return {
    stem: s,
    branch: b,
    kor: `${STEMS[s].kor}${BRANCHES[b].kor}`,
    hanja: `${STEMS[s].hanja}${BRANCHES[b].hanja}`,
    ganzhi,
  };
}

// ── 12절(節) — 월주의 경계. 중기(中氣)는 월을 가르지 않으므로 뺐다. ──────────
const MONTH_TERMS: { name: string; lng: number; branch: number }[] = [
  { name: '입춘', lng: 315, branch: 2 }, // 寅月
  { name: '경칩', lng: 345, branch: 3 },
  { name: '청명', lng: 15, branch: 4 },
  { name: '입하', lng: 45, branch: 5 },
  { name: '망종', lng: 75, branch: 6 },
  { name: '소서', lng: 105, branch: 7 },
  { name: '입추', lng: 135, branch: 8 },
  { name: '백로', lng: 165, branch: 9 },
  { name: '한로', lng: 195, branch: 10 },
  { name: '입동', lng: 225, branch: 11 },
  { name: '대설', lng: 255, branch: 0 }, // 子月
  { name: '소한', lng: 285, branch: 1 }, // 丑月
];

/** 특정 해의 입춘 순간(UT 율리우스일). 년주 경계를 가른다. */
export function ipchunJdUt(year: number): number {
  // 입춘은 2월 3~5일. 그 근처에서 출발하면 뉴턴법이 몇 번에 수렴한다.
  const guessUt = toJulianDay(year, 2, 4, 0, 0, 0);
  const dt = deltaTSeconds(year, 2) / 86400;
  const jde = solveSolarLongitude(315, guessUt + dt);
  return jde - dt;
}

/**
 * 생년월일시 → 사주팔자.
 * 입력은 '태어난 곳의 시계가 가리키던 시각' 이다. 표준시 이력·서머타임·진태양시는 여기서 처리한다.
 */
export function computeFourPillars(
  input: BirthInput,
  nightZi: NightZiPolicy = 'nextDay',
): FourPillars {
  const {
    year,
    month,
    day,
    hour,
    minute = 0,
    longitude = SEOUL_LONGITUDE,
    trueSolar = true,
  } = input;

  const knowsHour = hour !== null;
  // 시각을 모르면 정오로 둔다. 자시(23시)·절기 경계에서 멀어 오판 위험이 가장 낮은 지점이다.
  const clockHour = knowsHour ? hour : 12;
  const clockMinute = knowsHour ? minute : 0;

  // (1) 그 시절 시계 기준 → UTC
  const off = koreaOffsetAt(year, month, day, clockHour, clockMinute);
  const jdUt = toJulianDay(year, month, day, clockHour, clockMinute, 0) - off.offsetMin / 1440;

  // (2) 절기 계산은 지구력시(TT) 기준
  const jde = jdUt + deltaTSeconds(year, month) / 86400;
  const lambda = apparentSolarLongitude(jde);

  // (3) 월주 — 태양 황경이 곧 절기다. 입춘(315°)부터 30° 씩 끊으면 寅월부터 순서대로 나온다.
  const progress = (((lambda - 315) % 360) + 360) % 360;
  const monthOrder = Math.floor(progress / 30); // 0 = 寅月
  const term = MONTH_TERMS[monthOrder];

  // (4) 년주 — 입춘 전이면 전년도 간지. 여기가 '2월 초생은 띠가 다르다'의 정체다.
  const sajuYear = jdUt >= ipchunJdUt(year) ? year : year - 1;
  // 서기 4년이 갑자년.
  const yearStem = (((sajuYear - 4) % 10) + 10) % 10;
  const yearBranch = (((sajuYear - 4) % 12) + 12) % 12;
  const yearPillar = pillarOf(yearStem, yearBranch);

  // (5) 월간 — 오호둔월법(五虎遁月法). 년간이 정해지면 인월의 천간이 정해지고, 거기서 순행한다.
  const yinMonthStem = (yearStem % 5) * 2 + 2;
  const monthPillar = pillarOf(yinMonthStem + monthOrder, term.branch);

  // (6) 진태양시 — 명리는 시계가 아니라 태양의 실제 위치로 하루와 시각을 나눈다.
  //     UTC 에 경도/15 시간을 더하면 그 지점의 진태양시가 된다 (서울이면 KST-32분).
  const trueSolarMin = trueSolar ? (longitude - 135) * 4 : 0;
  const jdSolar = trueSolar ? jdUt + longitude / 15 / 24 : jdUt + off.offsetMin / 1440;
  const solarLocal = fromJulianDay(jdSolar);

  // (7) 일주 — 자시(23:00)부터 다음날로 넘기는 것이 다수설.
  let dayY = solarLocal.year;
  let dayM = solarLocal.month;
  let dayD = solarLocal.day;
  if (knowsHour && nightZi === 'nextDay' && solarLocal.hour >= 23) {
    const next = fromJulianDay(Math.floor(jdSolar - 0.5) + 0.5 + 1.5); // 다음날 정오
    dayY = next.year;
    dayM = next.month;
    dayD = next.day;
  }
  const dayGanzhi = (((toJDN(dayY, dayM, dayD) + 49) % 60) + 60) % 60;
  const dayPillar = pillarOf(dayGanzhi % 10, dayGanzhi % 12);

  // (8) 시주 — 시지는 23시부터 2시간 단위, 시간은 오서둔시법(五鼠遁時法).
  let hourPillar: Pillar | null = null;
  if (knowsHour) {
    const hourBranch = Math.floor(((solarLocal.hour + 1) % 24) / 2);
    const ziStem = (dayPillar.stem % 5) * 2;
    hourPillar = pillarOf(ziStem + hourBranch, hourBranch);
  }

  const notes: string[] = [];
  if (off.note) notes.push(off.note);
  if (trueSolar) {
    notes.push(
      `태양의 실제 위치로 보정했어요 (${trueSolarMin >= 0 ? '+' : ''}${Math.round(trueSolarMin)}분)`,
    );
  }

  const zodiac = BRANCHES[yearBranch].animal;
  const calendarYearBranch = (((year - 4) % 12) + 12) % 12;

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    dayStem: dayPillar.stem,
    dayMaster: STEMS[dayPillar.stem],
    zodiac,
    zodiacDiffersFromCalendarYear: yearBranch !== calendarYearBranch,
    corrections: {
      offsetMin: off.offsetMin,
      isDst: off.isDst,
      trueSolarMin: trueSolar ? trueSolarMin : 0,
      notes,
    },
    solarTerm: { name: term.name, startLongitude: term.lng },
  };
}

/** 여덟 글자를 한자로 — '甲子 丙寅 戊午 庚申' */
export function pillarsHanja(p: FourPillars): string {
  return [p.year, p.month, p.day, p.hour]
    .filter((x): x is Pillar => x !== null)
    .map((x) => x.hanja)
    .join(' ');
}

/**
 * 경계 근접 안내 — 절기나 시주 경계에 바싹 붙어 태어난 사람에게 알린다.
 *
 * 우리 계산 오차는 1분 미만이지만, 문제는 계산이 아니라 '기억' 이다.
 * 출생 시각은 대개 분 단위로 정확하지 않고, 경계에서 1분 차이는 기둥을 통째로 바꾼다.
 * 그럴 땐 모르는 척 단정하는 것보다 사실대로 말하는 편이 낫다.
 */
export function boundaryNotice(input: BirthInput): string | null {
  const { year, month, day, hour, minute = 0, longitude = SEOUL_LONGITUDE, trueSolar = true } = input;
  if (hour === null) return null;

  const off = koreaOffsetAt(year, month, day, hour, minute);
  const jdUt = toJulianDay(year, month, day, hour, minute, 0) - off.offsetMin / 1440;
  const jde = jdUt + deltaTSeconds(year, month) / 86400;

  // 절기 경계 — 태양 황경이 30°의 배수(입춘 기준)에서 얼마나 떨어져 있는가.
  const progress = (((apparentSolarLongitude(jde) - 315) % 360) + 360) % 360;
  const degToBoundary = Math.min(progress % 30, 30 - (progress % 30));
  // 태양은 하루 약 0.9856° 이동 → 1° ≈ 1461분
  const minsToTerm = degToBoundary * 1461;
  if (minsToTerm < 120) {
    return '절기가 바뀌는 시각과 2시간 안쪽이에요. 태어난 시각이 조금만 달라도 사주가 통째로 바뀌니, 시각이 정확한지 한 번만 확인해 주세요.';
  }

  // 시주 경계 — 진태양시 기준 홀수 시(23,1,3…)마다 바뀐다.
  const jdSolar = trueSolar ? jdUt + longitude / 15 / 24 : jdUt + off.offsetMin / 1440;
  const t = fromJulianDay(jdSolar);
  const minsInto = ((t.hour + 1) % 2) * 60 + t.minute;
  const minsToHour = Math.min(minsInto, 120 - minsInto);
  if (minsToHour < 10) {
    return '시주가 바뀌는 경계와 10분 안쪽이에요. 태어난 시각이 정확하지 않다면 결과가 달라질 수 있어요.';
  }
  return null;
}
