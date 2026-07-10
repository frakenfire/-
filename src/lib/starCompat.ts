import { hashSeed } from './dateSeed';
import type { StarSignId } from '../data/starSign';
import type { CompatBand, CompatResult } from './compat';

// 별자리 궁합 — compat.ts(띠 궁합)와 같은 구조, 다른 문구 풀로 결을 다르게.

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

function pick<T>(arr: T[], n: number): T {
  return arr[Math.abs(Math.trunc(n)) % arr.length];
}

export function computeStarCompat(dateKey: string, a: StarSignId, b: StarSignId): CompatResult {
  const [x, y] = [a, b].sort();
  const seed = hashSeed(`starcompat|${dateKey}|${x}|${y}`);
  const score = 55 + (seed % 45);
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
