// PRD §11 — 데이터 구조

export type FortuneType =
  | 'tomorrow'
  | 'month'
  | 'love'
  | 'money'
  | 'work'
  | 'caution'
  | 'luck';

// 지금 내 기분 (편지 톤을 결정하는 가벼운 입력)
export type Mood = 'good' | 'soso' | 'tired' | 'anxious' | 'lonely';

export type Note = {
  id: string;
  name: string;
  keyword: string;
  icon: string; // 이모지
  color: NoteColor;
};

export type NoteColor = 'softGreen' | 'cream' | 'softYellow' | 'softPink';

export type FortuneResult = {
  title: string;
  subtitle: string;
  pinpoint: string;
  summaryLines: string[];
  detailFlow: string;
  goodPoint: string;
  caution: string;
  luckyPoint: string;
  shareLine: string;
  luck: import('../lib/luck').LuckSet;
  /** 쪽지 요정의 편지 (문단 배열) */
  letter: string[];
  /** 쪽지 등급 (가챠 희귀도) */
  rarity: import('../lib/rarity').Rarity;
};

export type Choice<T extends string> = {
  key: T;
  label: string;
};
