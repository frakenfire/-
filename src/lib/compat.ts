import { hashSeed, seededRandom } from './dateSeed.ts';
import type { ZodiacId } from '../data/zodiac.ts';
import {
  zodiacRelation,
  pairElementFlow,
  elementOfZodiac,
  PAIR_FLOW_KO,
  ELEMENT_KO,
  type BranchRelation,
  type PairElementFlow,
  type Element,
} from './saju.ts';

// 오늘의 친구 궁합 — 로그인 없이 되는 바이럴 훅.
// 내 띠 + 상대 띠 + 날짜로 결정적 점수/코멘트. 순서 무관(정렬)로 같은 쌍은 같은 결과.
// 점수/유형은 전통 사주 지지 관계(삼합·육합·상충·원진)에 근거해 쌍마다 실제로
// 다른 "이유"가 생기도록 한다 (모든 쌍이 같은 문구 풀을 공유하던 이전 버전 개선).

export type CompatBand = 'best' | 'good' | 'ok';
// twin: 완전히 같은 띠 / harmony: 삼합·육합(전통 찰떡궁합) / spark: 상충·원진(전통 애증궁합) / steady: 특별한 관계 없음
export type CompatVibe = 'twin' | 'harmony' | 'steady' | 'spark';

export type CompatCategory = { key: string; label: string; score: number };

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
    /** 쉬운 말 병기 — '상극'만 보면 높은 점수와 모순으로 읽힌다 */
    flowGloss: string;
    aKo: string;
    bKo: string;
  };
};

// 지지 관계 태그 — 사주 엔진(saju.zodiacRelation)을 단일 출처로 사용해 매핑만 한다.
// (예전엔 삼합·육합·상충·원진 표를 여기에 중복 정의했으나 saju.ts 로 일원화)
type Tag =
  | 'trine'
  | 'union'
  | 'clash'
  | 'punish'
  | 'harm'
  | 'break'
  | 'same'
  | 'selfPunish'
  | 'neutral';

function tagOf(a: ZodiacId, b: ZodiacId): Tag {
  const rel: BranchRelation = zodiacRelation(a, b);
  return rel === 'self' ? 'same' : rel === 'none' ? 'neutral' : rel;
}

// 오행 상성 궁합 점수 미세 보정(상생 +3 / 비화 +1 / 상극 -3). 로직 일관성.
function elementBias(flow: PairElementFlow): number {
  return { generate: 3, same: 1, control: -3 }[flow];
}

function vibeOf(tag: Tag): CompatVibe {
  if (tag === 'same' || tag === 'selfPunish') return 'twin';
  if (tag === 'trine' || tag === 'union') return 'harmony';
  if (tag === 'clash' || tag === 'harm' || tag === 'punish') return 'spark';
  return 'steady'; // break(파) 는 작용력이 약해 무난한 쪽으로 본다
}

export const SCORE_RANGE: Record<CompatVibe, [number, number]> = {
  twin: [86, 99],
  harmony: [82, 98],
  steady: [68, 92],
  spark: [65, 90],
};

export const ARCHETYPE: Record<CompatVibe, string[]> = {
  twin: [
    '취향이 닮은 짝',
    '생각이 겹치는 단짝',
    '닮은꼴 짝',
    '말투까지 닮은 사이',
    '같은 메뉴를 고르는 짝',
    '고집까지 닮은 사이',
  ],
  harmony: [
    '환상의 짝꿍',
    '손발이 잘 맞는 짝',
    '설명이 필요 없는 사이',
    '서로 챙겨주는 짝',
    '눈빛만 봐도 아는 사이',
    '같이 일하기 편한 짝',
    '든든한 짝꿍',
  ],
  steady: [
    '오래 봐도 편한 사이',
    '큰 다툼 없는 사이',
    '밥 한 끼면 풀리는 짝',
    '볼수록 친해지는 사이',
    '알아갈수록 괜찮은 짝',
  ],
  spark: [
    '밀고 당기는 사이',
    '말로는 안 지는 짝',
    '서로 승부욕을 깨우는 짝',
    '투닥거려도 다시 찾는 사이',
    '의견이 자주 갈리는 사이',
    '엎치락뒤치락하는 짝',
    '묘하게 끌리는 사이',
  ],
};

