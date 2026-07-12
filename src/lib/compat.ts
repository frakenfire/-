import { hashSeed, seededRandom } from './dateSeed';
import type { ZodiacId } from '../data/zodiac';
import {
  zodiacRelation,
  pairElementFlow,
  elementOfZodiac,
  PAIR_FLOW_KO,
  ELEMENT_KO,
  ELEMENT_EMOJI,
  type BranchRelation,
  type PairElementFlow,
  type Element,
} from './saju';

// 오늘의 친구 궁합 — 로그인 없이 되는 바이럴 훅.
// 내 띠 + 상대 띠 + 날짜로 결정적 점수/코멘트. 순서 무관(정렬)로 같은 쌍은 같은 결과.
// 점수/유형은 전통 사주 지지 관계(삼합·육합·상충·원진)에 근거해 쌍마다 실제로
// 다른 "이유"가 생기도록 한다 (모든 쌍이 같은 문구 풀을 공유하던 이전 버전 개선).

export type CompatBand = 'best' | 'good' | 'ok';
// twin: 완전히 같은 띠 / harmony: 삼합·육합(전통 찰떡궁합) / spark: 상충·원진(전통 애증궁합) / steady: 특별한 관계 없음
export type CompatVibe = 'twin' | 'harmony' | 'steady' | 'spark';

export type CompatCategory = { key: string; label: string; emoji: string; score: number };

export type CompatResult = {
  score: number; // 세 카테고리 평균 (55~99, 긍정 스큐)
  band: CompatBand;
  vibe: CompatVibe;
  archetype: string; // 오늘의 커플 유형 (공유 훅)
  reason: string; // 전통 궁합 근거를 캐주얼하게 설명한 한 줄
  categories: CompatCategory[]; // 케미 · 대화 · 갈등 관리
  headline: string;
  good: string; // 잘 맞는 점
  caution: string; // 오늘 조심할 점
  tip: string; // 오늘의 팁
  // 두 사람의 오행 상성(상생/상극/비화) — 띠 궁합에만 존재(별자리 궁합은 없음)
  elements?: {
    a: Element;
    b: Element;
    flow: PairElementFlow;
    flowKo: string;
    aKo: string;
    bKo: string;
    aEmoji: string;
    bEmoji: string;
  };
};

// 지지 관계 태그 — 사주 엔진(saju.zodiacRelation)을 단일 출처로 사용해 매핑만 한다.
// (예전엔 삼합·육합·상충·원진 표를 여기에 중복 정의했으나 saju.ts 로 일원화)
type Tag = 'trine' | 'union' | 'clash' | 'harm' | 'same' | 'neutral';

function tagOf(a: ZodiacId, b: ZodiacId): Tag {
  const rel: BranchRelation = zodiacRelation(a, b);
  return rel === 'self' ? 'same' : rel === 'none' ? 'neutral' : rel;
}

// 오행 상성 → 궁합 점수 미세 보정(상생 +3 / 비화 +1 / 상극 -3). 로직 일관성.
function elementBias(flow: PairElementFlow): number {
  return { generate: 3, same: 1, control: -3 }[flow];
}

export function vibeOf(tag: Tag): CompatVibe {
  if (tag === 'same') return 'twin';
  if (tag === 'trine' || tag === 'union') return 'harmony';
  if (tag === 'clash' || tag === 'harm') return 'spark';
  return 'steady';
}

export const SCORE_RANGE: Record<CompatVibe, [number, number]> = {
  twin: [86, 99],
  harmony: [82, 98],
  steady: [68, 92],
  spark: [65, 90],
};

export const ARCHETYPE: Record<CompatVibe, string[]> = {
  twin: [
    '데칼코마니 콤비',
    '평행이론 단짝',
    '닮은꼴 파트너',
    '거울 보는 사이',
    '한 몸 같은 콤비',
    '판박이 케미',
  ],
  harmony: [
    '환상의 짝꿍',
    '찰떡 콤비',
    '설명 필요 없는 케미',
    '천생연분 각',
    '눈빛만 봐도 아는 사이',
    '합이 딱 맞는 콤비',
    '든든한 짝꿍',
  ],
  steady: [
    '꾸준함이 통하는 사이',
    '오늘의 케미로 승부하는 조합',
    '무난하게 잘 맞는 콤비',
    '천천히 스며드는 사이',
    '알아갈수록 괜찮은 콤비',
  ],
  spark: [
    '밀당 스파크 케미',
    '티키타카 라이벌',
    '자극 넘치는 콤비',
    '애증의 케미',
    '불꽃 튀는 사이',
    '엎치락뒤치락 콤비',
    '묘하게 끌리는 사이',
  ],
};

