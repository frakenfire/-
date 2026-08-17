// 십신(十神) · 오행 분포 · 신강신약 — 세운 여덟 글자를 '이 사람은 어떤 사람인가' 로 읽는다.
//
// 명리의 핵심 전환: 사주의 주인공은 '일간(日干)' 이다. 나머지 일곱 글자는 전부
// 일간과의 관계로만 의미를 갖는다. 그 관계 열 가지가 십신이고, 십신이 곧 성격·재능·관계다.
//
// 이 파일은 규칙만 담는다. 해석 문장은 dayMasterContent.ts 로 분리해,
// 규칙이 바뀌지 않는 한 문장을 고쳐도 계산 결과가 흔들리지 않게 했다.

import { STEMS, BRANCHES, type Element } from './saju.ts';
import type { FourPillars } from './fourPillars.ts';

export type TenGod =
  | 'bijian' // 비견 — 나와 같은 나
  | 'geopjae' // 겁재 — 나를 닮았지만 다투는 나
  | 'siksin' // 식신 — 내가 만들어내는 것
  | 'sanggwan' // 상관 — 내가 터뜨리는 것
  | 'pyeonjae' // 편재 — 크게 굴리는 재물
  | 'jeongjae' // 정재 — 차곡차곡 쌓는 재물
  | 'pyeongwan' // 편관(칠살) — 나를 밀어붙이는 압력
  | 'jeonggwan' // 정관 — 나를 세우는 규율
  | 'pyeonin' // 편인 — 치우친 배움
  | 'jeongin'; // 정인 — 나를 먹이는 배움

export const TEN_GOD_KO: Record<TenGod, string> = {
  bijian: '비견',
  geopjae: '겁재',
  siksin: '식신',
  sanggwan: '상관',
  pyeonjae: '편재',
  jeongjae: '정재',
  pyeongwan: '편관',
  jeonggwan: '정관',
  pyeonin: '편인',
  jeongin: '정인',
};

/** 십신을 성격 축으로 묶은 다섯 무리 — 화면에서는 이 단위로 말하는 게 알아듣기 쉽다. */
export type GodGroup = 'self' | 'output' | 'wealth' | 'authority' | 'support';
export const GOD_GROUP_OF: Record<TenGod, GodGroup> = {
  bijian: 'self',
  geopjae: 'self',
  siksin: 'output',
  sanggwan: 'output',
  pyeonjae: 'wealth',
  jeongjae: 'wealth',
  pyeongwan: 'authority',
  jeonggwan: 'authority',
  pyeonin: 'support',
  jeongin: 'support',
};
export const GOD_GROUP_KO: Record<GodGroup, string> = {
  self: '비겁(나)',
  output: '식상(표현)',
  wealth: '재성(성과)',
  authority: '관성(책임)',
  support: '인성(배움)',
};

// ── 오행 생극 (이 파일 안에서 완결) ────────────────────────────────────────
const GENERATES: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};
const CONTROLS: Record<Element, Element> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

/** 천간 인덱스의 음양. 짝수(甲丙戊庚壬)가 양. */
function isYang(stemIdx: number): boolean {
  return stemIdx % 2 === 0;
}

/**
 * 일간에서 본 어떤 천간의 십신.
 * 같은 오행이면 비겁, 내가 생하면 식상, 내가 극하면 재성, 나를 극하면 관성, 나를 생하면 인성.
 * 그 안에서 음양이 같으면 편(偏)/비견 계열, 다르면 정(正)/겁재 계열로 갈린다.
 */
export function tenGodOf(dayStem: number, otherStem: number): TenGod {
  const me = STEMS[dayStem].el;
  const other = STEMS[otherStem].el;
  const same = isYang(dayStem) === isYang(otherStem);

  if (other === me) return same ? 'bijian' : 'geopjae';
  if (GENERATES[me] === other) return same ? 'siksin' : 'sanggwan';
  if (CONTROLS[me] === other) return same ? 'pyeonjae' : 'jeongjae';
  if (CONTROLS[other] === me) return same ? 'pyeongwan' : 'jeonggwan';
  return same ? 'pyeonin' : 'jeongin'; // GENERATES[other] === me
}

