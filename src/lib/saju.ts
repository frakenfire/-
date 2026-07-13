// 사주(四柱) 기반 '오늘의 일진' 로직 — AI 없이 전통 명리 규칙만으로 결정적 동작.
//
// 원리:
//  - 생년월일시가 없어 사주팔자 전체는 못 세우지만, 두 가지는 달력만으로 정확히 계산된다.
//    (1) 오늘의 '일진(日辰)' = 그날의 천간·지지(60갑자). 율리우스적일로 정확히 계산.
//    (2) 내 '띠' = 태어난 해의 지지(地支). 12띠가 곧 12지지다.
//  - 그래서 '오늘 일진의 지지'와 '내 띠(지지)'의 전통 관계(삼합·육합·상충·형·해·비화)와
//    '일간(천간)의 오행'과 '내 띠 오행'의 생극(生剋) 관계를 계산해, 사주식 '오늘의 기운'을 낸다.
//  - 모든 값은 (날짜, 띠)의 순수 함수 → 하루 동안 고정, 같은 조건이면 항상 같은 결과.
//
// 정확도: 일진 계산은 (JDN + 49) % 60, 甲子=0 (표준 만세력과 일치. 1970-01-01=辛巳, 2000-01-01=戊午 검증).
// 주의: 오락용이며 절기 기준 월주/시주는 다루지 않는다(일진·띠 관계에 집중).

import type { ZodiacId } from '../data/zodiac';

// 결정적 해시/선택 — dateSeed 와 동일한 FNV-1a 방식을 내장(이 모듈을 순수 leaf 로
// 유지해 노드 테스트 러너에서 바로 검증 가능하게 함).
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pickOne<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export const ELEMENT_KO: Record<Element, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};
export const ELEMENT_EMOJI: Record<Element, string> = {
  wood: '🌱',
  fire: '🔥',
  earth: '⛰️',
  metal: '⚙️',
  water: '💧',
};

// 오행별 개운(開運) 컬러 — 전통 오방색을 토스 팔레트로 톤다운한 색들.
// 목=청록 계열, 화=적·분홍 계열, 토=황·베이지 계열, 금=백·회 계열, 수=흑·청 계열.
export const ELEMENT_COLORS: Record<Element, { name: string; hex: string }[]> = {
  wood: [
    { name: '초록색', hex: '#20b573' },
    { name: '민트색', hex: '#2bb9a6' },
  ],
  fire: [
    { name: '분홍색', hex: '#efa2ba' },
    { name: '살구색', hex: '#f0a986' },
  ],
  earth: [
    { name: '노란색', hex: '#f5c344' },
    { name: '베이지색', hex: '#cdb89a' },
  ],
  metal: [
    { name: '흰색', hex: '#eceff2' },
    { name: '연회색', hex: '#c2c8cf' },
  ],
  water: [
    { name: '파란색', hex: '#3182f6' },
    { name: '남색', hex: '#3f5bbf' },
  ],
};

// 천간 10 — 한자 / 한글 / 오행 / 음양
const STEMS: { hanja: string; kor: string; el: Element }[] = [
  { hanja: '甲', kor: '갑', el: 'wood' },
  { hanja: '乙', kor: '을', el: 'wood' },
  { hanja: '丙', kor: '병', el: 'fire' },
  { hanja: '丁', kor: '정', el: 'fire' },
  { hanja: '戊', kor: '무', el: 'earth' },
  { hanja: '己', kor: '기', el: 'earth' },
  { hanja: '庚', kor: '경', el: 'metal' },
  { hanja: '辛', kor: '신', el: 'metal' },
  { hanja: '壬', kor: '임', el: 'water' },
  { hanja: '癸', kor: '계', el: 'water' },
];

// 지지 12 — 한자 / 한글 / 띠 / 오행. 배열 순서 = 子丑寅卯辰巳午未申酉戌亥 = 띠 순서.
const BRANCHES: { hanja: string; kor: string; animal: ZodiacId; el: Element }[] = [
  { hanja: '子', kor: '자', animal: 'rat', el: 'water' },
  { hanja: '丑', kor: '축', animal: 'ox', el: 'earth' },
  { hanja: '寅', kor: '인', animal: 'tiger', el: 'wood' },
  { hanja: '卯', kor: '묘', animal: 'rabbit', el: 'wood' },
  { hanja: '辰', kor: '진', animal: 'dragon', el: 'earth' },
  { hanja: '巳', kor: '사', animal: 'snake', el: 'fire' },
  { hanja: '午', kor: '오', animal: 'horse', el: 'fire' },
  { hanja: '未', kor: '미', animal: 'sheep', el: 'earth' },
  { hanja: '申', kor: '신', animal: 'monkey', el: 'metal' },
  { hanja: '酉', kor: '유', animal: 'rooster', el: 'metal' },
  { hanja: '戌', kor: '술', animal: 'dog', el: 'earth' },
  { hanja: '亥', kor: '해', animal: 'pig', el: 'water' },
];

