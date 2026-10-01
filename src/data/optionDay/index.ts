import type { TenGod } from '../../lib/tenGods.ts';
import type { ConcernKey } from '../concerns.ts';
import type { DayAct } from '../concernDay.ts';
import work from './work.ts';
import money from './money.ts';
import love from './love.ts';
import people from './people.ts';
import health from './health.ts';
import mind from './mind.ts';

// 오늘 할 것과 하지 말 것 - 고른 상황 x 오늘 일진의 십성.
//
// 전에는 고민 x 십성 예순 칸에 부딪히는 칸만 덮어 썼다. 그래서 '나가는 게
// 너무 많아요' 를 고른 사람에게 '새로 돈을 벌 방법을 적어두세요' 가 나갔다.
// 덮을 칸을 하나씩 찾는 대신 상황마다 열 칸을 따로 쓴다. 스물네 상황 x 열 = 이백마흔.
const OPTION_DAY: Record<ConcernKey, Record<string, Record<TenGod, DayAct>>> = {
  work, money, love, people, health, mind,
};

/** 상황을 안 고르고 들어온 경우에 쓰는 기본 상황 */
const FALLBACK: Record<ConcernKey, string> = {
  work: 'stay', money: 'save', love: 'alone', people: 'work', health: 'tired', mind: 'anxious',
};

export function dayActOf(concern: ConcernKey, optionKey: string | null, god: TenGod): DayAct {
  const byOption = OPTION_DAY[concern];
  return byOption[optionKey && byOption[optionKey] ? optionKey : FALLBACK[concern]][god];
}
