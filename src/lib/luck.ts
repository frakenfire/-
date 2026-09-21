import { GRADE } from './gradeWords.ts';
import { seededRandom } from './dateSeed.ts';
import { LUCKY_FOODS, type LuckyFood } from '../data/luckyFood.ts';
import { OHAENG } from '../data/ohaeng.ts';
import type { Element } from './saju.ts';

// 입소문 요소: 총운 점수 + 카테고리별 점수 + 행운 세트.
// 인기 '오늘의 운세' 앱(포스텔러/펭귄도사/운세도사)의 공통 히트 요소를 반영.
// seed 로부터 결정적으로 계산 같은 뽑기는 항상 같은 결과(공유 안정),
// 다른 뽑기는 조합 폭발로 사실상 매번 다른 결과(입소문).

export type LuckColor = { name: string; hex: string };

export type CategoryScore = { key: string; label: string; emoji: string; score: number };

export type LuckSet = {
  /**
   * 여섯 칸을 만든 기운. 제비뽑기가 아니라 계산일 때만 채워진다.
   * 왜 그렇게 나왔는지 푸는 문단은 화면이 만든다 - 고른 고민의 말로 써야 하는데
   * 여기는 고민을 모른다.
   */
  boost: Element | null;
  total: number; // 65~99 (긍정 스큐)
  grade: string; // 대길 / 길 / 중길 / 소길 / 평 (내부 키. 화면은 GRADE_KO 로)
  categories: CategoryScore[];
  color: LuckColor;
  number: number; // 1~45
  direction: string;
  time: string;
  item: string;
  food: LuckyFood; // 오늘의 행운 음식 (하루 설계 훅)
};

// 토스 팔레트에 맞춘 차분한 색 — 형광 핑크·보라·주황 같은 튀는 색은 톤다운.
// (행운 색은 UI 테마가 아니라 작은 점으로만 렌더돼 콘텐츠로만 쓰인다)
const COLORS: LuckColor[] = [
  { name: '파란색', hex: '#3182f6' },
  { name: '초록색', hex: '#20b573' },
  { name: '하늘색', hex: '#5ab0ef' },
  { name: '남색', hex: '#3f5bbf' },
  { name: '민트색', hex: '#2bb9a6' },
  { name: '노란색', hex: '#f5c344' },
  { name: '살구색', hex: '#f0a986' },
  { name: '베이지색', hex: '#cdb89a' },
  { name: '연회색', hex: '#c2c8cf' },
  { name: '분홍색', hex: '#efa2ba' },
];

const DIRECTIONS = ['동쪽', '서쪽', '남쪽', '북쪽', '동남쪽', '남서쪽', '북동쪽'];
const TIMES = ['이른 아침', '오전', '점심 무렵', '늦은 오후', '저녁', '밤'];
// '물건'이라고 적어놓고 '짧은 산책', '좋아하는 노래'를 넣어두면
// 라벨이 거짓말이 된다. 손에 쥘 수 있는 것만 둔다.
const ITEMS = [
  '따뜻한 커피',
  '작은 메모',
  '이어폰',
  '손거울',
  '텀블러',
  '초록 식물',
  '읽다 만 책',
  '편한 신발',
  '향기 좋은 핸드크림',
  '작은 간식',
];
const CATEGORY_META = [
  { key: 'love', label: '사랑운', emoji: '' },
  { key: 'money', label: '돈운', emoji: '' },
  { key: 'work', label: '일운', emoji: '' },
  { key: 'health', label: '건강운', emoji: '' },
];

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function grade(total: number): string {
  if (total >= 95) return '대길';
  if (total >= 88) return '길';
  if (total >= 80) return '중길';
  if (total >= 73) return '소길';
  return '평';
}

// 사주 톤 총운이 놓일 수 있는 구간.
// 결과 화면은 '총운 96점 · 대길'(숫자)과 '내 띠와 상충 · 조심'(사주 해석)을 같은 화면에
// 나란히 보여준다. 예전엔 둘이 ±6 보정으로만 느슨하게 묶여 있어서, 상충인 날에 대길이
// 뜨는 정면 모순이 실제로 6% 넘게 나왔다(12띠 × 20일 × 전 조합 측정).
// 이제 톤이 점수의 구간 자체를 정해, 숫자와 문장이 구조적으로 어긋날 수 없게 한다.
// 구간 안에서는 seed 로 자유롭게 흩어지므로 매일의 변화폭은 그대로다.
const TONE_BAND: Record<'great' | 'good' | 'steady' | 'caution', [number, number]> = {
  great: [82, 99], // 삼합·육합 — 대길이 나올 수 있는 유일한 구간
  good: [75, 95],
  steady: [70, 90], // 비화·평운 — 무난하되 대길은 아님
  caution: [65, 82], // 충·형·원진 — 길 이상은 뜨지 않음
};

/** 등급을 화면에 보일 때 쓰는 말. '중길' 은 아이가 모른다. */
// 다섯 칸을 다섯 낱말로 가르면 '괜찮음' 과 '보통' 과 '잔잔함' 의 차이를
// 아무도 모른다. 사다리 넷으로 누르고, 그 안의 차이는 점수가 말한다.
export const GRADE_KO: Record<string, string> = {
  대길: GRADE.best, 길: GRADE.good, 중길: GRADE.plain, 소길: GRADE.plain, 평: GRADE.plain,
};

export function luckBandForTone(tone: 'great' | 'good' | 'steady' | 'caution'): [number, number] {
  return TONE_BAND[tone];
}