const REASON: Record<Tag, string[]> = {
  same: [
    '나랑 같은 띠예요. 좋아하는 음식이나 자주 가는 곳이 그대로 겹쳐요.',
    '같은 띠라 상대가 왜 그러는지 말하기 전에 알아채요.',
    '같은 띠끼리는 설명하지 않아도 통하는 일이 많아요.',
    '닮은 구석이 많아 처음 만나도 10분이면 어색함이 풀려요.',
  ],
  trine: [
    '예로부터 찰떡으로 꼽히는 세 띠 조합이에요. 같이 계획을 세우면 손발이 잘 맞아요.',
    '옛 궁합표에서 서로 잘 맞는 세 띠로 묶이는 사이예요. 몇 년을 같이 지내도 편해요.',
    '성격이 비슷한 세 띠 중 둘이에요. 할 일을 말하기 전에 상대가 먼저 꺼내요.',
    '전통 궁합에서 손꼽히는 조합이에요. 의견이 달라도 10분이면 한쪽으로 모여요.',
  ],
  union: [
    '옛 궁합표에서 짝꿍으로 묶이는 띠예요. 같이 하는 일을 정하지 않아도 알아서 나눠 맡아요.',
    '전통 궁합으로 보면 서로 끌어주는 짝이에요. 애쓰지 않아도 편하게 지내요.',
    '서로 부족한 부분을 채워주는 짝이에요. 한 사람이 힘들 때 다른 사람이 먼저 챙겨요.',
    '곁에 있으면 든든한 조합이에요. 부탁 하나를 해도 부담 없이 들어주는 사이예요.',
  ],
  clash: [
    '띠 궁합에서 정면으로 마주 보는 사이예요. 의견이 부딪히는 만큼 서로 자극이 돼요.',
    '말을 주고받다 보면 목소리가 커지는 사이예요. 그래도 대화가 지루할 틈은 없어요.',
    '성격이 정반대라 상대에게 없는 걸 서로 가졌어요. 부딪히면서 하나씩 배우는 사이예요.',
    '둘 다 고집을 쉽게 꺾지 않는 사이예요. 답장 한 줄에도 신경이 쓰여요.',
  ],
  harm: [
    '은근히 서로 신경 쓰는 사이예요. 상대의 말 한마디를 사흘은 곱씹어요.',
    '자주 투닥거려도 저녁이면 다시 대화하고 가까워지는 사이예요.',
    '사소한 일로 서운해지는 사이예요. 대신 먼저 사과하면 10분이면 풀려요.',
    '가까이서 툭탁대도 이상하게 멀어지진 않는 조합이에요.',
  ],
  selfPunish: [
    '같은 띠라 편하지만, 옛 궁합표에선 서로 부딪히는 짝으로도 봐요. 닮은 만큼 둘 다 고집이 세요.',
    '똑같은 띠끼리라 통하는 건 빠른데, 서로 물러서질 않아서 한 번씩 부딪혀요.',
    '내 단점이 상대에게서 똑같이 보이는 사이예요. 그래서 가끔 뜨끔해요.',
    '잘 맞다가도 같은 일에서 둘 다 예민해지는 조합이에요.',
  ],
  punish: [
    '옛 궁합표에서 서로 예민해지는 짝으로 봐요. 가까울수록 잔소리가 늘어요.',
    '편하기만 한 사이는 아니에요. 대신 서로 고칠 점을 콕 집어 말해주는 사이예요.',
    '예민해지는 부분이 겹치는 사이예요. 서로 싫어하는 말만 피하면 오래가요.',
    '부딪히는 날이 있어도 지나고 나면 서로 배운 게 많은 사이예요.',
  ],
  break: [
    '옛 궁합표에서 살짝 어긋나는 짝으로 봐요. 약속 시간이나 답장 시간이 가끔 엇갈려요.',
    '한 사람이 서두를 때 다른 사람은 미루는 사이예요. 약속은 날짜와 시각까지 그 자리에서 정하세요.',
    '같이 세운 계획이 한 달에 한 번은 틀어지는 조합이에요. 예비 날짜를 하나 더 잡아두세요.',
    '결정하는 속도가 다른 사이예요. 만날 시간을 전날 정해두면 잘 지내요.',
  ],
  neutral: [
    '옛 궁합표에 따로 묶인 관계는 없어요. 그날 기분에 따라 달라지니 만나기 전에 상대 기분부터 물어보세요.',
    '서로 끌어당기지도 밀어내지도 않는 사이예요. 먼저 연락하는 쪽이 분위기를 정해요.',
    '정해진 궁합이 없어서 오늘 뭘 같이 하느냐에 따라 달라지는 조합이에요. 같이 할 거리를 하나 정하고 만나세요.',
    '부담 주는 관계가 없어서 처음 말 걸기 편한 사이예요.',
  ],
};

