import type { TenGod } from '../lib/tenGods.ts';
import type { ConcernKey } from './concerns.ts';
import { CONCERN_DAY, type DayAct } from './concernDay.ts';

// '오늘은 이렇게' 가 고른 상황과 부딪히는 칸만 덮어쓴다.
//
// 이 표를 고민 x 상황 x 십신으로 다 쓰면 이백마흔 칸, 일곱 백 줄이 넘는다.
// 그런데 실제로 재보니 부딪히는 칸은 아홉이었다. 나머지는 상황을 몰라도
// 말이 된다. 그래서 통째로 다시 쓰지 않고 아홉 칸만 덮는다.
//
// 어디가 부딪히는지는 concernDay.test.ts 가 상황마다 금지어로 재고 있어서,
// 문구를 고치다 새로 부딪히면 그 자리에서 빨개진다.

type Override = Partial<Record<TenGod, Partial<DayAct>>>;

const DAY_OVERRIDE: Partial<Record<ConcernKey, Record<string, Override>>> = {
  work: {
    // 첫 자리를 구하는 사람에게는 쌓인 경력이 없다.
    start: {
      pyeonin: { doIt: '해본 일과 배운 것을 다르게 묶어볼 수 있는지 한 번 굴려보기' },
    },
    // 내 일을 하려는 사람에게 지원·채용·연봉은 남의 얘기다.
    own: {
      bijian: { hold: '사업 계획을 처음부터 다시 쓰는 일' },
      pyeonjae: { doIt: '내 일과 겹치는 곳 두 군데가 얼마에 파는지 열어보기' },
      jeongjae: { doIt: '받을 값과 들어갈 원가를 숫자로 적어 기준선 만들기' },
      jeonggwan: { doIt: '사업자 등록이나 신고에 필요한 서류 요건을 한 번 맞춰보기' },
      jeongin: { avoid: '준비가 덜 됐다며 시작 자체를 미루는 것' },
    },
  },
  love: {
    // 혼자인 사람에게는 '만나면' 이 전제할 자리가 없다.
    alone: {
      jeongjae: { doIt: '만날 자리가 생기면 다음 약속까지 그 자리에서 잡기' },
    },
    // 끝난 사이는 다음 약속을 잡는 자리가 아니다.
    past: {
      jeongjae: { doIt: '다시 볼지 말지를 오늘 안에 한 줄로 정해두기' },
    },
  },
  people: {
    // 새로 만난 사람에게 '오래 못 본' 은 성립하지 않는다.
    new: {
      bijian: { doIt: '새로 알게 된 사람에게 먼저 안부 한 줄 건네기' },
    },
  },
};

/** 고민 x 상황 x 그날 기운으로 오늘 할 일을 고른다. 덮을 게 없으면 원래 것. */
export function dayActOf(concern: ConcernKey, optionKey: string | null, god: TenGod): DayAct {
  const base = CONCERN_DAY[concern][god];
  const byOption = optionKey ? DAY_OVERRIDE[concern]?.[optionKey] : undefined;
  const over = byOption?.[god];
  return over ? { ...base, ...over } : base;
}
