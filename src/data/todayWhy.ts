import type { ConcernKey } from './concerns.ts';
import type { TenGod } from '../lib/tenGods.ts';

// 왜 나한테 오늘 이 말이 나왔는가 — 맨 위 카드의 세 번째 줄.
//
// 재보니 이 앱에서 제일 큰 글자가 사람을 거의 안 보고 있었다. 생일이 전부
// 다른 마흔 명에게 결과를 뽑아 칸마다 몇 가지 값이 나오는지 셌더니,
// headline 과 sub 가 마흔 명 통틀어 두 가지였다. 그 두 줄은 고민·상황·점수
// 밴드만 보고 나온 표 조회라 여덟 글자를 한 번도 안 본다.
//
// 그 밑에 붙던 줄도 이번 달 글자를 보던 것이라 오늘과는 상관이 없었다.
// 그 자리를 오늘 들어온 글자로 바꾼다. 십신 열 x 고민 여섯 = 예순 가지라,
// 같은 날 같은 고민을 물어도 사주가 다르면 다른 까닭이 붙는다.
//
// 규칙: 십신 이름을 쓰지 않는다. 오늘 실제로 무슨 일이 생기는지만 적는다.
// 한 줄, 스무 자 안팎. 위 두 줄이 이미 '뭘 해라' 를 말했으니 여기는 까닭만.

const TODAY_WHY: Record<ConcernKey, Record<TenGod, string>> = {
  work: {
    bijian: '오늘은 함께 일하는 사람과 협력해보세요.',
    geopjae: '오늘은 같은 자리를 두고 경쟁하는 사람이 신경 쓰일 수 있어요. 남을 의식하기보다 내가 할 일을 정리해보세요.',
    siksin: '오늘은 내가 만든 결과물로 평가받을 수 있어요.',
    sanggwan: '오늘은 말이 조금 거칠게 나갈 수 있어요. 전하기 전에 한번 더 생각해보세요.',
    pyeonjae: '오늘은 회사 밖에서 새로운 제안을 받을 수도 있어요.',
    jeongjae: '오늘은 연봉과 조건 얘기가 오가요.',
    pyeongwan: '오늘은 버거운 일이 먼저 와요.',
    jeonggwan: '오늘은 맡을 업무와 책임을 정하기 좋은 날이에요.',
    pyeonin: '오늘은 자격증이나 공부에 관심이 갈 수 있어요.',
    jeongin: '오늘은 조언을 구하거나 서류를 준비하기 좋아요.',
  },
  money: {
    bijian: '오늘은 함께 쓰는 돈의 분담을 정해보세요.',
    geopjae: '오늘은 들어온 만큼 나갈 일이 생겨요.',
    siksin: '오늘은 직접 할 수 있는 일에서 수입을 찾아보세요.',
    sanggwan: '오늘은 크게 걸고 싶어져요.',
    pyeonjae: '오늘은 큰돈이 오갈 일이 보여요.',
    jeongjae: '오늘은 저축 계획을 살펴보기 좋아요.',
    pyeongwan: '오늘은 갚을 돈이 먼저 보여요.',
    jeonggwan: '오늘은 계약과 정산이 정리돼요.',
    pyeonin: '오늘은 돈을 쓰거나 투자하기 전에 조건을 알아보세요.',
    jeongin: '오늘은 받을 돈이 눈에 띄어요.',
  },
  love: {
    bijian: '오늘은 편한 사이가 가까워져요.',
    geopjae: '오늘은 마음이 여러 쪽으로 갈려요.',
    siksin: '오늘은 같이 뭘 하면 가까워져요.',
    sanggwan: '오늘은 한마디가 크게 남아요.',
    pyeonjae: '오늘은 새로 만날 자리가 생겨요.',
    jeongjae: '오늘은 앞으로의 계획을 함께 이야기해보세요.',
    pyeongwan: '오늘은 미뤄둔 다툼이 다시 신경 쓰일 수 있어요.',
    jeonggwan: '오늘은 사이를 정할 말이 나와요.',
    pyeonin: '오늘은 혼자 생각이 길어져요.',
    jeongin: '오늘은 챙겨주는 마음이 오가요.',
  },
  people: {
    bijian: '오늘은 비슷한 사람들끼리 뭉쳐요.',
    geopjae: '오늘은 내 것을 가져가는 사람이 보여요.',
    siksin: '오늘은 서로 아는 사람을 소개할 일이 생길 수 있어요.',
    sanggwan: '오늘은 바른말이 먼저 나가요.',
    pyeonjae: '오늘은 새로 만날 사람이 늘어요.',
    jeongjae: '오늘은 오래 볼 사람이 가려져요.',
    pyeongwan: '오늘은 껄끄러운 사람과 부딪혀요.',
    jeonggwan: '오늘은 누가 뭘 맡는지가 정해져요.',
    pyeonin: '오늘은 혼자 있고 싶어져요.',
    jeongin: '오늘은 도와주는 사람이 나타나요.',
  },
  health: {
    bijian: '오늘은 몸 쓸 일이 늘어요.',
    geopjae: '오늘은 평소보다 무리하기 쉬워요.',
    siksin: '오늘은 끼니와 휴식을 챙겨보세요.',
    sanggwan: '오늘은 참아온 피로가 느껴질 수 있어요.',
    pyeonjae: '오늘은 일정이 여기저기로 흩어져요.',
    jeongjae: '오늘은 식사와 운동 시간을 일정하게 정해보세요.',
    pyeongwan: '오늘은 몸에 부담이 먼저 와요.',
    jeonggwan: '오늘은 정해둔 대로 하면 편해요.',
    pyeonin: '오늘은 잠이 얕아지기 쉬워요.',
    jeongin: '오늘은 충분히 쉬면서 몸 상태를 살펴보세요.',
  },
  mind: {
    bijian: '오늘은 사람이 곁에 있어야 나아져요.',
    geopjae: '오늘은 남과 견주는 마음이 커져요.',
    siksin: '오늘은 꺼내놓으면 가벼워져요.',
    sanggwan: '오늘은 말이 먼저 나가요.',
    pyeonjae: '오늘은 마음이 밖으로 향해요.',
    jeongjae: '오늘은 작은 걸 끝내면 가라앉아요.',
    pyeongwan: '오늘은 마음의 부담이 커질 수 있어요.',
    jeonggwan: '오늘은 정해두면 마음이 놓여요.',
    pyeonin: '오늘은 혼자 생각이 많아질 수 있어요.',
    jeongin: '오늘은 누구한테 기대도 괜찮아요.',
  },
};

// 고른 상황과 부딪히는 칸만 덮는다.
//
// 예순 칸에 상황 넷을 곱하면 이백사십 줄인데, 상황별 금지어로 훑어보니
// 실제로 부딪히는 줄은 하나였다. 그 하나만 덮는다. concernReadings.test 가
// 상황마다 재고 있어서, 문구를 고치다 새로 부딪히면 그 자리에서 빨개진다.
const OVERRIDE: Partial<Record<ConcernKey, Record<string, Partial<Record<TenGod, string>>>>> = {
  work: {
    // 제 일을 시작하려는 사람에게 연봉 협상은 남의 얘기다.
    own: { jeongjae: '오늘은 금액을 얼마로 제시할지 정해보세요.' },
  },
};

/** 고른 상황까지 보고 오늘 근거 한 줄을 고른다. 상황을 안 골랐으면 기본 칸. */
export function todayWhyOf(concern: ConcernKey, option: string | null, god: TenGod): string {
  const covered = option ? OVERRIDE[concern]?.[option]?.[god] : undefined;
  return covered ?? TODAY_WHY[concern][god];
}
