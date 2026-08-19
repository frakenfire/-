// 오늘 일진 × 내 사주 — 매일의 결과를 '띠'가 아니라 '내 일간' 기준으로 낸다.
//
// 띠 기반과의 차이:
//   띠는 12분의 1이라 같은 띠 500만 명이 같은 하루를 받는다.
//   일간 기준으로 보면 오늘 일진이 나에게 무슨 십신인지가 사람마다 다르고,
//   같은 십신이어도 내가 신강이냐 신약이냐에 따라 약이 되기도 독이 되기도 한다.
//   그래서 같은 날이 누구에겐 '만들어내는 날', 누구에겐 '밀어붙이는 날'이 된다.
//
// 출력은 기존 SajuToday 와 같은 모양을 지킨다 — 화면들이 이미 그 모양을 읽고 있어서,
// 여기만 바꿔 끼우면 결과·홈·주간 캘린더가 전부 개인 사주 기준으로 따라온다.
import {
  BRANCHES,
  STEMS,
  branchRelation,
  ganzhiIndexFromDateKey,
  ELEMENT_COLORS,
  REL_KO,
  REL_GLOSS,
  TONE_TITLE,
  TIP,
  elementFlow,
  hashSeed,
  type BranchRelation,
  type Element,
  type SajuTone,
  type SajuToday,
} from './saju.ts';
import { tenGodOf, mainHiddenStem, GOD_GROUP_OF, type TenGod, type GodGroup, type SajuProfile } from './tenGods.ts';
import { TEN_GOD_DAY, NEEDED_LINE } from '../data/tenGodDay.ts';
import { pickFreshIndex } from './pickFresh.ts';
import type { FourPillars } from './fourPillars.ts';

export type NeedFit = 'needed' | 'excess' | 'neutral';

export type DailyMe = {
  /** 개인 사주 기반임을 나타내는 표식 — 화면에서 '띠 기준' 문구를 감추는 데 쓴다 */
  personal: true;
  /** 내 일간 — 오행만으로는 특정할 수 없다(甲/乙 둘 다 목). 인덱스와 한자를 직접 싣는다. */
  myStem: number;
  myStemHanja: string;
  iljin: { hanja: string; kor: string; stemEl: Element; branchEl: Element };
  /** 오늘 일간이 내 일간에게 무슨 십신인가 — 오늘의 주제 */
  dayGod: TenGod;
  dayGodGroup: GodGroup;
  /** 오늘 일지(본기)의 십신 — 보조 주제 */
  branchGod: TenGod;
  /** 오늘 일지 × 내 일지 — 내 자리가 흔들리는지 */
  relation: BranchRelation;
  relationKo: string;
  relationGloss: string;
  /** 오늘 기운이 내게 모자란 쪽인지 넘치는 쪽인지 */
  fit: NeedFit;
  fitLine: string;
  /** 오늘 일간 오행이 내 용신인가 */
  hitsUseful: boolean;
  tone: SajuTone;
  toneWord: string;
  reading: { title: string; body: string; doThis: string; avoid: string };
  headline: string;
  myElement: Element;
  boostElement: Element;
  luckyColor: { name: string; hex: string };
};

// 톤 경계 — 띠 엔진과 점수 분포가 달라 경계도 따로 잡는다.
// 그대로 공유하면 '아주 좋아요'가 25%까지 올라가 나흘에 한 번이 되고, 그러면 말의 값이 떨어진다.
// 개인 사주 34,560 표본(1970~2005년생 × 60일)의 실제 분포에서 분위수를 떠,
// 띠 엔진과 같은 비율(great 19% / good 35% / steady 34% / caution 12%)에 맞췄다.
function personalToneOf(score: number): SajuTone {
  if (score >= 4.2) return 'great';
  if (score >= 2.4) return 'good';
  if (score >= 0.6) return 'steady';
  return 'caution';
}

const TONE_WORD: Record<SajuTone, string> = {
  great: '아주 좋아요',
  good: '순해요',
  steady: '잔잔해요',
  caution: '조심스러워요',
};

/** 신강이면 덜어내는 쪽(식상·재성·관성)이, 신약이면 채우는 쪽(인성·비겁)이 약이다. */
const DRAINING: GodGroup[] = ['output', 'wealth', 'authority'];
const FILLING: GodGroup[] = ['support', 'self'];

export function needFit(profile: SajuProfile, group: GodGroup): NeedFit {
  const helpful = profile.strength === 'strong' ? DRAINING : FILLING;
  const harmful = profile.strength === 'strong' ? FILLING : DRAINING;
  if (helpful.includes(group)) return 'needed';
  if (harmful.includes(group)) return 'excess';
  return 'neutral';
}

/**
 * 톤 점수 — 기존 띠 엔진과 같은 뼈대(기본 2에서 가감)를 써서 두 엔진의 체감이 어긋나지 않게 한다.
 * 가중치는 아래 세 축으로만 움직인다. 규칙이 적을수록 왜 이런 결과인지 설명할 수 있다.
 *   (1) 오늘 기운이 내게 필요한 쪽인가 (신강신약)  — 가장 무겁다
 *   (2) 오늘 일지가 내 일지와 어떤 관계인가        — 충·형이면 깎인다
 *   (3) 오늘 일간 오행이 내 용신인가               — 보너스
 */