const BRANCH_OF_ANIMAL: Record<ZodiacId, number> = BRANCHES.reduce(
  (acc, b, i) => {
    acc[b.animal] = i;
    return acc;
  },
  {} as Record<ZodiacId, number>,
);

// 율리우스적일(Fliegel–Van Flandern, 그레고리력) — 정확한 정수 일련번호.
function toJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

// dateKey 'YYYY-MM-DD' → 60갑자 인덱스(0=甲子)
function ganzhiIndexFromDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const jdn = toJDN(y, m, d);
  return (((jdn + 49) % 60) + 60) % 60;
}

// ── 지지 관계(전통) ──
// 삼합(三合): 지지 인덱스가 mod 4로 같음 (申子辰=0·4·8 등) → 최고의 조화
// 육합/상충/형·해는 쌍으로 정의
const UNION = new Set(['0-1', '2-11', '3-10', '4-9', '5-8', '6-7']); // 육합
const HARM = new Set(['0-7', '1-6', '2-9', '3-8', '4-11', '5-10']); // 원진/해
function keyOf(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export type BranchRelation = 'self' | 'trine' | 'union' | 'clash' | 'harm' | 'none';

function branchRelation(a: number, b: number): BranchRelation {
  if (a === b) return 'self'; // 비화(比和) — 같은 지지
  if (a % 4 === b % 4) return 'trine'; // 삼합
  if (UNION.has(keyOf(a, b))) return 'union'; // 육합
  if (Math.abs(a - b) === 6) return 'clash'; // 상충(정반대)
  if (HARM.has(keyOf(a, b))) return 'harm'; // 원진
  return 'none';
}

// 두 띠의 지지 관계 — 궁합 등에서 재사용하는 단일 출처(single source of truth).
export function zodiacRelation(a: ZodiacId, b: ZodiacId): BranchRelation {
  return branchRelation(BRANCH_OF_ANIMAL[a], BRANCH_OF_ANIMAL[b]);
}

// 띠의 오행
export function elementOfZodiac(id: ZodiacId): Element {
  return BRANCHES[BRANCH_OF_ANIMAL[id]].el;
}

// ── 오행 생극(生剋) ──
// 상생: 목→화→토→금→수→목 / 상극: 목→토→수→화→금→목
const GEN_NEXT: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};
const CTRL_NEXT: Record<Element, Element> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

// 나를 생(生)해주는 오행 — 명리의 인성(印星). 기운을 보충해주는 '개운 오행'으로 쓴다.
// (수생목, 목생화, 화생토, 토생금, 금생수의 역방향)
const GEN_PREV: Record<Element, Element> = {
  wood: 'water',
  fire: 'wood',
  earth: 'fire',
  metal: 'earth',
  water: 'metal',
};

export type ElementFlow =
  | 'day_generates_me' // 일간이 나를 생 — 도움받는 기운
  | 'i_generate_day' // 내가 일간을 생 — 베푸는(소모) 기운
  | 'day_controls_me' // 일간이 나를 극 — 눌리는/조심
  | 'i_control_day' // 내가 일간을 극 — 주도하는 기운
  | 'same'; // 비화 — 안정/친화

function elementFlow(dayEl: Element, myEl: Element): ElementFlow {
  if (dayEl === myEl) return 'same';
  if (GEN_NEXT[dayEl] === myEl) return 'day_generates_me';
  if (GEN_NEXT[myEl] === dayEl) return 'i_generate_day';
  if (CTRL_NEXT[dayEl] === myEl) return 'day_controls_me';
  if (CTRL_NEXT[myEl] === dayEl) return 'i_control_day';
  return 'same';
}

// 두 오행의 상성(궁합용, 대칭) — 상생 / 상극 / 비화. 5행은 서로 항상 이 셋 중 하나.
export type PairElementFlow = 'generate' | 'control' | 'same';
export const PAIR_FLOW_KO: Record<PairElementFlow, string> = {
  generate: '상생',
  control: '상극',
  same: '비화',
};
export function pairElementFlow(a: ZodiacId, b: ZodiacId): PairElementFlow {
  const ea = elementOfZodiac(a);
  const eb = elementOfZodiac(b);
  if (ea === eb) return 'same';
  if (GEN_NEXT[ea] === eb || GEN_NEXT[eb] === ea) return 'generate';
  return 'control';
}

