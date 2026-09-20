import { computeFourPillars, type BirthInput, type FourPillars } from './fourPillars.ts';
import { tenGodOf, mainHiddenStem, GOD_GROUP_OF, TEN_GOD_KO, type GodGroup, type TenGod } from './tenGods.ts';
import { computeDaeun, type DaeunSet, type Gender } from './daeun.ts';
import { CONCERN_FAVOR, LOVE_FAVOR_FEMALE, type ConcernKey } from '../data/concerns.ts';

// 시기 계산 — 고민에 대한 답을 '언제' 로 낸다.
//
// 재료는 셋이다. 지금 지나는 대운(십 년), 올해와 내년의 세운(한 해), 앞으로 열두 달의 월운.
// 각 구간의 천간을 내 일간에 대어 십신을 얻고, 그 십신이 이 고민에 힘이 되는 자리인지 본다.
// 점수는 규칙에서 바로 나온다. 난수도 없고 모델도 없다.

export type Band = 'good' | 'ok' | 'hard';

export type TimingSlot = {
  /** '2026년 11월' 또는 '2027년' */
  label: string;
  /** 정렬과 비교용 */
  year: number;
  month: number | null;
  /** 겉으로 드러나는 기운 (천간) */
  tenGod: TenGod;
  /** 속에 깔린 기운 (지지의 주된 지장간) */
  branchGod: TenGod;
  group: GodGroup;
  score: number;
  band: Band;
};

export type TimingRead = {
  favor: { good: GodGroup[]; ok: GodGroup[]; hard: GodGroup[] };
  daeun: DaeunSet;
  /** 지금 대운이 이 고민에 어떤 배경인가 */
  daeunSlot: TimingSlot | null;
  /** 올해부터 3년 */
  years: TimingSlot[];
  /** 앞으로 12달 */
  months: TimingSlot[];
  /** 가장 좋은 달 */
  bestMonth: TimingSlot;
  /** 가장 버거운 달 */
  hardMonth: TimingSlot;
  /** 가장 좋은 해 */
  bestYear: TimingSlot;
  /** 이번 달 */
  thisMonth: TimingSlot;
};

export type Favor = { good: GodGroup[]; ok: GodGroup[]; hard: GodGroup[] };

export function favorOf(concern: ConcernKey, gender: Gender | null): Favor {
  if (concern === 'love' && gender === 'female') {
    return {
      good: [...LOVE_FAVOR_FEMALE.good] as GodGroup[],
      ok: [...LOVE_FAVOR_FEMALE.ok] as GodGroup[],
      hard: [...LOVE_FAVOR_FEMALE.hard] as GodGroup[],
    };
  }
  const f = CONCERN_FAVOR[concern];
  return { good: [...f.good], ok: [...f.ok], hard: [...f.hard] };
}

export function scoreOf(group: GodGroup, tenGod: TenGod, favor: Favor): { score: number; band: Band } {
  // 같은 무리 안에서도 정(正)이 편(偏)보다 순하게 들어온다. 한 칸 차이를 준다.
  const gentle = ['jeongjae', 'jeonggwan', 'jeongin', 'siksin', 'bijian'].includes(tenGod);
  if (favor.good.includes(group)) return { score: gentle ? 92 : 86, band: 'good' };
  if (favor.hard.includes(group)) return { score: gentle ? 58 : 50, band: 'hard' };
  if (favor.ok.includes(group)) return { score: gentle ? 76 : 71, band: 'ok' };
  return { score: gentle ? 70 : 65, band: 'ok' };
}

export function slotOf(
  dayStem: number,
  stem: number,
  branch: number,
  label: string,
  year: number,
  month: number | null,
  favor: Favor,
): TimingSlot {
  const tenGod = tenGodOf(dayStem, stem);
  const branchGod = tenGodOf(dayStem, mainHiddenStem(branch));
  const group = GOD_GROUP_OF[tenGod];
  const base = scoreOf(group, tenGod, favor);
  // 겉과 속이 같은 방향이면 더 세게, 엇갈리면 중간으로 당긴다.
  // 천간만 보면 열두 달이 열 칸으로 뭉쳐서 달마다의 차이가 안 보인다.
  const inner = scoreOf(GOD_GROUP_OF[branchGod], branchGod, favor);
  const score = Math.round(base.score * 0.65 + inner.score * 0.35);
  const band: Band = score >= 84 ? 'good' : score <= 60 ? 'hard' : 'ok';
  return { label, year, month, tenGod, branchGod, group, score, band };
}

