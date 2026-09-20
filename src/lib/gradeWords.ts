// 이 앱이 '얼마나 좋은가' 를 말하는 유일한 사다리.
//
// 왜 한 곳에 모았나: 같은 화면 안에 등급 어휘가 네 체계로 굴러다녔다.
//   점수 밴드   좋아요 / 무난해요 / 조심할 때
//   주간 표     아주 좋음 / 좋음 / 잔잔함 / 조심
//   네 가지 운  아주 좋아요 / 무난해요 / 살살 가요
//   총운 등급   아주 좋음 / 좋음 / 괜찮음 / 보통 / 잔잔함
// '좋아요' 와 '좋음', '무난해요' 와 '괜찮음' 과 '보통' 과 '잔잔함' 이
// 같은 뜻인지 다른 뜻인지 읽는 사람이 알 길이 없다. 척도마다 말을 새로
// 지으면 단계가 아니라 낱말이 늘어난다.
//
// 사다리는 넷이고, 척도마다 필요한 만큼만 위에서부터 가져다 쓴다.
// 단계 수가 다른 건 괜찮다. 같은 단계에 다른 말을 쓰는 게 문제다.
//
// 정밀도는 숫자가 맡는다. 말은 방향만 가리킨다 — 밴드 칩이 '무난해요 78'
// 로 숫자를 달고 있으므로, 68 과 78 을 다른 낱말로 가를 이유가 없다.
export const GRADE_LADDER = ['아주 좋아요', '좋아요', '무난해요', '조심할 때'] as const;

export type GradeWord = (typeof GRADE_LADDER)[number];

export const GRADE = {
  best: '아주 좋아요',
  good: '좋아요',
  plain: '무난해요',
  care: '조심할 때',
} as const satisfies Record<string, GradeWord>;

/** 화면에 뜬 등급 말이 사다리 위에 있는지. 검사와 테스트가 쓴다. */
export function isGradeWord(s: string): s is GradeWord {
  return (GRADE_LADDER as readonly string[]).includes(s);
}