const HEAD_BEST = [
  '오늘만큼은 천생연분이에요!',
  '오늘은 둘이 하자는 게 거의 겹쳐요.',
  '오늘은 둘이 같이 하면 일이 한결 빨리 끝나요.',
  '오늘은 부탁하면 바로 들어주는 짝꿍이에요.',
  '오늘은 죽이 척척 맞는 날이에요.',
  '오늘 이 둘은 아무도 못 말려요.',
  '오늘은 무슨 얘기를 꺼내도 말이 잘 통해요.',
];
const HEAD_GOOD = [
  '오늘은 메뉴 고르기부터 의견이 잘 맞아요.',
  '오늘은 서로 고집 부릴 일 없이 저녁까지 가요.',
  '점심때 안부 한 번 건네면 저녁엔 더 가까워져요.',
  '오늘은 손발이 제법 맞아요.',
  '오늘은 별 얘기 아니어도 대화가 한 시간은 이어져요.',
  '오늘은 같이 있어도 신경 쓸 일이 적어요.',
];
// 상충·원진·형(spark)은 점수가 높아도 '편안하게 흘러가는' 사이가 아니다.
// 예전엔 점수 밴드만 보고 골라서, '불꽃 튀는 사이 · 부딪히기 쉽지만' 바로 아래에
// '편안하게 흘러가는 하루예요' 가 붙는 정면 모순이 났다.
// spark 는 결(텐션)을 인정하면서 점수만 반영하는 별도 풀을 쓴다.
const HEAD_SPARK = [
  '오늘은 말싸움도 장난처럼 주고받는 날이에요.',
  '오늘은 부딪혀도 저녁이면 풀려요.',
  '오늘은 둘이 있으면 조용할 틈이 없어요.',
  '오늘은 상대 말에 승부욕이 생겨 일이 빨라져요.',
  '오늘은 둘 다 고집을 부려도 웃으며 넘겨요.',
  '오늘은 생각이 달라서 오히려 얘기가 재밌어요.',
];
const HEAD_SPARK_LOW = [
  '오늘은 한 발씩만 물러서면 돼요.',
  '오늘은 둘 다 예민해요. 답장은 두 줄 안으로 하세요.',
  '오늘은 누가 맞는지 따지지 말고 한 가지만 양보하세요.',
  '오늘 다툰 일은 하루 자고 내일 점심에 얘기하세요.',
  '오늘은 만나기보다 메시지로 안부 한 줄만 보내세요.',
  '오늘은 서운한 말을 들어도 바로 받아치지 마세요.',
];

const HEAD_OK = [
  '오늘은 약속 시간과 장소를 점심 전에 정해두세요.',
  '답장이 두 시간 늦어도 바쁜가 보다 하고 넘기세요.',
  '오늘은 농담하기 전에 상대 기분부터 물어보세요.',
  '오늘은 돈 얘기보다 가벼운 수다가 나아요.',
  '오늘은 기다리지 말고 점심때 내가 먼저 연락하세요.',
  '말이 살짝 어긋나도 한 번 웃으면 풀려요.',
];

