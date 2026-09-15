import { computeFourPillars, type BirthInput, type FourPillars } from './fourPillars.ts';
import { tenGodOf, GOD_GROUP_OF, TEN_GOD_KO, type GodGroup, type TenGod } from './tenGods.ts';
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
  tenGod: TenGod;
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

function favorOf(concern: ConcernKey, gender: Gender | null) {
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

function scoreOf(group: GodGroup, tenGod: TenGod, favor: { good: GodGroup[]; ok: GodGroup[]; hard: GodGroup[] }): { score: number; band: Band } {
  // 같은 무리 안에서도 정(正)이 편(偏)보다 순하게 들어온다. 한 칸 차이를 준다.
  const gentle = ['jeongjae', 'jeonggwan', 'jeongin', 'siksin', 'bijian'].includes(tenGod);
  if (favor.good.includes(group)) return { score: gentle ? 92 : 86, band: 'good' };
  if (favor.hard.includes(group)) return { score: gentle ? 58 : 50, band: 'hard' };
  if (favor.ok.includes(group)) return { score: gentle ? 76 : 71, band: 'ok' };
  return { score: gentle ? 70 : 65, band: 'ok' };
}

function slotOf(
  dayStem: number,
  stem: number,
  label: string,
  year: number,
  month: number | null,
  favor: { good: GodGroup[]; ok: GodGroup[]; hard: GodGroup[] },
): TimingSlot {
  const tenGod = tenGodOf(dayStem, stem);
  const group = GOD_GROUP_OF[tenGod];
  const { score, band } = scoreOf(group, tenGod, favor);
  return { label, year, month, tenGod, group, score, band };
}

/** 사주로 치는 해의 천간. 입춘 전이면 지난해로 본다. */
export function yearStemOf(sajuYear: number): number {
  return (((sajuYear - 4) % 10) + 10) % 10;
}

/** 그 달의 월간. 절기로 갈리므로 만세력을 그대로 돌린다. */
function monthStemOf(y: number, m: number): number {
  return computeFourPillars({ year: y, month: m, day: 15, hour: 12 }).month.stem;
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
    ? slotOf(dayStem, daeun.current.stem, `${daeun.current.startAge}세부터`, 0, null, favor)
    : null;

  const y0 = now.getFullYear();
  const beforeIpchun = now.getMonth() + 1 < 2 || (now.getMonth() + 1 === 2 && now.getDate() < 4);
  const sajuYear = beforeIpchun ? y0 - 1 : y0;
  const years: TimingSlot[] = [0, 1, 2].map((i) =>
    slotOf(dayStem, yearStemOf(sajuYear + i), `${sajuYear + i}년`, sajuYear + i, null, favor),
  );

  const months: TimingSlot[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(y0, now.getMonth() + i, 15);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    months.push(slotOf(dayStem, monthStemOf(y, m), `${y}년 ${m}월`, y, m, favor));
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

export function godWord(tenGod: TenGod): string {
  return TEN_GOD_KO[tenGod];
}
