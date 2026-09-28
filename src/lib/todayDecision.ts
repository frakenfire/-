import type { ConcernKey } from '../data/concerns.ts';
import type { TodayDecision } from '../types/fortune.ts';
import type { Band } from './timing.ts';
import type { TenGod } from './tenGods.ts';
import { todayAskOf } from '../data/todayVerdict.ts';
import { dayActOf } from '../data/concernDayOverride.ts';

// 결과 맨 위 결론을 조립한다. 고민을 골라 뽑은 결과는 전부 여기서 나온다.
//
// 전체 종합은 고른 상황과 오늘 점수 밴드에서(todayVerdict), 할 것과 하지 말
// 것은 오늘 들어온 글자에서(concernDay) 나온다. 두 표를 따로 쓰므로 서로
// 반대로 말할 수 있다 - todayDecision.test 가 가능한 조합 칠백스무 개를 전부
// 조립해 본다. 그래서 조립은 이 함수 한 곳에서만 한다.
//
// 몸과 투자는 한 줄을 더 단다. 운세가 병원에 갈지, 얼마를 넣을지를 대신
// 정하면 안 된다.
export function composeTodayDecision(
  concern: ConcernKey,
  option: string | null,
  band: Band,
  god: TenGod,
): TodayDecision {
  const overall = todayAskOf(concern, option, band);
  const act = dayActOf(concern, option, god);
  const note =
    concern === 'health'
      ? '몸이 아프거나 불편하면 운세와 상관없이 의료진에게 확인하세요.'
      : concern === 'money' && option === 'invest'
        ? '실제 투자는 운세가 아니라 가격, 위험, 내 자금 계획을 보고 정하세요.'
        : undefined;
  return {
    overall: { headline: overall.head, summary: overall.sum },
    do: { action: act.doIt, why: act.doWhy },
    dont: { action: act.avoid, why: act.avoidWhy },
    ...(note ? { note } : {}),
  };
}