const REASON: Record<Tag, string[]> = {
  same: [
    '나랑 똑같은 띠예요. 취향까지 은근 비슷해서 편한 사이일 확률이 높아요.',
    '같은 띠라 서로를 스스로 보듯 이해가 빠른 조합이에요.',
  ],
  trine: [
    '전통 궁합에서 삼합이라 부르는 조합이에요. 애쓰지 않아도 결이 비슷해서 잘 맞아요.',
    '삼합 궁합이에요. 예로부터 찰떡궁합으로 꼽히던 조합이라 오늘도 기대해도 좋아요.',
  ],
  union: [
    '육합이라 불리는 짝꿍 조합이에요. 자연스럽게 손발이 맞는 편이에요.',
    '전통 궁합으로 보면 육합 관계예요. 큰 노력 없이도 무난하게 잘 맞아요.',
  ],
  clash: [
    '정면으로 마주보는 상충 궁합이에요. 부딪히기 쉽지만 그만큼 자극과 텐션이 있어요.',
    '상충 관계라 티키타카가 심할 수 있어요. 근데 그게 은근 재밌는 조합이에요.',
  ],
  harm: [
    '원진이라 불리는 애증 궁합이에요. 은근히 신경 쓰이지만 그게 매력 포인트예요.',
    '옛말로 원진 관계예요. 투닥거려도 결국 다시 붙어 있는 사이가 많아요.',
  ],
  neutral: [
    '뚜렷하게 정해진 상성은 아니에요. 오늘의 기운으로 승부를 보는 조합이에요.',
    '전통 궁합상 특별히 얽힌 관계는 아니라, 그날그날 케미가 갈리는 편이에요.',
  ],
};

const HEAD_BEST = [
  '오늘만큼은 천생연분이에요!',
  '이 조합, 오늘 케미 폭발이에요.',
  '오늘 둘이 함께면 뭐든 잘 풀려요.',
  '오늘 하루 최고의 짝꿍이에요.',
  '오늘은 죽이 척척 맞는 날이에요.',
  '이 케미, 오늘 아무도 못 말려요.',
  '오늘 둘 사이에 초록불만 켜져요.',
];
const HEAD_GOOD = [
  '오늘 꽤 잘 맞는 하루예요.',
  '무난하게 잘 통하는 날이에요.',
  '작은 배려면 더 좋아질 사이예요.',
  '오늘은 손발이 제법 맞아요.',
  '오늘은 대화가 술술 풀려요.',
  '편안하게 흘러가는 하루예요.',
];
const HEAD_OK = [
  '오늘은 서로 한 발씩 맞춰가요.',
  '조금 어긋나도 노력하면 괜찮아요.',
  '오늘은 타이밍만 잘 보면 돼요.',
  '천천히 맞춰가기 좋은 날이에요.',
  '오늘은 기대보다 여유가 정답이에요.',
  '살짝 삐끗해도 금방 회복돼요.',
];

const GOOD = [
  '말하지 않아도 통하는 순간이 있어요.',
  '함께 있으면 편안해지는 사이예요.',
  '서로의 부족한 부분을 채워줘요.',
  '오늘 같이 하는 일은 술술 풀려요.',
  '웃음 코드가 잘 맞는 하루예요.',
  '한 사람이 지치면 다른 쪽이 끌어줘요.',
  '작은 배려가 두 배로 돌아와요.',
];
const CAUTION = [
  '급하게 결론 내리면 오해가 생겨요.',
  '사소한 말투 하나가 오래 남을 수 있어요.',
  '오늘은 서로 기대를 조금만 낮춰요.',
  '연락 텀이 어긋나기 쉬운 날이에요.',
  '농담이 과하면 살짝 삐끗할 수 있어요.',
  '각자의 시간도 존중해주면 좋아요.',
];
const TIP = [
  '오늘은 먼저 안부를 건네보세요.',
  '같이 맛있는 거 하나 먹으면 풀려요.',
  '고맙다는 말 한 번이 분위기를 살려요.',
  '작은 선물이나 이모티콘 하나면 충분해요.',
  '오늘은 들어주는 쪽이 이겨요.',
  '가벼운 산책 한 번 같이 어때요?',
];

const CATEGORY_META = [
  { key: 'chem', label: '케미', emoji: '✨' },
  { key: 'talk', label: '대화', emoji: '💬' },
  { key: 'conflict', label: '갈등 관리', emoji: '🤝' },
];

function pickR<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

export function computeCompat(dateKey: string, a: ZodiacId, b: ZodiacId): CompatResult {
  const [x, y] = [a, b].sort();
  const seed = hashSeed(`compat|${dateKey}|${x}|${y}`);
  const r = seededRandom(seed);

  const tag = tagOf(a, b);
  const vibe = vibeOf(tag);
  const [lo, hi] = SCORE_RANGE[vibe];

  // 오행 상성으로 카테고리 점수를 살짝 보정(같은 쌍은 여전히 결정적).
  const flow = pairElementFlow(a, b);
  const bias = elementBias(flow);
  const categories: CompatCategory[] = CATEGORY_META.map((c) => ({
    ...c,
    score: Math.max(55, Math.min(99, Math.round(lo + r() * (hi - lo)) + bias)),
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
    elements: {
      a: elementOfZodiac(a),
      b: elementOfZodiac(b),
      flow,
      flowKo: PAIR_FLOW_KO[flow],
      aKo: ELEMENT_KO[elementOfZodiac(a)],
      bKo: ELEMENT_KO[elementOfZodiac(b)],
      aEmoji: ELEMENT_EMOJI[elementOfZodiac(a)],
      bEmoji: ELEMENT_EMOJI[elementOfZodiac(b)],
    },
  };
}
