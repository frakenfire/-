import { computeFourPillars, type BirthInput, type FourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import type { Gender } from './daeun.ts';
import { tenGodOf, mainHiddenStem, GOD_GROUP_OF, TEN_GOD_KO, type TenGod } from './tenGods.ts';
import { scoreOf, slotOf, type Band, type Favor, type TimingRead, BAND_WORD } from './timing.ts';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { withJosa } from './josa.ts';

// 점수 엔진 — 문장 엔진과 분리한다.
//
// 이 파일은 문장을 한 줄도 만들지 않는다. 명식 여덟 글자와 지금 지나는 운에서
// 숫자만 뽑는다. 모델도 난수도 날짜 seed 도 쓰지 않는다. 같은 사람, 같은 고민,
// 같은 날이면 몇 번을 계산해도 같은 숫자가 나온다.
//
// 재료와 몫:
//   타고난 구조(원국 여덟 글자)  30 - 평생 안 바뀌는 바탕
//   지금 지나는 십 년(대운)        20 - 배경
//   올해(세운)                     20
//   이번 달(월운)                  20
//   오늘(일진)                     10 - 하루치라 제일 작게
//
// 몫을 이렇게 잡은 이유는 하나다. 바탕이 제일 크고, 가까울수록 작아진다.
// 오늘 하루가 점수를 뒤집으면 그건 오늘운세지 사주가 아니다.
export const WEIGHTS = { natal: 30, daeun: 20, year: 20, month: 20, day: 10 } as const;

export type ScorePart = {
  /** '타고난 구조' */
  k: string;
  /** '2026년' 처럼 무엇을 봤는지 */
  label: string;
  /** 0~100 */
  score: number;
  band: Band;
  /** 점수에 실제로 더해진 몫 */
  weight: number;
  /** 어떤 기운으로 봤는지 — 사용자 말로 */
  godWord: string;
  /** 이 칸이 어느 십성으로 읽혔는지. 첫 대운 전이면 null */
  god: TenGod | null;
};

export type ConcernScore = {
  total: number;
  band: Band;
  parts: ScorePart[];
  /** 오늘 일진이 이 주제에 어떤 자리로 들어오는지 */
  dayGod: TenGod;
  dayBand: Band;
  /** 바탕에서 이 고민 자리가 몇 글자나 되는지 */
  natalCount: number;
  /** 바탕에서 제일 두꺼운 기운 */
  natalTopGod: TenGod;
};

/** 원국 여덟 글자를 하나씩 일간에 대어 이 고민 자리인지 본다. */
function natalScore(pillars: FourPillars, favor: Favor) {
  const dayStem = pillars.dayStem;
  // 월지는 사주에서 계절을 쥔 자리라 두 몫으로 센다. 나머지는 한 몫씩.
  const cells: { god: TenGod; w: number }[] = [];
  const push = (stem: number, w: number) => cells.push({ god: tenGodOf(dayStem, stem), w });

  push(pillars.year.stem, 1);
  push(mainHiddenStem(pillars.year.branch), 1);
  push(pillars.month.stem, 1);
  push(mainHiddenStem(pillars.month.branch), 2);
  // 일간은 '나' 자신이라 점수 재료로 세지 않는다. 일지는 센다.
  push(mainHiddenStem(pillars.day.branch), 1);
  if (pillars.hour) {
    push(pillars.hour.stem, 1);
    push(mainHiddenStem(pillars.hour.branch), 1);
  }

  let sum = 0;
  let wsum = 0;
  let favorCount = 0;
  const tally = new Map<TenGod, number>();
  for (const c of cells) {
    const s = scoreOf(GOD_GROUP_OF[c.god], c.god, favor);
    sum += s.score * c.w;
    wsum += c.w;
    if (favor.good.includes(GOD_GROUP_OF[c.god])) favorCount += 1;
    tally.set(c.god, (tally.get(c.god) ?? 0) + c.w);
  }
  const score = Math.round(sum / wsum);
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  return { score, favorCount, top };
}

function bandOf(score: number): Band {
  return score >= 84 ? 'good' : score <= 60 ? 'hard' : 'ok';
}

/**
 * 고민 하나에 대한 점수. dateKey 는 'YYYY-MM-DD'.
 * 오늘 일진까지 넣으므로 날이 바뀌면 점수도 조금 움직인다.
 */
export function computeConcernScore(
  pillars: FourPillars,
  timing: TimingRead,
  dateKey: string,
): ConcernScore {
  const favor = timing.favor;
  const natal = natalScore(pillars, favor);

  const [y, m, d] = dateKey.split('-').map((n) => Number.parseInt(n, 10));
  const today = computeFourPillars({ year: y, month: m, day: d, hour: 12 }).day;
  const daySlot = slotOf(pillars.dayStem, today.stem, today.branch, '오늘', y, m, favor);

  const daeun = timing.daeunSlot;
  const year = timing.years[0];
  const month = timing.thisMonth;

  const parts: ScorePart[] = [
    {
      k: '타고난 구조',
      label: `태어난 여덟 글자`,
      score: natal.score,
      band: bandOf(natal.score),
      weight: WEIGHTS.natal,
      godWord: TEN_GOD_KO[natal.top],
      god: natal.top,
    },
    {
      k: '지금 지나는 십 년',
      label: timing.daeun.current ? `${timing.daeun.current.startAge}세부터` : '아직 시작 전',
      score: daeun ? daeun.score : 70,
      band: daeun ? daeun.band : 'ok',
      weight: WEIGHTS.daeun,
      godWord: daeun ? TEN_GOD_KO[daeun.tenGod] : '태어난 자리 그대로',
      god: daeun ? daeun.tenGod : null,
    },
    {
      k: '올해',
      label: year.label,
      score: year.score,
      band: year.band,
      weight: WEIGHTS.year,
      godWord: TEN_GOD_KO[year.tenGod],
      god: year.tenGod,
    },
    {
      k: '이번 달',
      label: month.label,
      score: month.score,
      band: month.band,
      weight: WEIGHTS.month,
      godWord: TEN_GOD_KO[month.tenGod],
      god: month.tenGod,
    },
    {
      k: '오늘',
      label: `${m}월 ${d}일`,
      score: daySlot.score,
      band: daySlot.band,
      weight: WEIGHTS.day,
      godWord: TEN_GOD_KO[daySlot.tenGod],
      god: daySlot.tenGod,
    },
  ];

  const total = Math.round(parts.reduce((acc, p) => acc + p.score * p.weight, 0) / 100);

  return {
    total,
    band: bandOf(total),
    dayGod: daySlot.tenGod,
    dayBand: daySlot.band,
    parts,
    natalCount: natal.favorCount,
    natalTopGod: natal.top,
  };
}

/**
 * 점수를 사람 말로 푼다.
 *
 * '오늘이 열려 있어서 점수가 올랐어요' 같은 말은 아무것도 설명하지 않는다.
 * 제일 높은 칸과 제일 낮은 칸을 맞대 놓고, 그 둘이 서로 다른 쪽으로 민다는 것을
 * 보여야 숫자가 어디서 왔는지 읽힌다.
 */
export function scoreVerdictLine(score: ConcernScore, concern: ConcernKey): string {
  const c = findConcern(concern);
  const named = score.parts.filter((p) => p.god !== null);
  const sorted = [...named].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  const head = `${withJosa(c.label, '은는')} ${score.total}점이에요.`;

  if (!top || !low || top === low || top.score - low.score < 8) {
    return `${head} 다섯 칸이 비슷한 높이라 어느 한쪽이 끌고 가지 않아요. 크게 벌이기보다 하던 것을 이어가는 쪽이 남아요.`;
  }
  // 합계는 아래 설명 줄이 말한다. 여기서는 어느 칸이 올리고 어느 칸이 눌렀는지만 짚는다.
  //
  // GOD_PULL 은 고민을 안 본다. 돈을 물어도 '밀어붙이는 힘과 부담이 같이
  // 커지는 쪽' 이 나오던 자리다. 고민별로 쓴 pull 을 쓴다.
  // pull 은 '왜 이렇게 봤나요' 줄의 몫이다. 여기서도 쓰면 같은 문장이 한
  // 화면에 두 번 나온다. 이 줄은 '어느 칸이 올리고 어느 칸이 눌렀나' 만 말하고,
  // 그 기운이 무엇인지는 아래 근거 줄이 맡는다.
  // 기운을 설명하는 말에는 좋고 나쁨이 없다. '챙겨주는 마음이 오가는 쪽이라
  // 제일 낮게 잡혔고요' 처럼 앞뒤가 안 맞아 보이던 이유다. 그 기운이 이 고민에
  // 보탬이 되는지 아닌지는 점수가 이미 알고 있으니, 그걸 뒤에 붙여 말한다.
  const HIGH: Record<Band, string> = {
    good: '이 고민에 바로 힘이 되는 자리예요',
    ok: '이 고민에 무리 없이 붙는 자리예요',
    hard: '눌러도 다른 칸보다는 나은 자리예요',
  };
  const LOW: Record<Band, string> = {
    good: '다른 칸이 더 세서 밀렸어요',
    ok: '이 고민에는 덜 보탬이 돼요',
    hard: '이 고민에는 걸리는 자리예요',
  };
  return (
    `${head} 다섯 칸 중 ${withJosa(top.k, '이가')} 가장 높아요. ${TEN_GOD_KO[top.god!]}이 ${HIGH[top.band]}. ` +
    `반대로 ${withJosa(low.k, '은는')} ${TEN_GOD_KO[low.god!]}이라 ${LOW[low.band]}.`
  );
}

export { BAND_WORD };

/**
 * 사랑·돈·일·건강 네 칸의 점수. 난수가 아니라 같은 계산을 네 번 돌린 값이다.
 * 옆에 붙은 '일과 이직 73점' 과 같은 엔진에서 나와야 두 숫자가 안 어긋난다.
 */
export function computeFourScores(
  input: BirthInput,
  pillars: FourPillars,
  gender: Gender | null,
  dateKey: string,
  now: Date = new Date(),
): Record<'love' | 'money' | 'work' | 'health', number> {
  const out = {} as Record<'love' | 'money' | 'work' | 'health', number>;
  for (const k of ['love', 'money', 'work', 'health'] as const) {
    const timing = computeTiming(input, pillars, gender, k, now);
    out[k] = computeConcernScore(pillars, timing, dateKey).total;
  }
  return out;
}
