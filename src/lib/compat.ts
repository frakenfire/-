import { hashSeed, seededRandom } from './dateSeed';
import type { ZodiacId } from '../data/zodiac';

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
};

// 12지지 순서 그대로(자축인묘진사오미신유술해 = 쥐소범토끼용뱀말양원숭이닭개돼지).
type Tag = 'trine' | 'union' | 'clash' | 'harm' | 'same' | 'neutral';

const TRINE_GROUPS: ZodiacId[][] = [
  ['monkey', 'rat', 'dragon'], // 신자진(申子辰) 삼합
  ['snake', 'rooster', 'ox'], // 사유축(巳酉丑) 삼합
  ['pig', 'rabbit', 'sheep'], // 해묘미(亥卯未) 삼합
  ['tiger', 'horse', 'dog'], // 인오술(寅午戌) 삼합
];
const UNION_PAIRS: [ZodiacId, ZodiacId][] = [
  ['rat', 'ox'],
  ['tiger', 'pig'],
  ['rabbit', 'dog'],
  ['dragon', 'rooster'],
  ['snake', 'monkey'],
  ['horse', 'sheep'],
]; // 육합
const CLASH_PAIRS: [ZodiacId, ZodiacId][] = [
  ['rat', 'horse'],
  ['ox', 'sheep'],
  ['tiger', 'monkey'],
  ['rabbit', 'rooster'],
  ['dragon', 'dog'],
  ['snake', 'pig'],
]; // 상충(정반대 띠)
const HARM_PAIRS: [ZodiacId, ZodiacId][] = [
  ['rat', 'sheep'],
  ['ox', 'horse'],
  ['tiger', 'rooster'],
  ['rabbit', 'monkey'],
  ['dragon', 'pig'],
  ['snake', 'dog'],
]; // 원진

function hasPair(pairs: [ZodiacId, ZodiacId][], a: ZodiacId, b: ZodiacId): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function tagOf(a: ZodiacId, b: ZodiacId): Tag {
  if (a === b) return 'same';
  if (TRINE_GROUPS.some((g) => g.includes(a) && g.includes(b))) return 'trine';
  if (hasPair(UNION_PAIRS, a, b)) return 'union';
  if (hasPair(CLASH_PAIRS, a, b)) return 'clash';
  if (hasPair(HARM_PAIRS, a, b)) return 'harm';
  return 'neutral';
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
  twin: ['데칼코마니 콤비', '평행이론 단짝', '닮은꼴 파트너'],
  harmony: ['환상의 짝꿍', '찰떡 콤비', '설명 필요 없는 케미'],
  steady: ['꾸준함이 통하는 사이', '오늘의 케미로 승부하는 조합', '무난하게 잘 맞는 콤비'],
  spark: ['밀당 스파크 케미', '티키타카 라이벌', '자극 넘치는 콤비'],
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
];
const HEAD_GOOD = [
  '오늘 꽤 잘 맞는 하루예요.',
  '무난하게 잘 통하는 날이에요.',
  '작은 배려면 더 좋아질 사이예요.',
  '오늘은 손발이 제법 맞아요.',
];
const HEAD_OK = [
  '오늘은 서로 한 발씩 맞춰가요.',
  '조금 어긋나도 노력하면 괜찮아요.',
  '오늘은 타이밍만 잘 보면 돼요.',
  '천천히 맞춰가기 좋은 날이에요.',
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
