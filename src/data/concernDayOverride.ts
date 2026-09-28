import type { TenGod } from '../lib/tenGods.ts';
import type { ConcernKey } from './concerns.ts';
import { CONCERN_DAY, type DayAct } from './concernDay.ts';

// '오늘 할 것 / 하지 말아야 할 것' 이 고른 상황과 부딪히는 칸만 덮어쓴다.
//
// 이 표를 고민 x 상황 x 십신으로 다 쓰면 이백마흔 칸이다. 기본 칸을 상황을
// 몰라도 말이 되게 다시 쓰고 나니 부딪히는 칸은 일곱이었다. 그 일곱만 덮는다.
//
// 어디가 부딪히는지는 concernDay.test.ts 가 상황마다 금지어로 재고 있어서,
// 문구를 고치다 새로 부딪히면 그 자리에서 빨개진다.

type Override = Partial<Record<TenGod, Partial<DayAct>>>;

const DAY_OVERRIDE: Partial<Record<ConcernKey, Record<string, Override>>> = {
  work: {
    // 첫 자리를 구하는 사람에게는 '해온 일' 이 아직 적다.
    start: {
      pyeonin: { doIt: '해본 일과 배운 것이 어떤 일에 쓰일 수 있는지 적어보세요.' },
    },
    // 제 일을 하려는 사람에게 '관심 있는 곳의 조건' 은 무엇을 보라는 건지 흐리다.
    own: {
      pyeonjae: { doIt: '비슷한 일을 하는 곳 두 군데의 가격을 찾아서 비교해보세요.' },
    },
  },
  love: {
    // 끝난 사이다. 기본 칸은 마음 가는 사람에게 다가가라고 하는데, 이 사람에게는
    // 그게 지난 사람에게 다시 연락하라는 말이 된다. 맨 위 '오늘 전체 종합' 이
    // 연락을 미루라고 하는 날에도 그 말이 나가면 한 화면이 서로 반대로 말한다.
    past: {
      bijian: {
        doIt: '지난 연애에서 배운 점 하나를 적어보세요.',
        doWhy: '오늘은 편한 마음으로 지난 일을 돌아보기 좋아요. 적어두면 다음 연애에서 같은 일을 줄일 수 있어요.',
      },
      siksin: {
        doIt: '요즘 내가 즐거운 일 하나에 시간을 써보세요.',
        doWhy: '오늘은 좋아하는 일을 할 때 기분이 쉽게 밝아져요. 마음이 편해야 지난 일도 차분하게 볼 수 있어요.',
        // 기본 칸은 '약속을 잡으라' 고 민다. 끝난 사이에서는 지난 사람에게
        // 연락하라는 말로 읽힌다.
        avoid: '지난 사람 생각에 오늘 하루를 다 쓰지 마세요.',
        avoidWhy: '오늘은 좋았던 기억이 자꾸 떠오르기 쉬워요. 거기에 오래 머물면 지금 할 일을 놓쳐요.',
      },
      jeongjae: {
        doIt: '그 사람과의 일을 앞으로 어떻게 할지 한 줄로 적어두세요.',
        doWhy: '글로 써두면 내가 진짜 바라는 게 무엇인지 보여요. 같은 고민을 매일 다시 하지 않아도 돼요.',
      },
      pyeonin: {
        doIt: '궁금한 게 있어도 그 사람에게 묻지 말고 적어만 두세요.',
        doWhy: '오늘은 혼자 생각이 길어지기 쉬워요. 적어두고 하루 지나면 정말 궁금한 건지 알 수 있어요.',
      },
    },
  },
  people: {
    // 새로 만난 사람에게 '연락이 뜸했던' 은 성립하지 않는다.
    new: {
      bijian: { doIt: '새로 알게 된 사람에게 먼저 안부 한 줄을 보내세요.' },
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
