import { hashSeed, seededRandom } from './dateSeed.ts';
import type { StarSignId } from '../data/starSign.ts';
import { ARCHETYPE as ZODIAC_ARCHETYPE, SCORE_RANGE, type CompatBand, type CompatCategory, type CompatResult, type CompatVibe } from './compat.ts';

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
  twin: ['같은 별자리 단짝', '취향이 겹치는 사이', '닮은꼴 짝'],
  harmony: ZODIAC_ARCHETYPE.harmony,
  steady: ['오래 봐도 편한 조합', '그날 기분 따라 달라지는 사이', '싸울 일이 드문 별자리'],
  spark: ['정반대라 끌리는 사이', '밀고 당기는 별자리', '다르니까 재밌는 조합'],
};

const REASON: Record<Tag, string[]> = {
  same: [
    '나랑 같은 별자리예요. 장단점까지 비슷해서 서로를 제일 잘 이해하는 사이예요.',
    '같은 별자리라 화나는 일도 비슷해요. 그래서 서로 조심할 곳을 잘 알아요.',
  ],
  trine: [
    '같은 원소 별자리라 성격이 비슷해요. 주말에 하고 싶은 일이 잘 겹쳐요.',
    '점성술에서 궁합이 좋다고 보는 같은 원소 짝이에요. 의견이 10분이면 한쪽으로 모여요.',
  ],
  compatible: [
    '불과 바람, 흙과 물처럼 서로 다르지만 잘 통하는 원소 조합이에요.',
    '원소는 다르지만 한쪽이 꺼낸 계획을 다른 쪽이 끝까지 마무리해주는 짝이에요. 여행 가자는 말은 한 사람이 하고, 숙소 예약은 다른 사람이 끝내요.',
  ],
  opposite: [
    '별자리 판에서 정반대편에 있는 사이예요. 나와 다른 점에 먼저 끌려요.',
    '정반대 별자리라 한 사람이 못 하는 걸 다른 사람이 잘해요.',
  ],
  friction: [
    '원소끼리 부딪히는 조합이라 의견이 자주 갈려요. 그만큼 서로 몰랐던 걸 알려줘요.',
    '성격이 다른 원소라 말을 주고받다 보면 목소리가 커지는 조합이에요.',
  ],
  neutral: [
    '점성술에서 따로 묶이는 짝은 아니에요. 같이 뭘 하느냐에 따라 달라지니 만나기 전에 할 거리를 하나 정하세요.',
    '원소끼리 당기지도 밀지도 않는 사이예요. 먼저 말 거는 쪽이 분위기를 정해요.',
  ],
};

const HEAD_BEST = [
  '오늘은 무슨 얘기를 해도 말이 잘 통해요.',
  '오늘은 같은 걸 생각하고 있을 때가 많아요.',
  '오늘은 부탁하면 바로 들어주는 사이예요.',
  '오늘은 같이 있으면 시간이 빨리 가요.',
];
const HEAD_GOOD = [
  '오늘은 고민 하나 털어놓으면 잘 들어줘요.',
  '오늘은 같이 하는 일의 손발이 잘 맞아요.',
  '점심때 안부 한 줄 보내면 저녁엔 더 가까워져요.',
  '오늘은 가벼운 수다가 한 시간은 이어져요.',
];
// 대립·불화(spark) 조합에는 매끄러움을 단정하지 않는다.
// 띠 궁합과 같은 이유 — '정반대편에 있는 사이' 바로 아래 '대화가 술술 풀리는'이 붙으면
// 한 카드 안에서 말이 갈린다.
const HEAD_SPARK = [
  '오늘은 생각이 달라서 얘기가 더 재밌어요.',
  '오늘은 상대의 엉뚱한 말이 귀엽게 들려요.',
  '오늘은 부딪혀도 한두 시간이면 풀려요.',
  '오늘은 말장난을 주고받으며 자주 웃게 돼요.',
];
const HEAD_SPARK_LOW = [
  '오늘은 한 발씩만 물러서면 돼요.',
  '오늘 생긴 오해는 내일 얼굴 보고 풀어도 돼요.',
  '오늘은 의견이 갈리면 상대 쪽으로 한 번은 맞춰주세요.',
  '오늘은 만나기보다 메시지로 안부 한 줄만 보내세요.',
];

const HEAD_OK = [
  '오늘은 만날 시간과 장소를 점심 전에 정해두세요.',
  '오늘 상대가 하자는 게 낯설어도 한 번은 따라가 보세요.',
  '오늘은 농담하기 전에 상대 기분부터 물어보세요.',
  '오늘은 상대가 좋아하는 걸 하나 물어보세요.',
];

const GOOD = [
  '오늘은 나와 다른 점이 신기하게 보여요.',
  '표정만 봐도 기분을 알아채는 사이예요.',
  '함께 있으면 아이디어가 잘 떠올라요.',
  '오늘 나눈 이야기를 상대가 일주일 뒤에도 기억해요.',
  '속상한 일을 말하면 먼저 편을 들어줘요.',
  '농담 코드가 잘 맞아 자주 웃게 돼요.',
  '한 사람이 들뜨면 다른 사람이 잘 맞춰줘요.',
];
const CAUTION = [
  '상대가 결정을 늦게 해도 재촉하지 마세요. 저녁까지는 기다려주세요.',
  '돌려 말하지 않는 말투에 상대가 상처받아요. 오늘은 한 마디 덜 하세요.',
  '오늘은 상대가 먼저 알아주길 바라지 말고 원하는 걸 그대로 말하세요.',
  '상대 기분이 오락가락해도 이유를 캐묻지 마세요. 내일 물어도 늦지 않아요.',
  '대화 중간에 끼어들지 마세요. 상대 말이 끝나고 3초 뒤에 말하세요.',
  '혼자 있고 싶다는 말을 서운하게 듣지 마세요. 내일 점심에 다시 연락하세요.',
];
const TIP = [
  '오늘 저녁에 약속 없이 10분만 잠깐 만나보세요.',
  '오늘 상대가 좋아하는 음료 하나를 사서 건네세요.',
  '오늘 저녁 먹기 전에 고마웠던 일 하나를 먼저 말로 꺼내세요.',
  '오늘 저녁은 둘 다 안 가본 가게에 같이 가세요.',
  '오늘 만나서 첫 10분은 내 얘기 말고 상대 얘기부터 물어보세요.',
  '오늘 자기 전에 상대가 요즘 애쓰는 일 하나를 콕 집어 칭찬하세요.',
];

const CATEGORY_META = [
  { key: 'chem', label: '잘 맞는 정도', emoji: '' },
  { key: 'talk', label: '대화', emoji: '' },
  { key: 'conflict', label: '안 싸우기', emoji: '' },
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
  const head =
    vibe === 'spark'
      ? band === 'ok'
        ? HEAD_SPARK_LOW
        : HEAD_SPARK
      : band === 'best'
        ? HEAD_BEST
        : band === 'good'
          ? HEAD_GOOD
          : HEAD_OK;

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
