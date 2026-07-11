import { hashSeed, seededRandom } from './dateSeed';
import type { StarSignId } from '../data/starSign';
import { ARCHETYPE as ZODIAC_ARCHETYPE, SCORE_RANGE, type CompatBand, type CompatCategory, type CompatResult, type CompatVibe } from './compat';

// 별자리 궁합 — compat.ts(띠 궁합)와 같은 점수/카테고리 구조, 서양 점성술의
// 4원소(불/땅/바람/물)·정반대 별자리 이론에 근거해 쌍마다 실제로 다른 "이유"를 준다.

type Tag = 'trine' | 'compatible' | 'opposite' | 'friction' | 'same' | 'neutral';

const FIRE: StarSignId[] = ['aries', 'leo', 'sagittarius'];
const EARTH: StarSignId[] = ['taurus', 'virgo', 'capricorn'];
const AIR: StarSignId[] = ['gemini', 'libra', 'aquarius'];
const WATER: StarSignId[] = ['cancer', 'scorpio', 'pisces'];
const ELEMENTS = { fire: FIRE, earth: EARTH, air: AIR, water: WATER } as const;

// 별자리 휠에서 정확히 정반대(6칸 차이) — 점성술에서 "서로 끌리는 반대" 조합으로 통함.
const OPPOSITE_PAIRS: [StarSignId, StarSignId][] = [
  ['aries', 'libra'],
  ['taurus', 'scorpio'],
  ['gemini', 'sagittarius'],
  ['cancer', 'capricorn'],
  ['leo', 'aquarius'],
  ['virgo', 'pisces'],
];

function elementOf(id: StarSignId): keyof typeof ELEMENTS {
  return (Object.keys(ELEMENTS) as (keyof typeof ELEMENTS)[]).find((k) => ELEMENTS[k].includes(id))!;
}

