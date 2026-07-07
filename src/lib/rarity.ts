import { hashSeed } from './dateSeed';

// 쪽지 등급(가챠) — 토스 '행운복권/행운퀴즈'식 즉각 보상 도파민을 옮긴 장치.
// 대부분 일반이지만 가끔 레어/에픽/전설이 떠서 "나 전설 떴어 ㅋㅋ" 캡처·자랑을 유발한다.

export type RarityTier = 'common' | 'rare' | 'epic' | 'legendary';

export type Rarity = {
  tier: RarityTier;
  label: string;
  emoji: string;
  pct: string; // 뱃지용 희귀도 표기
  special: boolean; // epic 이상 = 특별 연출
};

const TABLE: Record<RarityTier, Omit<Rarity, 'tier'>> = {
  legendary: { label: '전설의 쪽지', emoji: '👑', pct: '상위 3%', special: true },
  epic: { label: '에픽 쪽지', emoji: '💜', pct: '상위 15%', special: true },
  rare: { label: '레어 쪽지', emoji: '✨', pct: '상위 40%', special: false },
  common: { label: '일반 쪽지', emoji: '💌', pct: '', special: false },
};

// 확률: 전설 3% · 에픽 12% · 레어 25% · 일반 60%
export function computeRarity(seed: number): Rarity {
  const roll = hashSeed(`rarity|${seed}`) % 1000; // 0~999
  let tier: RarityTier;
  if (roll < 30) tier = 'legendary';
  else if (roll < 150) tier = 'epic';
  else if (roll < 400) tier = 'rare';
  else tier = 'common';
  return { tier, ...TABLE[tier] };
}

// 등급별 특별 편지 문장 (에픽 이상) — 요정이 흥분해서 덧붙이는 한마디
export const RARITY_LINE: Record<RarityTier, string | null> = {
  legendary:
    '앗… 이건 정말 드물게 나오는 전설의 쪽지예요. 이런 날의 당신에겐, 좋은 일이 안 생기는 게 더 어려워요.',
  epic: '오늘은 조금 특별해요. 이런 쪽지는 자주 못 써주거든요. 그러니 오늘의 당신을 믿어봐요.',
  rare: null,
  common: null,
};
