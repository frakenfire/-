import type { FortuneType } from '../types/fortune.ts';

// 쪽지 종류의 이름표. 고르는 화면(TopicScreen)은 없앴고 — 이 앱은 종류를
// 묻지 않고 고민을 묻는다 — 이름표만 결과와 공유 문구에서 쓰인다.
export const FORTUNE_LABEL: Record<FortuneType, string> = {
  tomorrow: '오늘의 나',
  month: '이번 달의 나',
  love: '사랑운',
  money: '돈운',
  work: '일운',
  caution: '조심할 것',
  luck: '행운 포인트',
};
