import type { ZodiacId } from './zodiac';
import type { StarSignId } from './starSign';

// 띠·별자리 조합을 '내 얘기'처럼 만들기 위한 성격 특성 한 단어.
// 띠(12) × 별자리(12) = 144가지 캐릭터 문구가 조합으로 생긴다.

export const ZODIAC_TRAIT: Record<ZodiacId, string> = {
  rat: '눈치 빠른',
  ox: '우직한',
  tiger: '직진하는',
  rabbit: '다정한',
  dragon: '카리스마 넘치는',
  snake: '은근 치밀한',
  horse: '자유로운',
  sheep: '부드러운',
  monkey: '재치 넘치는',
  rooster: '야무진',
  dog: '의리 있는',
  pig: '복 많은',
};

export const STAR_TRAIT: Record<StarSignId, string> = {
  aries: '열정적인',
  taurus: '든든한',
  gemini: '재기발랄한',
  cancer: '정 많은',
  leo: '화려한',
  virgo: '섬세한',
  libra: '균형 잡힌',
  scorpio: '강렬한',
  sagittarius: '모험적인',
  capricorn: '성실한',
  aquarius: '개성 있는',
  pisces: '감성적인',
};
