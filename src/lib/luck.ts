import { seededRandom } from './dateSeed';

// 입소문 요소: 총운 점수 + 카테고리별 점수 + 행운 세트.
// 인기 '오늘의 운세' 앱(포스텔러/펭귄도사/운세도사)의 공통 히트 요소를 반영.
// seed 로부터 결정적으로 계산 → 같은 뽑기는 항상 같은 결과(공유 안정),
// 다른 뽑기는 조합 폭발로 사실상 매번 다른 결과(입소문).

export type LuckColor = { name: string; hex: string };

export type CategoryScore = { key: string; label: string; emoji: string; score: number };

export type LuckSet = {
  total: number; // 65~99 (긍정 스큐)
  grade: string; // 대길 / 길 / 순조 …
  categories: CategoryScore[];
  color: LuckColor;
  number: number; // 1~45
  direction: string;
  time: string;
  item: string;
  tag: string;
};

const COLORS: LuckColor[] = [
  { name: '초록색', hex: '#12b886' },
  { name: '파란색', hex: '#3182f6' },
  { name: '노란색', hex: '#f7c948' },
  { name: '분홍색', hex: '#f472b6' },
  { name: '하늘색', hex: '#38bdf8' },
  { name: '보라색', hex: '#a78bfa' },
  { name: '주황색', hex: '#fb923c' },
  { name: '민트색', hex: '#2dd4bf' },
  { name: '남색', hex: '#4f46e5' },
  { name: '베이지색', hex: '#d6bfa3' },
];

const DIRECTIONS = ['동쪽', '서쪽', '남쪽', '북쪽', '동남쪽', '남서쪽', '북동쪽'];
const TIMES = ['이른 아침', '오전', '점심 무렵', '늦은 오후', '저녁', '밤'];
const ITEMS = [
  '따뜻한 커피',
  '작은 메모',
  '이어폰',
  '손거울',
  '텀블러',
  '초록 식물',
  '좋아하는 노래',
  '짧은 산책',
  '향기 좋은 핸드크림',
  '작은 간식',
];
const TAGS = ['정리', '연결', '회복', '기회', '여유', '집중', '다정', '도전', '안정', '설렘'];

const CATEGORY_META = [
  { key: 'love', label: '애정운', emoji: '💗' },
  { key: 'money', label: '재물운', emoji: '🪙' },
  { key: 'work', label: '직장운', emoji: '💼' },
  { key: 'health', label: '건강운', emoji: '🌿' },
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

export function computeLuck(seed: number): LuckSet {
  const r = seededRandom(seed);

  const total = 65 + Math.floor(r() * 35); // 65~99
  const categories: CategoryScore[] = CATEGORY_META.map((c) => ({
    ...c,
    score: 60 + Math.floor(r() * 40), // 60~99
  }));

  const color = pick(COLORS, r);
  const number = 1 + Math.floor(r() * 45);
  const direction = pick(DIRECTIONS, r);
  const time = pick(TIMES, r);
  const item = pick(ITEMS, r);
  const tag = pick(TAGS, r);

  return { total, grade: grade(total), categories, color, number, direction, time, item, tag };
}

export function scoreColor(score: number): string {
  if (score >= 85) return 'var(--score-high)';
  if (score >= 73) return 'var(--score-mid)';
  return 'var(--score-low)';
}
