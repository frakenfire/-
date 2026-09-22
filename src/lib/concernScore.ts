import { computeFourPillars, type BirthInput, type FourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import type { Gender } from './daeun.ts';
import { tenGodOf, mainHiddenStem, GOD_GROUP_OF, TEN_GOD_KO, type TenGod } from './tenGods.ts';
import { scoreOf, slotOf, type Band, type Favor, type TimingRead, BAND_WORD } from './timing.ts';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { godLineOf } from '../data/concernGodOverride.ts';
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
 * 점수를 푸는 줄의 뒷부분.
 *
 * 앞머리가 '밀어붙이는 기운이' 라 주격이 이미 쓰였다. 여기에 또 주격을 붙이면
 * '기운이 몸이 무리 없이' 가 된다. 이 자리는 부사격('에')이다. 화면을 찍어
 * 보고서야 잡았고, 밴드마다 다른 문장이라 한 번 뽑은 화면으로는 다 안 나온다.
 * 그래서 문장을 밖으로 빼 여섯 가지를 직접 검사한다.
 *
 * '이 고민' 이라고 쓰면 앱이 아는 것을 일부러 안 말하는 게 된다. 돈을 물은
 * 사람에게는 돈이라고 한다. label 을 그대로 쓰면 '몸과 컨디션은 70점이에요 …
 * 몸과 컨디션에' 로 무거워져서 concerns.ts 의 shortName 을 쓴다.
 */
/**
 * 점수가 높은 줄과 낮은 줄에 붙이는 뒷말.
 *
 * 전에는 '돈에 바로 보탬이 돼요' 처럼 점수만 말했다. 그런데 앞에 붙는 말
 * (pull)은 무슨 일이 일어나는지를 적은 것이라 좋고 나쁨이 없다. 둘을 이으니
 * '미뤄둔 다툼이 상대와의 사이에서 올라오는 때라 연애에 바로 보탬이 돼요'
 * 처럼 앞뒤가 거꾸로인 문장이 나왔다. 다툼이 나는데 보탬이 된다는 말이다.
 *
 * 점수 대신 할 일을 말한다. 높은 줄에는 지금 통하는 것을, 낮은 줄에는
 * 조심할 것을. CONCERN_GOD 에 고민마다 이미 적혀 있다.
 */
function highTail(good: string): string {
  // 예순 개 중 여덟은 '것' 이 아니라 딴 말로 끝난다('동료와 나눠서 하는 일',
  // '받을 수 있는 지원금이나 환급'). '것' 만 보고 자르면 '지금은 동료와
  // 나눠서 하는 일 통해요' 가 된다. 받침을 보고 조사를 붙인다.
  const body = good.endsWith('것') ? `${good.slice(0, -1)}게` : withJosa(good, '이가');
  return `지금은 ${body} 통해요`;
}
function lowTail(care: string): string {
  // '한 사람을 두고 경쟁이 붙는 것' -> '한 사람을 두고 경쟁이 붙는 것만 조심하면 돼요'
  return `${care}만 조심하면 돼요`;
}

export function scoreVerdictLine(
  score: ConcernScore,
  concern: ConcernKey,
  optionKey: string | null = null,
): string {
  // 고른 상황과 부딪히는 칸은 덮어서 가져온다.
  const G = (god: TenGod) => godLineOf(concern, optionKey, god);
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
  return (
    // '다섯 칸' 이라고만 하면 어느 다섯인지 화면에서 못 찾는다. 바로 위에
    // 다섯 줄짜리 표가 있으니 그걸 가리키고, 몇 점인지도 같이 적는다.
    //
    // pull 을 여기 넣으면 안 된다. pull 은 그 기운이 무슨 일을 일으키는지를
    // 적은 것이라 좋고 나쁨이 없다. 그런데 이 줄은 '가장 높아요' 라고 말한
    // 바로 뒤라 읽는 사람은 그걸 높은 이유로 읽는다. 그래서
    // '지금 지나는 십 년이 가장 높아요. 지금 지나는 십 년은 남의 감정까지
    // 떠안게 되는 때예요' 가 화면에 나가 있었다. 제일 높은 칸인데 읽으면
    // 제일 나쁜 칸이다. pull 의 집은 '왜 이렇게 봤나요' 줄 하나뿐이다.
    //
    // 높은 칸에는 지금 통하는 것(good)을, 낮은 칸에는 조심할 것(care)을
    // 붙인다. 둘 다 고민을 보고 쓴 말이라 돈을 물으면 돈 얘기가 나온다.
    `${head} 위 다섯 줄 중 ${withJosa(top.k, '이가')} ${top.score}점으로 가장 높아요. ` +
    `그래서 ${highTail(G(top.god!).good)}. ` +
    `가장 낮은 건 ${low.k} ${low.score}점이에요. ` +
    `${lowTail(G(low.god!).care)}.`
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