/**
 * 행운 여섯 칸.
 *
 * boost(오늘 나한테 힘이 되는 기운)를 주면 방향·숫자·시각·음식·물건이
 * 제비뽑기가 아니라 그 기운에 정해진 값에서 나온다. 색은 부르는 쪽에서
 * 사주 개운 컬러로 덮어쓴다(예전부터 그랬다).
 *
 * boost 가 없으면(생년월일을 안 넣은 사람) 예전처럼 목록에서 뽑는다.
 * 그때는 why 가 null 이고, 화면도 이유를 적지 않는다 - 없는 근거를
 * 있는 척 적는 게 제일 나쁘다.
 */
export function computeLuck(seed: number, band?: [number, number], boost?: Element): LuckSet {
  const r = seededRandom(seed);

  // 난수 소비량은 밴드 유무와 무관하게 1회로 고정 — 띠를 저장해도 행운 세트(색·숫자·
  // 음식 등)의 뽑기 순서가 밀리지 않게 하기 위함.
  const base = 65 + Math.floor(r() * 35); // 65~99
  const [lo, hi] = band ?? [65, 99];
  const total = lo + Math.floor(((base - 65) / 35) * (hi - lo + 1));

  // 항목별 점수는 총운을 기준으로 흩뿌린다.
  // 예전엔 총운과 완전히 독립된 난수라 '총운 98점(대길)인데 네 항목이 71~91점'
  // 같은 모순이 생겼다. 이제 총운이 천장 역할을 하고, 항목은 그 아래로 벌어진다.
  // (-16 ~ +1 편차 최고 항목이 총운과 비슷하고, 최저 항목이'오늘 조심'이 된다)
  const categories: CategoryScore[] = CATEGORY_META.map((c) => ({
    ...c,
    score: Math.max(50, Math.min(99, total - 16 + Math.floor(r() * 18))),
  }));

  const color = pick(COLORS, r);
  // 난수는 boost 유무와 상관없이 같은 횟수만 돌린다 - 생년월일을 넣고 안 넣고에
  // 따라 뒤쪽 뽑기(행운 번호·음식·주차)가 통째로 밀리지 않게.
  const rNumber = 1 + Math.floor(r() * 45);
  const rDirection = pick(DIRECTIONS, r);
  const rTime = pick(TIMES, r);
  const rItem = pick(ITEMS, r);
  const facts = boost ? OHAENG[boost] : null;
  const number = facts ? facts.numbers[seed % 2] : rNumber;
  const direction = facts ? facts.direction : rDirection;
  const time = facts ? facts.time : rTime;
  const item = facts ? facts.items[seed % facts.items.length] : rItem;

  const rFood = pick(LUCKY_FOODS, r);
  const food: LuckyFood = facts
    ? { name: facts.foods[seed % facts.foods.length], why: `${facts.ko} 기운에 드는 ${facts.taste} 쪽이에요.` }
    : rFood;

  return {
    total, grade: grade(total), categories, color, number,
    direction, time, item, food,
    boost: boost ?? null,
  };
}

// 총운  "상위 N%" 자랑 배지.
// 사주 톤이 총운 구간을 정하면서 점수 분포가 균등에서 종 모양으로 바뀌었다.
// 예전의 (100-total)/35 균등 가정을 그대로 두면 '88점 · 길'인데 배지는 '평범한 하루'로
// 뜨는 식으로 등급과 배지가 서로 다른 말을 한다.
// 그래서 (1) 실제 분포(12띠 × 40일 × 전 조합 50,400건 측정)의 누적 비율을 구간별로
// 보간하고, (2) 라벨은 등급 경계와 같은 지점에서 갈리게 해 둘이 어긋날 수 없게 한다.
const PERCENTILE_ANCHORS: [total: number, pct: number][] = [
  [65, 100],
  [73, 90], // 소길 시작
  [80, 65], // 중길 시작
  [88, 30], // 길 시작
  [95, 6], // 대길 시작
  [99, 1],
];

export function luckPercentile(total: number): { pct: number; label: string; isBrag: boolean } {
  const clamped = Math.max(65, Math.min(99, total));
  let pct = 100;
  for (let i = 1; i < PERCENTILE_ANCHORS.length; i++) {
    const [t0, p0] = PERCENTILE_ANCHORS[i - 1];
    const [t1, p1] = PERCENTILE_ANCHORS[i];
    if (clamped <= t1 || i === PERCENTILE_ANCHORS.length - 1) {
      pct = Math.round(p0 + ((clamped - t0) / (t1 - t0)) * (p1 - p0));
      break;
    }
  }
  pct = Math.max(1, Math.min(99, pct));
  // 라벨 경계 = 등급 경계. 배지와 '총운 88점 · 길'이 같은 이야기를 하게 된다.
  const label =
    clamped >= 95 ? '역대급 행운' : clamped >= 88 ? '상위권' : clamped >= 80 ? '괜찮은 편' : '평범한 하루';
  //  배지는 자랑거리일 때만 띄운다.'상위 90%'를 트로피와 함께 보여주면
  // 자랑 배지가 오히려 김을 빼고, 공유할 마음도 사라진다.
  // (길 이상 = 상위 30% 이내, 대략 사흘에 한 번꼴로 떠서 희소성이 산다)
  return { pct, label, isBrag: clamped >= 88 };
}

export function scoreColor(score: number): string {
  if (score >= 85) return 'var(--score-high)';
  if (score >= 73) return 'var(--score-mid)';
  return 'var(--score-low)';
}

// 작은 텍스트(숫자·라벨)용 — scoreColor보다 어두워 흰 배경에서 WCAG AA(4.5:1)를 충족한다.
// 바/점처럼 큰 장식 요소는 scoreColor를 그대로 쓴다.
export function scoreTextColor(score: number): string {
  if (score >= 85) return 'var(--score-high-text)';
  if (score >= 73) return 'var(--score-mid-text)';
  return 'var(--score-low-text)';
}