const GOOD = [
  '뭐 먹을지 물으면 오늘은 같은 답이 나와요.',
  '말없이 같이 있어도 어색하지 않은 사이예요.',
  '한 사람이 놓친 일을 다른 사람이 먼저 알아채요.',
  '오늘은 같이 하는 일이 생각보다 빨리 끝나요.',
  '같은 얘기에 같이 웃는 일이 많아요.',
  '한 사람이 지치면 다른 사람이 먼저 챙겨요.',
  '작은 배려에도 상대가 그 자리에서 고맙다고 말해요.',
  '같이 있으면 미루던 일도 그 자리에서 시작하게 돼요.',
  '사소한 대화도 한 시간 넘게 이어지는 사이예요.',
  '상대가 바쁠 땐 재촉하지 않고 기다려줘요.',
  '오늘 함께 정한 약속은 미뤄지지 않아요.',
];
const CAUTION = [
  '문자 한 줄만 보고 결론 내리지 마세요. 오늘은 전화로 한 번 확인하세요.',
  '오늘 무심코 한 말투 하나가 일주일 가요. 보내기 전에 한 번 더 읽으세요.',
  '오늘은 상대가 다 알아서 해주길 바라지 말고 원하는 걸 한 문장으로 말하세요.',
  '오늘 답장이 두 시간 늦어도 서운해하지 마세요. 저녁에 한 번만 더 보내세요.',
  '외모나 말투를 놀리는 농담은 오늘 꺼내지 마세요. 저녁까지 분위기가 안 풀려요.',
  '혼자 있고 싶다는 말을 오늘은 그대로 들어주세요. 내일 먼저 연락이 와요.',
  '약속을 한쪽만 잡으면 서운함이 쌓여요. 다음 약속은 상대가 정하게 하세요.',
  '말 안 해도 알겠지 싶은 일은 오늘 꼭 말로 하세요.',
  '오늘은 게임이나 내기에서 이기려 들지 마세요. 한 판은 져주세요.',
  '밤 10시 넘어서는 돈 얘기나 서운했던 얘기를 꺼내지 마세요. 내일 점심에 하세요.',
];
const TIP = [
  '오늘 점심때 먼저 잘 지내냐고 한 줄 보내세요.',
  '오늘 저녁은 둘 다 좋아하는 메뉴로 같이 드세요.',
  '오늘 저녁 먹기 전에 최근 도와준 일 하나를 꼽아 고맙다고 말하세요.',
  '오늘 만나면 상대가 좋아하는 간식 하나를 건네세요.',
  '오늘은 내 얘기는 10분 뒤로 미루고 상대 얘기부터 들으세요.',
  '오늘 저녁 8시쯤 20분만 같이 걸으세요.',
  '오늘 웃겼던 일 하나를 사진과 함께 자기 전에 보내세요.',
  '오늘 안에 상대가 요즘 애쓰는 일 하나를 콕 집어 칭찬하세요.',
  '오늘 어색하면 둘 다 아는 친구 얘기부터 3분만 꺼내세요.',
  '오늘 자기 전에 수고했다고 한 줄 보내세요.',
];

const CATEGORY_META = [
  { key: 'chem', label: '잘 맞는 정도' },
  { key: 'talk', label: '대화' },
  { key: 'conflict', label: '안 싸우기' },
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
    elements: {
      a: elementOfZodiac(a),
      b: elementOfZodiac(b),
      flow,
      flowKo: PAIR_FLOW_KO[flow],
      flowGloss: { generate: '서로 살려주는 짝', control: '서로 긴장시키는 짝', same: '닮은 짝' }[flow],
      aKo: ELEMENT_KO[elementOfZodiac(a)],
      bKo: ELEMENT_KO[elementOfZodiac(b)],
    },
  };
}
