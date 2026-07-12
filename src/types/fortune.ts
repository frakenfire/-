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
  /** 띠×별자리 조합 개인화 한 줄 ("직진하는 🐯범띠 × 화려한 ♌사자자리인 당신에게") */
  persona?: string;
  /** 오늘 일진×내 띠 사주 (띠 설정 시에만). 결과 화면 '오늘의 사주 한 컷'용 */
  saju?: import('../lib/saju').SajuToday | null;
  pinpoint: string;
  summaryLines: string[];
  detailFlow: string;
  goodPoint: string;
  caution: string;
  luckyPoint: string;
  shareLine: string;
  luck: import('../lib/luck').LuckSet;
  /** 쪽지 요정의 편지 (위계 구조) */
  letter: LetterParts;
  /** 쪽지 등급 (가챠 희귀도) */
  rarity: import('../lib/rarity').Rarity;
  /** 오늘의 행동 처방 — 결과의 주인공 */
  dos: string[]; // ✅ 하면 좋은 것
  dont: string; // 🚫 피할 것
  luckyHint: string; // 🍀 행운 타이밍·색 (행동 제외 부분)
  /** 하루 풀이 — 매일 볼 만한 분량의 해석 */
  reading: DailyReading;
  /** 기분에 맞춘 하루 설계 — 결과의 새 주인공 (/goal) */
  dayPlan: import('../data/dayDesign').MoodPlan;
  /** 심층 리포트 — 광고 해제 시 보는 보상 페이지 (순위·미션·궁합·부적) */
  detail: import('../lib/detail').DetailReport;
};

export type DailyReading = {
  overall: string; // 전체 풀이 (등급 해설 + 오늘의 결)
  morning: string; // day: 오전 / month: 초반
  afternoon: string; // day: 오후 / month: 중순
  evening: string; // day: 저녁 / month: 월말
  people: string; // 사람과의 사이
  mind: string; // 마음 관리
  scale: 'day' | 'month'; // 시간 척도 (라벨 결정)
};

// 편지 구조 — 렌더링 위계를 위해 역할별로 분리
export type LetterParts = {
  intro: string; // 인사 + 공감 (작게, 회색)
  highlight: string; // 콕 집은 한마디 (크게, 형광 강조)
  body: string; // 본문
  keepIntro: string; // 부적 소개
  lucky: string; // 행운 조합
  caution: string; // 조심 한 줄
  special?: string; // 등급 특별 한마디 (에픽 이상)
  closing: string; // 맺음
  sign: string; // 서명
};

export type Choice<T extends string> = {
  key: T;
  label: string;
};
