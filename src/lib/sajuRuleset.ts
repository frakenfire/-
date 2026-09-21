import type { NightZiPolicy } from './fourPillars.ts';
import { SEOUL_LONGITUDE } from './koreaTime.ts';

// 결과가 갈리는 규칙을 코드 속에 숨기지 않고 한 곳에 모은다.
//
// 사주는 같은 생년월일시라도 어느 관법을 쓰느냐에 따라 기둥이 달라진다. 그 선택이
// 함수 기본값으로 흩어져 있으면, 나중에 고쳤을 때 기존 사용자의 일주가 소리 없이
// 바뀌고 무엇이 바뀌었는지 추적할 길이 없다.
//
// 여기 적힌 값은 '정답' 이 아니라 '이 앱이 고른 것' 이다. 바꾸려면 version 을 올리고
// golden fixture 를 다시 돌려야 한다.

export type SajuRuleSet = {
  /** 규칙이 바뀌면 올린다. 계산 결과가 달라진 회차를 추적하는 유일한 수단이다. */
  version: number;

  /** 년주가 바뀌는 기준. 입춘(태양황경 315°) 고정 — 달력 1월 1일이 아니다. */
  yearBoundary: 'ipchun';

  /** 월주를 가르는 기준. 12절기(황경 30° 간격) 고정 — 달력의 달이 아니다. */
  monthBoundary: 'solarTerm';

  /** 일주가 바뀌는 자정을 무엇으로 보는가. */
  dayBoundary: 'trueSolarMidnight' | 'clockMidnight';

  /**
   * 야자시(23:00~24:00) 처리.
   *  nextDay  23시부터 다음날 일주 (한국 만세력 다수설)
   *  sameDay  23시대는 그날 일간을 유지하고 지지만 子 (조자시/야자시 구분설)
   */
  nightZi: NightZiPolicy;

  /**
   * 자시 경계를 어느 시계로 재는가. 이것이 nightZi 와 맞물려 실제 경계를 정한다.
   *
   * trueSolar 로 두면 진태양시 23:00 이 경계다. 서울(-32분)에서는 벽시계 23:32 부터
   * 다음날 일주가 된다. 벽시계 23:00~23:31 에 태어난 사람은 아직 그날이다.
   * 이건 dayBoundary 와 trueSolar 를 같이 켠 데서 나오는 귀결이라, 따로 적어두지
   * 않으면 '23시면 넘어간다' 고 착각하게 된다.
   */
  nightZiClock: 'trueSolar' | 'wallClock';

  /** 진태양시 보정 사용 여부. 서울 기준 약 -32분. */
  trueSolar: boolean;

  /** 출생지 경도. 앱이 출생지를 묻지 않으므로 전원 이 값으로 계산된다. */
  defaultLongitude: number;

  /** 대운수를 절입까지의 날수에서 뽑는 방식. */
  daeunStartRounding: 'round' | 'floor';

  /** 대운 방향. 양남음녀 순행 — 태어난 해 천간의 음양과 성별로 갈린다. */
  daeunDirection: 'yangMaleForward';

  /** 태어난 시각을 모를 때 대입하는 시각(24시간제). */
  unknownHourFallback: number;

  /**
   * 삼형(인사신 · 축술미)을 두 글자만으로 잡을 것인가.
   *
   *  pair   두 글자만 있어도 형으로 본다 (현재 동작)
   *  triple 세 글자가 다 모여야 형으로 본다
   *
   * pair 로 정했다. 인사신·축술미가 셋 다 모이면 삼형이고, 둘만 있으면
   * 육형(상형)이라 부르며 그것도 형으로 본다는 게 통설이다. 다만 둘만
   * 있으면 작용력이 많이 줄어든다고 본다. 자묘형·자형(진진·오오·유유·해해)은
   * 애초에 둘로 성립하니 관법이 안 갈린다.
   *
   * 그래서 잡기는 pair 로 잡되, 화면 문장은 세게 쓰지 않는다. 형 줄은
   * '겉으로 티는 덜 나도 안에서 어긋나는 관계예요' 까지만 말한다
   * (RELATION_KO.형). 셋이 다 모인 경우를 따로 더 세게 말하지는 않는데,
   * branchRelations 가 두 글자씩만 보기 때문이다. 더 세게 말하려면 여덟
   * 글자를 한꺼번에 보는 자리가 따로 있어야 한다 - 지금은 안 한다.
   */
  hyeongScope: 'pair' | 'triple';

  /**
   * 음력 입력 지원 여부.
   *  supported  화면에서 음력으로 받고, 계산 전에 양력으로 옮긴다 (윤달 포함)
   *
   * 계산은 언제나 양력 하나로만 돈다. 음력은 입력 방식일 뿐 명식의 기준이 아니다.
   */
  lunarInput: 'supported';
};

/**
 * 이 앱이 쓰는 규칙.
 *
 * 아래 네 가지는 학파가 갈리는 지점이라 임의로 바꾸지 않는다. 바꾸려면 version 을
 * 올리고, golden fixture 의 expected 를 어느 기준으로 다시 딸지 먼저 정해야 한다.
 *   dayBoundary · nightZi · daeunStartRounding · unknownHourFallback
 */
export const RULESET: SajuRuleSet = {
  version: 1,
  yearBoundary: 'ipchun',
  monthBoundary: 'solarTerm',
  dayBoundary: 'trueSolarMidnight',
  nightZi: 'nextDay',
  nightZiClock: 'trueSolar',
  trueSolar: true,
  defaultLongitude: SEOUL_LONGITUDE,
  daeunStartRounding: 'round',
  daeunDirection: 'yangMaleForward',
  unknownHourFallback: 12,
  hyeongScope: 'pair',
  lunarInput: 'supported',
};

/** 규칙을 사람이 읽는 한 줄로. 디버그 출력과 fixture 기록에 쓴다. */
export function rulesetLabel(r: SajuRuleSet = RULESET): string {
  return [
    `v${r.version}`,
    r.yearBoundary,
    r.monthBoundary,
    r.dayBoundary,
    `nightZi:${r.nightZi}@${r.nightZiClock}`,
    r.trueSolar ? `trueSolar@${r.defaultLongitude}` : 'noTrueSolar',
    `daeun:${r.daeunStartRounding}`,
    `hyeong:${r.hyeongScope}`,
    `unknownHour:${r.unknownHourFallback}`,
  ].join(' / ');
}
