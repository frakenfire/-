import type { FortuneType } from '../types/fortune';

export type FortuneTypeMeta = {
  key: FortuneType;
  label: string;
  desc: string;
  cta: string;
  icon: string;
};

// PRD §5.1 / §5.2 — 홈 메뉴 & 운세 선택
export const FORTUNE_TYPES: FortuneTypeMeta[] = [
  { key: 'tomorrow', label: '오늘의 나', desc: '오늘 하루 설계', cta: '오늘쪽지 받기', icon: '🌅' },
  { key: 'month', label: '이번 달의 나', desc: '이번 달 주차별 흐름', cta: '이번달쪽지 받기', icon: '🗓️' },
  { key: 'love', label: '연애운', desc: '썸·연락·재회운', cta: '연애쪽지 받기', icon: '💗' },
  { key: 'money', label: '금전운', desc: '수입·지출·재물운', cta: '금전운쪽지 받기', icon: '🪙' },
  { key: 'work', label: '직장운', desc: '직장·업무·기회', cta: '직장운쪽지 받기', icon: '💼' },
  { key: 'caution', label: '조심할 것', desc: '오늘 피해야 할 것', cta: '조심쪽지 받기', icon: '⚠️' },
  { key: 'luck', label: '행운 포인트', desc: '행운의 색·숫자·방향', cta: '행운쪽지 받기', icon: '⭐' },
];

export const FORTUNE_LABEL: Record<FortuneType, string> = {
  tomorrow: '오늘의 나',
  month: '이번 달의 나',
  love: '연애운',
  money: '금전운',
  work: '직장운',
  caution: '조심할 것',
  luck: '행운 포인트',
};