export type SajuTone = 'great' | 'good' | 'steady' | 'caution';

// 지지 관계 + 오행 생극 → 종합 톤 점수(0~4). 관계가 주(主), 오행이 보조.
function toneScore(rel: BranchRelation, flow: ElementFlow): number {
  let s = 2;
  if (rel === 'trine') s += 2;
  else if (rel === 'union') s += 1.5;
  else if (rel === 'self') s += 0.5;
  else if (rel === 'clash') s -= 1.5;
  else if (rel === 'harm') s -= 1;
  if (flow === 'day_generates_me') s += 1;
  else if (flow === 'i_control_day') s += 0.5;
  else if (flow === 'same') s += 0.3;
  else if (flow === 'day_controls_me') s -= 1;
  else if (flow === 'i_generate_day') s -= 0.3;
  return s;
}

function toneOf(score: number): SajuTone {
  if (score >= 4) return 'great';
  if (score >= 2.8) return 'good';
  if (score >= 1.8) return 'steady';
  return 'caution';
}

export const REL_KO: Record<BranchRelation, string> = {
  self: '비화',
  trine: '삼합',
  union: '육합',
  clash: '상충',
  harm: '원진',
  none: '평운',
};

const TONE_WORD: Record<SajuTone, string> = {
  great: '크게 트임',
  good: '순조',
  steady: '안정',
  caution: '조심',
};

// 히어로 큰 제목용 짧은 문구 — 톤별 풀에서 seed로 골라 같은 톤이라도 날마다 변주
const TONE_TITLE: Record<SajuTone, string[]> = {
  great: [
    '오늘 기운이 크게 트였어요',
    '오늘은 뭘 해도 잘 풀릴 기운이에요',
    '오늘 흐름이 활짝 열렸어요',
  ],
  good: [
    '오늘은 순조롭게 흘러요',
    '오늘은 기분 좋게 이어지는 날이에요',
    '오늘은 무난하게 잘 풀려요',
  ],
  steady: [
    '오늘은 잔잔하고 안정적이에요',
    '오늘은 담담하게 흘러가요',
    '오늘은 내 페이스대로 가면 돼요',
  ],
  caution: [
    '오늘은 한 박자 늦추면 좋아요',
    '오늘은 살짝 조심하면 무난해요',
    '오늘은 지키는 게 이득인 날이에요',
  ],
};

// 톤별 오늘의 사주 한 줄 — 날짜·띠 seed로 변주(같은 날/같은 띠는 고정)
const HEADLINE: Record<SajuTone, string[]> = {
  great: [
    '오늘 일진이 내 띠와 잘 맞아, 기운이 크게 트이는 날이에요.',
    '흐름이 내 편인 날이에요. 미뤄둔 걸 꺼내기 좋아요.',
    '오늘은 결이 잘 맞아, 하려던 일에 힘이 실려요.',
    '오늘 일진과 손발이 척척 맞아, 뭘 해도 수월한 날이에요.',
    '기운이 활짝 열리는 날이에요. 한 걸음 크게 내딛기 좋아요.',
    '오늘은 나를 밀어주는 기운이라, 자신 있게 움직여도 돼요.',
  ],
  good: [
    '오늘 일진과 내 띠가 무난히 어울려, 순조로운 날이에요.',
    '큰 굴곡 없이 부드럽게 흘러가는 기운이에요.',
    '오늘은 손발이 맞는 편이라 편하게 풀려요.',
    '오늘은 억지로 애쓰지 않아도 술술 이어지는 날이에요.',
    '기운이 잔잔하게 좋은 쪽으로 흘러요.',
    '오늘은 작은 일들이 기분 좋게 맞물리는 날이에요.',
  ],
  steady: [
    '오늘은 특별한 충돌 없이 잔잔하게 흘러가는 날이에요.',
    '기운이 평온해요. 익숙한 것에서 힘이 나와요.',
    '무리 없이 내 리듬대로 가면 좋은 날이에요.',
    '오늘은 크게 튀지 않고 담담하게 지나가는 기운이에요.',
    '들뜨기보다 차분히 나를 챙기기 좋은 날이에요.',
    '오늘은 평소의 페이스를 지키면 무난한 날이에요.',
  ],
  caution: [
    '오늘 일진이 내 띠와 부딪히는 편이라, 한 박자 늦추면 좋아요.',
    '기운이 팽팽한 날이에요. 욱하는 순간만 피하면 무난해요.',
    '오늘은 밀어붙이기보다 지키는 쪽이 이득이에요.',
    '오늘은 살짝 어긋나기 쉬운 기운이라, 여유를 두면 좋아요.',
    '기운이 엇갈리는 날이에요. 급한 마음만 내려두면 괜찮아요.',
    '오늘은 무리한 확장보다 정리에 힘을 쓰면 편해요.',
  ],
};