function tagOf(a: StarSignId, b: StarSignId): Tag {
  if (a === b) return 'same';
  const ea = elementOf(a);
  const eb = elementOf(b);
  if (ea === eb) return 'trine';
  if (OPPOSITE_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 'opposite';
  const compatiblePair =
    (ea === 'fire' && eb === 'air') ||
    (ea === 'air' && eb === 'fire') ||
    (ea === 'earth' && eb === 'water') ||
    (ea === 'water' && eb === 'earth');
  if (compatiblePair) return 'compatible';
  const frictionPair =
    (ea === 'fire' && eb === 'water') ||
    (ea === 'water' && eb === 'fire') ||
    (ea === 'earth' && eb === 'air') ||
    (ea === 'air' && eb === 'earth');
  if (frictionPair) return 'friction';
  return 'neutral';
}

function vibeOfTag(tag: Tag): CompatVibe {
  if (tag === 'same') return 'twin';
  if (tag === 'trine' || tag === 'compatible') return 'harmony';
  if (tag === 'opposite' || tag === 'friction') return 'spark';
  return 'steady';
}

const ARCHETYPE: Record<CompatVibe, string[]> = {
  twin: ['같은 별에서 온 단짝', '평행이론 케미', '닮은꼴 파트너'],
  harmony: ZODIAC_ARCHETYPE.harmony,
  steady: ['꾸준한 케미의 조합', '오늘의 기운으로 승부하는 사이', '무난하게 잘 맞는 별자리'],
  spark: ['정반대라 끌리는 사이', '별자리 밀당 케미', '다르니까 재밌는 조합'],
};

const REASON: Record<Tag, string[]> = {
  same: [
    '나랑 같은 별자리예요. 장단점까지 비슷해서 서로를 제일 잘 이해하는 사이예요.',
    '완전히 같은 별자리라 취향까지 닮았을 확률이 높아요.',
  ],
  trine: [
    '같은 원소 별자리라 결이 비슷해요. 자연스럽게 통하는 조합이에요.',
    '원소가 같은 별자리 조합이에요. 점성술에서 궁합이 좋다고 보는 조합이에요.',
  ],
  compatible: [
    '불과 바람, 흙과 물처럼 서로 다르지만 잘 통하는 원소 조합이에요.',
    '서로 다른 원소지만 케미가 좋기로 꼽히는 조합이에요.',
  ],
  opposite: [
    '별자리 상 정반대편에 있는 사이예요. 다르니까 오히려 끌리는 조합이에요.',
    '정반대 별자리라 매력 포인트도 정반대예요. 그게 은근 잘 맞아요.',
  ],
  friction: [
    '원소끼리 부딪히는 조합이라 텐션이 있어요. 근데 그만큼 자극적인 케미예요.',
    '서로 다른 기질의 원소라 티키타카가 심할 수 있는 조합이에요.',
  ],
  neutral: [
    '뚜렷하게 정해진 상성은 아니에요. 오늘의 기운으로 승부를 보는 조합이에요.',
    '원소상 특별히 얽힌 관계는 아니라, 그날그날 케미가 갈리는 편이에요.',
  ],
};

const HEAD_BEST = [
  '오늘은 별자리 궁합이 완벽하게 겹치는 날이에요!',
  '이 조합, 오늘따라 텔레파시가 통해요.',
  '오늘 하루 서로에게 최고의 별이에요.',
  '말 안 해도 마음이 통하는 조합이에요.',
];
const HEAD_GOOD = [
  '오늘 꽤 잘 통하는 별자리 조합이에요.',
  '자연스럽게 리듬이 맞는 하루예요.',
  '작은 배려면 더 좋아질 조합이에요.',
  '오늘은 대화가 술술 풀리는 궁합이에요.',
];
const HEAD_OK = [
  '오늘은 서로 다른 속도를 맞춰가요.',
  '조금 다르게 느껴도 매력으로 봐줘요.',
  '오늘은 타이밍만 잘 보면 괜찮아요.',
  '다른 별이 만나 배우는 하루예요.',
];

const GOOD = [
  '서로의 다른 점이 오늘은 매력으로 보여요.',
  '말하지 않아도 분위기로 알아채는 사이예요.',
  '함께 있으면 아이디어가 잘 떠올라요.',
  '오늘 나눈 이야기가 오래 남을 거예요.',
  '서로의 감정을 잘 읽어주는 하루예요.',
  '농담 코드가 잘 맞아 자주 웃게 돼요.',
  '한쪽이 들뜨면 다른 쪽이 잘 맞춰줘요.',
];
const CAUTION = [
  '서로 다른 속도를 답답해하지 않기로 해요.',
  '직설적인 말투가 오해를 부를 수 있어요.',
  '오늘은 서로 기대치를 살짝 낮춰봐요.',
  '감정 기복을 있는 그대로 받아들여요.',
  '대화 중간에 끼어들지 않게 조심해요.',
  '혼자만의 시간도 존중해주면 좋아요.',
];
const TIP = [
  '오늘은 계획보다 즉흥으로 만나봐요.',
  '작은 선물이나 이모티콘 하나로 충분해요.',
  '먼저 마음을 표현해보세요.',
  '같이 새로운 걸 해보면 케미가 살아나요.',
  '오늘은 들어주는 쪽이 더 좋은 인상을 남겨요.',
  '진심 어린 칭찬 한마디가 효과적이에요.',
];

const CATEGORY_META = [
  { key: 'chem', label: '케미', emoji: '✨' },
  { key: 'talk', label: '대화', emoji: '💬' },
  { key: 'conflict', label: '갈등 관리', emoji: '🤝' },
];

function pickR<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

export function computeStarCompat(dateKey: string, a: StarSignId, b: StarSignId): CompatResult {
  const [x, y] = [a, b].sort();
  const seed = hashSeed(`starcompat|${dateKey}|${x}|${y}`);
  const r = seededRandom(seed);

  const tag = tagOf(a, b);
  const vibe = vibeOfTag(tag);
  const [lo, hi] = SCORE_RANGE[vibe];

  const categories: CompatCategory[] = CATEGORY_META.map((c) => ({
    ...c,
    score: Math.round(lo + r() * (hi - lo)),
  }));
  const score = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);
  const band: CompatBand = score >= 85 ? 'best' : score >= 70 ? 'good' : 'ok';
  const head = band === 'best' ? HEAD_BEST : band === 'good' ? HEAD_GOOD : HEAD_OK;

  return {
    score,
    band,
    vibe,
    archetype: pickR(ARCHETYPE[vibe], r),
    reason: pickR(REASON[tag], r),
    categories,
    headline: pickR(head, r),
    good: pickR(GOOD, r),
    caution: pickR(CAUTION, r),
    tip: pickR(TIP, r),
  };
}
