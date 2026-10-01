import type { IconName } from '../components/Icon.tsx';
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
  icon: IconName; // 선 아이콘 이름 (이모지 안 씀)
  color: NoteColor;
};

export type NoteColor = 'softGreen' | 'cream' | 'softYellow' | 'softPink';

export type FortuneResult = {
  /** 해석 엔진 버전 — 스냅샷/로그 재현성 추적용 */
  engineVersion?: number;
  title: string;
  subtitle: string;
  /** 띠×별자리 조합 개인화 한 줄 ("직진하는 범띠 × 화려한 사자자리인 당신에게") */
  persona?: string;
  /** 오늘 일진×내 띠 사주 (띠 설정 시에만). 결과 화면 '오늘의 사주 한 컷'용 */
  saju?: import('../lib/saju').SajuToday | null;
  /** 생년월일시를 넣은 사람에게만 — 오늘 일진이 '내 일간'에게 무엇인지(십신 기준) */
  daily?: import('../lib/dailySaju').DailyMe | null;
  pinpoint: string;
  summaryLines: string[];
  detailFlow: string;
  goodPoint: string;
  caution: string;
  luckyPoint: string;
  shareLine: string;
  luck: import('../lib/luck').LuckSet;
  /** 쪽지 요정의 편지 (위계 구조) */
  /** 쪽지 등급 (가챠 희귀도) */
  rarity: import('../lib/rarity').Rarity;
  /** 오늘의 행동 처방 — 결과의 주인공 */
  dos: string[]; // 하면 좋은 것
  dont: string; // 피할 것
  luckyHint: string; // 행운 타이밍·색 (행동 제외 부분)
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

/**
 * 결과 화면 맨 위 결론 — 쪽지 종류와 상관없이 같은 모양으로 그린다.
 *
 * '결과가 둥글게 말해서 오늘 뭘 하라는 건지 모르겠다' 는 말을 들었다. 그때
 * 결과 맨 위에는 결론 한 줄, 까닭 한 줄이 있었고 할 일과 피할 일은 아래
 * 카드에 따로 있었다. 할 일에는 까닭이 없었다.
 *
 * 그래서 맨 위를 이 다섯 칸으로 못 박는다. 칸마다 맡은 일이 다르다.
 *   overall.headline  오늘 전체 판단. 해도 되는 것과 미룰 것을 같이 말한다
 *   overall.summary   그 판단의 까닭. 할 일을 또 적지 않는다
 *   do.action         오늘 할 것 하나. '~하세요' 로 끝난다
 *   do.why            왜 오늘 그걸 하면 좋은가
 *   dont.action       오늘 하지 말 것 하나. '~마세요' 로 끝난다
 *   dont.why          하면 무슨 일이 생기는가
 */
export type TodayDecision = {
  overall: { headline: string; summary: string };
  do: { action: string; why: string };
  dont: { action: string; why: string };
  /** 몸·투자처럼 운세가 실제 판단을 대신하면 안 되는 자리에 붙는 한 줄 */
  note?: string;
};