// ── 지장간(支藏干) ─────────────────────────────────────────────────────────
// 지지 안에 숨어 있는 천간들. 사주를 오행으로 저울질할 때 지지를 통째로 한 덩어리로
// 세면 틀린다 — 예컨대 丑(축)은 흙이지만 안에 물과 쇠를 품고 있다.
// 배열 순서 = 여기(餘氣) → 중기(中氣) → 본기(本氣). 본기가 그 지지의 대표다.
const HIDDEN_STEMS: number[][] = [
  [8, 9], // 子 壬癸
  [9, 7, 5], // 丑 癸辛己
  [4, 2, 0], // 寅 戊丙甲
  [0, 1], // 卯 甲乙
  [1, 9, 4], // 辰 乙癸戊
  [4, 6, 2], // 巳 戊庚丙
  [2, 5, 3], // 午 丙己丁
  [3, 1, 5], // 未 丁乙己
  [4, 8, 6], // 申 戊壬庚
  [6, 7], // 酉 庚辛
  [7, 3, 4], // 戌 辛丁戊
  [4, 0, 8], // 亥 戊甲壬
];
// 지장간 비중 — 본기가 가장 무겁다. 셋일 때 0.1/0.3/0.6, 둘일 때 0.3/0.7.
const HIDDEN_WEIGHTS: Record<number, number[]> = {
  2: [0.3, 0.7],
  3: [0.1, 0.3, 0.6],
};

/** 지지의 본기(대표 천간) */
export function mainHiddenStem(branch: number): number {
  const arr = HIDDEN_STEMS[branch];
  return arr[arr.length - 1];
}

export type ElementBalance = Record<Element, number>;

export type SajuProfile = {
  /** 오행별 비중 (합계 1). 지지는 지장간으로 풀어서 센다. */
  balance: ElementBalance;
  /** 가장 많은 오행 / 아예 없는 오행 */
  strongest: Element;
  missing: Element[];
  /** 일간을 돕는 세력의 비율 (비겁 + 인성) */
  supportRatio: number;
  /** 신강(身强) / 신약(身弱) */
  strength: 'strong' | 'weak';
  /** 득령(得令) — 태어난 달이 나를 돕는가. 명리에서 가장 무게가 큰 자리다. */
  hasSeasonalSupport: boolean;
  /** 억부용신 — 치우침을 되돌리는 오행 */
  usefulElement: Element;
  /** 여덟 글자 각각의 십신 (지지는 본기 기준) */
  gods: { position: '년간' | '년지' | '월간' | '월지' | '일지' | '시간' | '시지'; god: TenGod }[];
  /** 십신 무리별 비중 (합계 1) — 성격 해석의 뼈대 */
  groupWeights: Record<GodGroup, number>;
  /** 가장 두드러진 십신 무리 */
  dominantGroup: GodGroup;
};

function emptyBalance(): ElementBalance {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
}

/**
 * 사주 여덟 글자 → 오행 저울 + 신강신약 + 십신 분포.
 *
 * 계량 방식(문서화된 선택):
 *  - 천간 4자는 각 1.0, 지지 4자도 각 1.0 을 지장간 비중으로 나눠 배분한다.
 *  - 시주를 모르면 여섯 글자로만 계산한다(총합은 다시 1로 정규화).
 *  - 신강신약은 억부법 — (비겁+인성) 비율에 월령 가중 0.1 을 더해 0.5 를 기준으로 가른다.
 *    학파마다 조후·통근을 더 보지만, 우리는 근거를 화면에 그대로 보여줄 수 있는
 *    투명한 규칙을 택했다.
 */
