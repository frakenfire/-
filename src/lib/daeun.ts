import { apparentSolarLongitude, deltaTSeconds, solveSolarLongitude, toJulianDay } from './astro.ts';
import { koreaOffsetAt } from './koreaTime.ts';
import { STEMS, BRANCHES } from './saju.ts';
import { RULESET } from './sajuRuleset.ts';
import type { BirthInput, FourPillars } from './fourPillars.ts';

// 대운(大運) — 십 년 단위로 갈리는 삶의 배경.
//
// 사주 상품이 파는 건 '나는 어떤 사람인가' 가 아니라 '언제냐' 다. 그 언제의 뼈대가 대운이다.
// 계산은 셋으로 끝난다.
//  (1) 방향 — 태어난 해의 천간이 양이고 남자면 순행, 음이고 남자면 역행. 여자는 반대.
//  (2) 시작 나이 — 순행이면 다음 절입까지, 역행이면 지난 절입까지의 날수를 셋으로 나눈다.
//      사흘이 한 해라는 관법. 절입은 달력의 1일이 아니라 입춘·경칩 같은 절기다.
//  (3) 기둥 — 월주에서 방향대로 60갑자를 하나씩 옮긴다.

export type Gender = 'male' | 'female';

export type DaeunPillar = {
  /** 0부터 — 첫 대운이 0 */
  index: number;
  /** 이 대운이 시작되는 나이(세는 나이 기준의 대운수) */
  startAge: number;
  endAge: number;
  stem: number;
  branch: number;
  kor: string;
  hanja: string;
  ganzhi: number;
};

export type DaeunSet = {
  /** 순행이면 true */
  forward: boolean;
  /** 대운수 — 첫 대운이 들어오는 나이 */
  startAge: number;
  pillars: DaeunPillar[];
  /** 지금 지나는 대운 */
  current: DaeunPillar | null;
  /** 다음 대운 */
  next: DaeunPillar | null;
  /** 지금 대운이 끝나기까지 남은 해 */
  yearsToNext: number | null;
  /** 만 나이 */
  age: number;
};

function pillarAt(ganzhi: number): { stem: number; branch: number; kor: string; hanja: string; ganzhi: number } {
  const g = ((ganzhi % 60) + 60) % 60;
  const stem = g % 10;
  const branch = g % 12;
  return {
    stem,
    branch,
    ganzhi: g,
    kor: `${STEMS[stem].kor}${BRANCHES[branch].kor}`,
    hanja: `${STEMS[stem].hanja}${BRANCHES[branch].hanja}`,
  };
}

/** 태어난 순간의 율리우스일(세계시). 사주 계산과 같은 기준을 쓴다. */
function birthJdUt(input: BirthInput): number {
  const { year, month, day, hour, minute = 0 } = input;
  const clockHour = hour ?? 12;
  const clockMinute = hour === null ? 0 : minute;
  const off = koreaOffsetAt(year, month, day, clockHour, clockMinute);
  return toJulianDay(year, month, day, clockHour, clockMinute, 0) - off.offsetMin / 1440;
}

/**
 * 대운수 — 절입까지의 날수를 셋으로 나눈다.
 * 나머지는 하루면 버리고 이틀이면 올린다(사흘이 한 해이므로 반올림과 같다).
 */
export function daeunStartAge(input: BirthInput, forward: boolean): number {
  const jdUt = birthJdUt(input);
  const jde = jdUt + deltaTSeconds(input.year, input.month) / 86400;
  const lambda = apparentSolarLongitude(jde);
  // 입춘(315°)부터 30° 씩 끊은 칸 안에서 내가 어디쯤인지
  const progress = (((lambda - 315) % 360) + 360) % 360;
  const monthOrder = Math.floor(progress / 30);

  // 이번 칸의 시작과 다음 칸의 시작. 황경은 한 바퀴를 돌므로 360 으로 접는다.
  const thisTerm = (315 + 30 * monthOrder) % 360;
  const nextTerm = (315 + 30 * (monthOrder + 1)) % 360;
  // 초기값을 한쪽으로 살짝 밀어야 같은 해의 옆 절기로 수렴한다 (하루 = 약 1°)
  const target = forward ? nextTerm : thisTerm;
  const guess = jde + (forward ? 30 - progress % 30 : -(progress % 30));
  const termJde = solveSolarLongitude(target, guess);

  const days = Math.abs(termJde - jde);
  // 사흘이 한 해라는 관법. 남은 하루를 올릴지 버릴지가 학파마다 갈려 RULESET 이 정한다.
  const age = RULESET.daeunStartRounding === 'floor'
    ? Math.floor(days / 3)
    : Math.round(days / 3);
  // 절입에 바싹 붙어 태어나도 첫 대운은 한 살부터 본다
  return Math.max(1, Math.min(10, age));
}

/** 태어난 해의 천간이 양(甲丙戊庚壬)인가 */
export function isYangYearStem(yearStem: number): boolean {
  return yearStem % 2 === 0;
}

export function computeDaeun(
  input: BirthInput,
  pillars: FourPillars,
  gender: Gender,
  now: Date = new Date(),
): DaeunSet {
  const yang = isYangYearStem(pillars.year.stem);
  const male = gender === 'male';
  // 양남음녀는 순행, 음남양녀는 역행
  const forward = yang === male;
  const startAge = daeunStartAge(input, forward);

  const pillarsOut: DaeunPillar[] = [];
  for (let i = 0; i < 10; i += 1) {
    const g = pillarAt(pillars.month.ganzhi + (forward ? i + 1 : -(i + 1)));
    pillarsOut.push({
      index: i,
      startAge: startAge + i * 10,
      endAge: startAge + i * 10 + 9,
      ...g,
    });
  }

  // 만 나이 — 생일이 지났는지로 가른다
  const y = now.getFullYear();
  const passed =
    now.getMonth() + 1 > input.month ||
    (now.getMonth() + 1 === input.month && now.getDate() >= input.day);
  const age = Math.max(0, y - input.year - (passed ? 0 : 1));

  const current = pillarsOut.find((p) => age >= p.startAge && age <= p.endAge) ?? null;
  const next = current ? pillarsOut[current.index + 1] ?? null : pillarsOut[0] ?? null;
  const yearsToNext = current ? current.endAge + 1 - age : startAge - age;

  return { forward, startAge, pillars: pillarsOut, current, next, yearsToNext, age };
}