const TIP: Record<SajuTone, string[]> = {
  great: [
    '먼저 연락하거나 제안해보기 좋아요.',
    '중요한 한 걸음을 오늘 떼보세요.',
    '미뤄둔 일을 오늘 시작하면 잘 풀려요.',
    '기회다 싶으면 오늘은 잡아도 좋아요.',
    '자신 있게 내 의견을 꺼내보세요.',
  ],
  good: [
    '가볍게 시작한 일이 잘 풀려요.',
    '사람과의 자리에서 좋은 기운이 와요.',
    '오늘은 부탁이나 제안을 해보기 좋아요.',
    '작은 약속 하나를 지키면 흐름이 더 좋아져요.',
    '평소 하던 대로 하면 무난하게 이어져요.',
  ],
  steady: [
    '새로 벌이기보다 하나 마무리해보세요.',
    '나를 챙기는 데 시간을 써도 좋아요.',
    '익숙한 루틴 하나를 지키면 안정돼요.',
    '오늘은 결정을 서두르지 않아도 괜찮아요.',
    '가까운 사람에게 안부 한마디 건네보세요.',
  ],
  caution: [
    '급한 결정은 하루 미뤄도 괜찮아요.',
    '말보다 듣기를 택하면 편해져요.',
    '오늘은 큰 지출이나 계약은 한 번 더 살펴요.',
    '감정이 앞설 땐 잠깐 자리를 비워보세요.',
    '일정을 조금 비워두면 여유가 생겨요.',
  ],
};

export type SajuToday = {
  iljin: { hanja: string; kor: string; stemEl: Element; branchEl: Element };
  relation: BranchRelation;
  relationKo: string;
  flow: ElementFlow;
  tone: SajuTone;
  toneWord: string;
  title: string;
  myElement: Element;
  /** 개운 오행 — 내 오행을 생해주는 오행(인성). 오늘 기운을 보충하는 방향 */
  boostElement: Element;
  /** 개운 컬러 — 개운 오행의 오방색에서 seed로 선택. 행운 색의 사주 근거가 된다 */
  luckyColor: { name: string; hex: string };
  headline: string;
  tip: string;
};

// 오늘의 일진만 (띠 없이도 표시 가능)
export function iljinOf(dateKey: string): {
  hanja: string;
  kor: string;
  stemEl: Element;
  branchEl: Element;
} {
  const idx = ganzhiIndexFromDateKey(dateKey);
  const s = STEMS[idx % 10];
  const b = BRANCHES[idx % 12];
  return { hanja: s.hanja + b.hanja, kor: s.kor + b.kor, stemEl: s.el, branchEl: b.el };
}

// 오늘의 사주 — 내 띠 기준 종합
export function sajuToday(dateKey: string, zodiacId: ZodiacId): SajuToday {
  const idx = ganzhiIndexFromDateKey(dateKey);
  const stem = STEMS[idx % 10];
  const dayBranchIdx = idx % 12;
  const myBranchIdx = BRANCH_OF_ANIMAL[zodiacId];
  const myEl = BRANCHES[myBranchIdx].el;

  const relation = branchRelation(dayBranchIdx, myBranchIdx);
  const flow = elementFlow(stem.el, myEl);
  const tone = toneOf(toneScore(relation, flow));

  const seed = hashSeed(`saju|${dateKey}|${zodiacId}`);
  const title = pickOne(TONE_TITLE[tone], seed >>> 5);
  const headline = pickOne(HEADLINE[tone], seed);
  const tip = pickOne(TIP[tone], seed >>> 3);
  const boostElement = GEN_PREV[myEl];
  const luckyColor = pickOne(ELEMENT_COLORS[boostElement], seed >>> 7);

  return {
    iljin: iljinOf(dateKey),
    relation,
    relationKo: REL_KO[relation],
    flow,
    tone,
    toneWord: TONE_WORD[tone],
    title,
    myElement: myEl,
    boostElement,
    luckyColor,
    headline,
    tip,
  };
}