export function analyzeSaju(p: FourPillars): SajuProfile {
  const dayStem = p.dayStem;
  const balance = emptyBalance();

  const stems: number[] = [p.year.stem, p.month.stem];
  if (p.hour) stems.push(p.hour.stem);
  const branches: number[] = [p.year.branch, p.month.branch, p.day.branch];
  if (p.hour) branches.push(p.hour.branch);

  // 일간 자신도 저울에 올린다 — '나'의 무게가 빠지면 신강신약이 성립하지 않는다.
  balance[STEMS[dayStem].el] += 1;
  for (const s of stems) balance[STEMS[s].el] += 1;
  for (const b of branches) {
    const hidden = HIDDEN_STEMS[b];
    const w = HIDDEN_WEIGHTS[hidden.length];
    hidden.forEach((s, i) => {
      balance[STEMS[s].el] += w[i];
    });
  }

  const total = Object.values(balance).reduce((a, b) => a + b, 0);
  (Object.keys(balance) as Element[]).forEach((k) => {
    balance[k] = balance[k] / total;
  });

  const me = STEMS[dayStem].el;
  // 나를 돕는 것: 나와 같은 오행(비겁) + 나를 생하는 오행(인성)
  const supporter = (Object.keys(GENERATES) as Element[]).find((e) => GENERATES[e] === me)!;
  const supportRatio = balance[me] + balance[supporter];

  // 득령 — 월지의 본기가 나를 돕는가. 계절이 내 편인지를 본다.
  const monthMain = STEMS[mainHiddenStem(p.month.branch)].el;
  const hasSeasonalSupport = monthMain === me || monthMain === supporter;

  const strength = supportRatio + (hasSeasonalSupport ? 0.1 : 0) >= 0.5 ? 'strong' : 'weak';

  // 억부용신 — 강하면 덜어내고(내가 생하는 오행), 약하면 채운다(나를 생하는 오행).
  const usefulElement = strength === 'strong' ? GENERATES[me] : supporter;

  const gods: SajuProfile['gods'] = [
    { position: '년간', god: tenGodOf(dayStem, p.year.stem) },
    { position: '년지', god: tenGodOf(dayStem, mainHiddenStem(p.year.branch)) },
    { position: '월간', god: tenGodOf(dayStem, p.month.stem) },
    { position: '월지', god: tenGodOf(dayStem, mainHiddenStem(p.month.branch)) },
    { position: '일지', god: tenGodOf(dayStem, mainHiddenStem(p.day.branch)) },
  ];
  if (p.hour) {
    gods.push({ position: '시간', god: tenGodOf(dayStem, p.hour.stem) });
    gods.push({ position: '시지', god: tenGodOf(dayStem, mainHiddenStem(p.hour.branch)) });
  }

  const groupWeights: Record<GodGroup, number> = {
    self: 0,
    output: 0,
    wealth: 0,
    authority: 0,
    support: 0,
  };
  for (const g of gods) groupWeights[GOD_GROUP_OF[g.god]] += 1 / gods.length;

  let dominantGroup: GodGroup = 'self';
  for (const k of Object.keys(groupWeights) as GodGroup[]) {
    if (groupWeights[k] > groupWeights[dominantGroup]) dominantGroup = k;
  }

  const els = Object.keys(balance) as Element[];
  let strongest = els[0];
  for (const e of els) if (balance[e] > balance[strongest]) strongest = e;
  // '없는 오행' — 0.03 미만이면 사실상 비어 있다고 본다(지장간 여기 하나만 걸친 경우).
  const missing = els.filter((e) => balance[e] < 0.03);

  return {
    balance,
    strongest,
    missing,
    supportRatio,
    strength,
    hasSeasonalSupport,
    usefulElement,
    gods,
    groupWeights,
    dominantGroup,
  };
}

/** 지지가 품은 천간들 — 화면에서 '내 지지 속에 숨은 글자' 를 보여줄 때 쓴다. */
export function hiddenStemsOf(branch: number): { stem: number; hanja: string; weight: number }[] {
  const hidden = HIDDEN_STEMS[branch];
  const w = HIDDEN_WEIGHTS[hidden.length];
  return hidden.map((s, i) => ({ stem: s, hanja: STEMS[s].hanja, weight: w[i] }));
}

/** 지지 인덱스 → 한자 (외부에서 BRANCHES 를 직접 만지지 않게) */
export function branchHanja(branch: number): string {
  return BRANCHES[branch].hanja;
}