export function personalScore(fit: NeedFit, rel: BranchRelation, hitsUseful: boolean): number {
  let s = 2;
  if (fit === 'needed') s += 1.3;
  else if (fit === 'excess') s -= 0.9;

  if (rel === 'trine') s += 1.4;
  else if (rel === 'union') s += 1.1;
  else if (rel === 'self') s += 0.4;
  else if (rel === 'clash') s -= 1.4;
  else if (rel === 'punish') s -= 1.1;
  else if (rel === 'harm') s -= 0.9;
  else if (rel === 'break') s -= 0.5;
  else if (rel === 'selfPunish') s -= 0.2;

  if (hitsUseful) s += 0.9;
  return s;
}

const GEN: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

/** 오늘, 이 사람에게. */
export function dailyForMe(dateKey: string, pillars: FourPillars, profile: SajuProfile): DailyMe {
  const idx = ganzhiIndexFromDateKey(dateKey);
  const todayStem = idx % 10;
  const todayBranch = idx % 12;

  const iljin = {
    hanja: STEMS[todayStem].hanja + BRANCHES[todayBranch].hanja,
    kor: STEMS[todayStem].kor + BRANCHES[todayBranch].kor,
    stemEl: STEMS[todayStem].el,
    branchEl: BRANCHES[todayBranch].el,
  };

  const dayGod = tenGodOf(pillars.dayStem, todayStem);
  const branchGod = tenGodOf(pillars.dayStem, mainHiddenStem(todayBranch));
  const dayGodGroup = GOD_GROUP_OF[dayGod];

  // 내 일지(배우자·나의 자리)와 오늘 일지의 관계. 여기가 흔들리면 하루가 껄끄럽다.
  const relation = branchRelation(todayBranch, pillars.day.branch);
  const fit = needFit(profile, dayGodGroup);
  const hitsUseful = STEMS[todayStem].el === profile.usefulElement;

  const tone = personalToneOf(personalScore(fit, relation, hitsUseful));

  // 십신은 10개뿐이라 문장이 하나면 열흘마다 같은 말이 돌아온다.
  // 축마다 다른 나눗수를 써 조합이 갈리게 하고, 직전에 본 문장은 피한다.
  const pool = TEN_GOD_DAY[dayGod];
  const seed = hashSeed(`me|${dateKey}|${pillars.dayStem}|${pillars.day.branch}`);
  const pick = (arr: string[], div: number, key: string) =>
    arr[pickFreshIndex(Math.abs(Math.trunc(seed / div)), arr.length, key)];
  const reading = {
    title: pick(pool.titles, 1, `god:title:${dayGod}`),
    body: pick(pool.bodies, 3, `god:body:${dayGod}`),
    doThis: pick(pool.doThis, 7, `god:do:${dayGod}`),
    avoid: pick(pool.avoid, 11, `god:avoid:${dayGod}`),
  };

  const myElement = pillars.dayMaster.el;
  // 개운 오행 — 나를 생해주는 오행(인성). 오늘 색의 근거가 된다.
  const boostElement = (Object.keys(GEN) as Element[]).find((e) => GEN[e] === myElement)!;
  const colors = ELEMENT_COLORS[boostElement];
  // 날짜와 일간으로 고르므로 하루 동안 고정되고, 사람마다 다르다.
  const luckyColor = colors[(idx + pillars.dayStem) % colors.length];

  return {
    personal: true,
    myStem: pillars.dayStem,
    myStemHanja: pillars.dayMaster.hanja,
    iljin,
    dayGod,
    dayGodGroup,
    branchGod,
    relation,
    relationKo: REL_KO[relation],
    relationGloss: REL_GLOSS[relation],
    fit,
    fitLine: NEEDED_LINE[fit],
    hitsUseful,
    tone,
    toneWord: TONE_WORD[tone],
    reading,
    headline: reading.title,
    myElement,
    boostElement,
    luckyColor,
  };
}

/**
 * DailyMe → SajuToday 어댑터.
 *
 * 홈·결과·주간 캘린더가 이미 SajuToday 모양을 읽고 있다. 여기서 같은 모양으로 내보내면
 * 그 화면들이 손대지 않고도 전부 개인 사주 기준으로 바뀐다.
 * (두 톤을 한 화면에 같이 띄우면 "좋대 vs 조심하래" 로 모순이 보이므로, 아예 갈아끼운다)
 */
export function asSajuToday(d: DailyMe, dateKey: string): SajuToday {
  const flow = elementFlow(d.iljin.stemEl, d.myElement);
  // 제목·팁은 기존 톤별 풀을 그대로 쓴다 — 말투가 갈리면 같은 앱처럼 안 느껴진다.
  const seed = hashSeed(`me|${dateKey}|${d.dayGod}|${d.iljin.kor}`);
  return {
    iljin: d.iljin,
    relation: d.relation,
    relationKo: d.relationKo,
    relationGloss: d.relationGloss,
    flow,
    tone: d.tone,
    toneWord: d.toneWord,
    title: TONE_TITLE[d.tone][seed % TONE_TITLE[d.tone].length],
    myElement: d.myElement,
    boostElement: d.boostElement,
    luckyColor: d.luckyColor,
    // 헤드라인은 십신에서 가져온다 — 여기가 '나를 위한 결과'의 알맹이다.
    headline: d.reading.title,
    // 팁은 십신 카드의 '오늘 하면 좋아요'와 겹치면 안 된다.
    // 실제로 같은 문장이 바로 위아래로 두 번 찍혔었다. 팁은 톤 기준 풀에서 따로 뽑는다.
    tip: TIP[d.tone][(seed >>> 3) % TIP[d.tone].length],
  };
}
