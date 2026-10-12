import type { ConcernKey } from './concerns.ts';
import type { Band } from '../lib/timing.ts';
import type { GodGroup } from '../lib/tenGods.ts';
import { WORK } from './todayVerdict/work.ts';
import { MONEY } from './todayVerdict/money.ts';
import { LOVE } from './todayVerdict/love.ts';
import { PEOPLE } from './todayVerdict/people.ts';
import { HEALTH } from './todayVerdict/health.ts';
import { MIND } from './todayVerdict/mind.ts';

// 오늘 풀이 - 결과의 '오늘 풀이' 카드.
//
// 전에는 칸마다 네 벌을 두고 날짜 순번으로 돌려 골랐다. 그래서 오늘 사주가
// '도움과 연락이 들어오는 날' 인데 '헤드헌터 전화에 15분만 응해보세요' 가 나왔다.
// 날짜로 고른 글은 그날 사주와 아무 상관이 없었다(사장님 지적: 운세와 연결되지
// 않는 행동 지침, 매일 같은 취업 준비 체크리스트).
//
// 이제 다섯 벌을 오늘 십신의 무리(비겁, 식상, 재성, 관성, 인성)에 하나씩 묶는다.
// 오늘이 인성 날이면 도움과 배움, 비겁 날이면 경쟁과 선택, 관성 날이면 책임과
// 기다림을 풀이한다. 밴드(good, ok, hard)는 그 일을 얼마나 밀어도 되는지를 정한다.
//   head  첫 문장이 카드의 큰 결론이다. 오늘이 어떤 날인지 생활 속 상황으로 풀이한다.
//   sum   그래서 오늘 어떻게 지내면 좋을지 자연스럽게 잇는다.
// 글쓰기 기준은 scratchpad 가 아니라 이 앱의 문장 규칙(copyQuality.test)이 본다.
// 입력에 없는 숫자, 금액, 사건을 지어내지 않고, 명령을 연달아 늘어놓지 않는다.
//
// 고른 상황까지 본다. '지금은 쉬는 중이에요' 를 고른 사람에게 출근 얘기를 하지 않는다.
// 몸과 돈은 선을 긋는다. 운세가 병원에 갈지, 투자를 할지를 대신 정하지 않는다.

export type Verdict = { head: string; sum: string };
/** 밴드마다 다섯 벌. 순서는 GROUP_ORDER(비겁, 식상, 재성, 관성, 인성)를 따른다 */
export type Ask = { a: Record<Band, Verdict[]> };

const GROUP_ORDER: GodGroup[] = ['self', 'output', 'wealth', 'authority', 'support'];

/** 상황을 안 고르고 들어온 경우에 쓰는 기본값 */
const FALLBACK: Record<ConcernKey, string> = {
  work: 'stay', money: 'save', love: 'alone', people: 'work', health: 'tired', mind: 'anxious',
};

const TABLE: Record<ConcernKey, Record<string, Ask>> = {
  work: WORK, money: MONEY, love: LOVE, people: PEOPLE, health: HEALTH, mind: MIND,
};

/**
 * 고민, 고른 상황, 오늘 밴드, 오늘 십신 무리로 오늘 풀이를 고른다.
 * pick 은 GROUP_ORDER 안의 자리다. 숫자로도 받는 건 테스트가 다섯 벌을 돌기 위해서다.
 */
export function todayAskOf(concern: ConcernKey, optionKey: string | null, band: Band, pick: number | GodGroup = 0): Verdict & { band: Band } {
  const byOption = TABLE[concern];
  const key = optionKey && byOption[optionKey] ? optionKey : FALLBACK[concern];
  const list = byOption[key].a[band];
  const i = typeof pick === 'number' ? Math.abs(pick) % list.length : GROUP_ORDER.indexOf(pick);
  return { ...list[i], band };
}

export { TABLE as TODAY_TABLE };