/** 사주로 치는 해의 천간. 입춘 전이면 지난해로 본다. */
export function yearStemOf(sajuYear: number): number {
  return (((sajuYear - 4) % 10) + 10) % 10;
}

/** 그 달의 월주. 절기로 갈리므로 만세력을 그대로 돌린다. */
function monthPillarOf(y: number, m: number): { stem: number; branch: number } {
  const p = computeFourPillars({ year: y, month: m, day: 15, hour: 12 }).month;
  return { stem: p.stem, branch: p.branch };
}

/** 그 해의 지지 */
export function yearBranchOf(sajuYear: number): number {
  return (((sajuYear - 4) % 12) + 12) % 12;
}

export function computeTiming(
  input: BirthInput,
  pillars: FourPillars,
  gender: Gender | null,
  concern: ConcernKey,
  now: Date = new Date(),
): TimingRead {
  const favor = favorOf(concern, gender);
  const dayStem = pillars.dayStem;
  // 성별을 모르면 순행으로 세운다. 방향이 틀려도 기둥 간격은 같아서 흐름은 읽힌다.
  const daeun = computeDaeun(input, pillars, gender ?? 'male', now);

  const daeunSlot = daeun.current
    ? slotOf(dayStem, daeun.current.stem, daeun.current.branch, `${daeun.current.startAge}세부터`, 0, null, favor)
    : null;

  const y0 = now.getFullYear();
  const beforeIpchun = now.getMonth() + 1 < 2 || (now.getMonth() + 1 === 2 && now.getDate() < 4);
  const sajuYear = beforeIpchun ? y0 - 1 : y0;
  const years: TimingSlot[] = [0, 1, 2].map((i) =>
    slotOf(dayStem, yearStemOf(sajuYear + i), yearBranchOf(sajuYear + i), `${sajuYear + i}년`, sajuYear + i, null, favor),
  );

  const months: TimingSlot[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(y0, now.getMonth() + i, 15);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const mp = monthPillarOf(y, m);
    months.push(slotOf(dayStem, mp.stem, mp.branch, `${y}년 ${m}월`, y, m, favor));
  }

  // 같은 점수면 빠른 쪽을 고른다. 기다리라는 말은 짧을수록 좋다.
  const best = [...months].sort((a, b) => b.score - a.score || months.indexOf(a) - months.indexOf(b))[0];
  const hard = [...months].sort((a, b) => a.score - b.score || months.indexOf(a) - months.indexOf(b))[0];
  const bestYear = [...years].sort((a, b) => b.score - a.score || a.year - b.year)[0];

  return {
    favor,
    daeun,
    daeunSlot,
    years,
    months,
    bestMonth: best,
    hardMonth: hard,
    bestYear,
    thisMonth: months[0],
  };
}

/** 이 달이 몇 달 뒤인가 */
export function monthsAway(slot: TimingSlot, months: TimingSlot[]): number {
  return Math.max(0, months.findIndex((m) => m.label === slot.label));
}

export const BAND_WORD: Record<Band, string> = {
  good: '좋아요',
  ok: '무난해요',
  hard: '조심할 때',
};

/**
 * 밴드 칩에 붙이는 말.
 *
 * 말만 붙이면 61점과 83점이 똑같이 '무난해요'로 나온다. 같은 화면 위쪽 표에는
 * 이번 달 78점이 찍혀 있는데 아래 칩은 무난해요라고만 하니, 78점이 왜 무난인지
 * 확인할 길이 없었다. 숫자를 같이 적어 말과 점수가 서로를 설명하게 한다.
 */
export function bandLabel(slot: { band: Band; score: number }): string {
  return `${BAND_WORD[slot.band]} ${slot.score}`;
}

export function godWord(tenGod: TenGod): string {
  return TEN_GOD_KO[tenGod];
}
