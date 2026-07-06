// PRD §11 — 데이터 구조

export type FortuneType =
  | 'tomorrow'
  | 'month'
  | 'love'
  | 'money'
  | 'work'
  | 'caution'
  | 'luck';

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
};

export type Choice<T extends string> = {
  key: T;
  label: string;
};
