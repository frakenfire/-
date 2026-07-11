import { ZODIACS, type Zodiac } from '../data/zodiac';
import { STAR_SIGNS, type StarSign } from '../data/starSign';
import { hashSeed, pickBySeed } from './dateSeed';

// 홈 인트로 티저 — "오늘은 이런 띠/별자리가 운이 좋아요"로 궁금증을 유발한다.
// 날짜 seed 로 결정적(하루 동안 고정). 내 띠가 있나 확인하려고 들어오게 만든다.

export function luckyZodiacsToday(dateKey: string, n = 3): Zodiac[] {
  return pickBySeed(ZODIACS, n, hashSeed(`luckyzodiac|${dateKey}`));
}

export function luckyStarsToday(dateKey: string, n = 3): StarSign[] {
  return pickBySeed(STAR_SIGNS, n, hashSeed(`luckystar|${dateKey}`));
}
