import { seededRandom } from './dateSeed';
import { LUCKY_FOODS, type LuckyFood } from '../data/luckyFood';

// 입소문 요소: 총운 점수 + 카테고리별 점수 + 행운 세트.
// 인기 '오늘의 운세' 앱(포스텔러/펭귄도사/운세도사)의 공통 히트 요소를 반영.
// seed 로부터 결정적으로 계산 → 같은 뽑기는 항상 같은 결과(공유 안정),
// 다른 뽑기는 조합 폭발로 사실상 매번 다른 결과(입소문).

export type LuckColor = { name: string; hex: string };

export type CategoryScore = { key: string; label: string; emoji: string; score: number };

export type LuckSet = {
  total: number; // 65~99 (긍정 스큐)
  grade: string; // 대길 / 길 / 중길 / 소길 / 평
  categories: CategoryScore[];
  color: LuckColor;
  number: number; // 1~45
  numbers6: number[]; // 행운 번호 6개 (1~45, 재미용)
  direction: string;
  time: string;
  item: string;
  tag: string;
  food: LuckyFood; // 오늘의 행운 음식 (하루 설계 훅)
  luckyWeek: number; // 이번 달 행운의 주 (1~4, month 리포트용)
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

  // 행운 번호 6개 (1~45 중복 없이, 오름차순 — 재미용)
  const set = new Set<number>();
  while (set.size < 6) set.add(1 + Math.floor(r() * 45));
  const numbers6 = [...set].sort((a, b) => a - b);

  const food = pick(LUCKY_FOODS, r);
  const luckyWeek = 1 + Math.floor(r() * 4); // 1~4주차

  return { total, grade: grade(total), categories, color, number, numbers6, direction, time, item, tag, food, luckyWeek };
}

// 총운 → "오늘 상위 N%" 자랑 배지 (좋은 점수일수록 상위, 공유 유발).
export function luckPercentile(total: number): { pct: number; label: string } {
  const pct = Math.max(1, Math.min(60, Math.round((100 - total) * 1.15)));
  const label = pct <= 5 ? '역대급 행운' : pct <= 15 ? '상위권' : pct <= 30 ? '괜찮은 편' : '평범한 하루';
  return { pct, label };
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
