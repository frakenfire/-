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
  { key: 'tomorrow', label: '내일의 나', desc: '내일 하루 흐름', cta: '내일쪽지 받기', icon: '🌅' },
  { key: 'month', label: '이번 달의 나', desc: '이번 달 전체 운세', cta: '이번달쪽지 받기', icon: '🗓️' },
  { key: 'love', label: '연애운', desc: '썸·연락·관계 흐름', cta: '연애쪽지 받기', icon: '💗' },
  { key: 'money', label: '돈운', desc: '지출·돈 흐름', cta: '돈운쪽지 받기', icon: '🪙' },
  { key: 'work', label: '일운', desc: '직장·업무·기회', cta: '일운쪽지 받기', icon: '💼' },
  { key: 'caution', label: '조심할 것', desc: '내일 피해야 할 것', cta: '조심쪽지 받기', icon: '⚠️' },
  { key: 'luck', label: '행운 포인트', desc: '색상·시간·행동', cta: '행운쪽지 받기', icon: '⭐' },
];

export const FORTUNE_LABEL: Record<FortuneType, string> = {
  tomorrow: '내일의 나',
  month: '이번 달의 나',
  love: '연애운',
  money: '돈운',
  work: '일운',
  caution: '조심할 것',
  luck: '행운 포인트',
};
