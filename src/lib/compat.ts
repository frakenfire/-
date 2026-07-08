import { hashSeed } from './dateSeed';
import type { ZodiacId } from '../data/zodiac';

// 오늘의 친구 궁합 — 로그인 없이 되는 바이럴 훅.
// 내 띠 + 상대 띠 + 날짜로 결정적 점수/코멘트. 순서 무관(정렬)로 같은 쌍은 같은 결과.

export type CompatBand = 'best' | 'good' | 'ok';

export type CompatResult = {
  score: number; // 55~99 (긍정 스큐)
  band: CompatBand;
  headline: string;
  good: string; // 잘 맞는 점
  caution: string; // 오늘 조심할 점
  tip: string; // 오늘의 팁
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

function pick<T>(arr: T[], n: number): T {
  return arr[Math.abs(Math.trunc(n)) % arr.length];
}

export function computeCompat(dateKey: string, a: ZodiacId, b: ZodiacId): CompatResult {
  const [x, y] = [a, b].sort();
  const seed = hashSeed(`compat|${dateKey}|${x}|${y}`);
  const score = 55 + (seed % 45); // 55~99
  const band: CompatBand = score >= 85 ? 'best' : score >= 70 ? 'good' : 'ok';
  const head = band === 'best' ? HEAD_BEST : band === 'good' ? HEAD_GOOD : HEAD_OK;
  return {
    score,
    band,
    headline: pick(head, seed / 3),
    good: pick(GOOD, seed / 7),
    caution: pick(CAUTION, seed / 11),
    tip: pick(TIP, seed / 13),
  };
}
