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
    bijian: '오늘은 같이 일하는 사람에게 일이 몰려요.',
    geopjae: '오늘은 나와 같은 자리를 노리는 사람이 눈에 띄어요.',
    siksin: '오늘은 결과물로 평가받아요.',
    sanggwan: '오늘은 하고 싶은 말을 세게 하기 쉬워요.',
    pyeonjae: '오늘은 회사 밖에서 제안이나 연락이 들어와요.',
    jeongjae: '오늘은 연봉과 조건 얘기가 오가요.',
    pyeongwan: '오늘은 버거운 일을 먼저 맡기 쉬워요.',
    jeonggwan: '오늘은 역할과 책임이 분명해져요.',
    pyeonin: '오늘은 자격증이나 공부에 관심이 가요.',
    jeongin: '오늘은 도와줄 사람이나 필요한 서류가 눈에 들어와요.',
  },
  money: {
    bijian: '오늘은 함께 쓰는 돈 문제로 얘기할 일이 생겨요.',
    geopjae: '오늘은 들어온 만큼 나갈 일이 생겨요.',
    siksin: '오늘은 직접 벌 수 있는 일이 생겨요.',
    sanggwan: '오늘은 큰돈을 쓰거나 투자하고 싶어질 수 있어요.',
    pyeonjae: '오늘은 큰돈을 쓰거나 받을 일이 생길 수 있어요.',
    jeongjae: '오늘은 돈을 모으기 수월해요.',
    pyeongwan: '오늘은 갚아야 할 돈부터 챙기게 돼요.',
    jeonggwan: '오늘은 계약이나 정산을 정리하기 좋아요.',
    pyeonin: '오늘은 돈을 쓰거나 투자하기 전에 조건을 알아보게 돼요.',
    jeongin: '오늘은 받을 돈이 눈에 띄어요.',
  },
  love: {
    bijian: '오늘은 편한 사람과 더 가까워져요.',
    geopjae: '오늘은 마음을 쉽게 정하지 못해요.',
    siksin: '오늘은 함께 무언가를 하면 더 가까워져요.',
    sanggwan: '오늘은 무심코 한 말 한마디가 오래 남아요.',
    pyeonjae: '오늘은 새 사람을 만날 일이 생겨요.',
    jeongjae: '오늘은 앞으로의 관계를 생각해보게 돼요.',
    pyeongwan: '오늘은 미뤄둔 다툼이 다시 떠오를 수 있어요.',
    jeonggwan: '오늘은 관계를 어떻게 할지 정하는 대화를 하게 돼요.',
    pyeonin: '오늘은 혼자 생각이 길어져요.',
    jeongin: '오늘은 서로 챙겨주고 싶어져요.',
  },
  people: {
    bijian: '오늘은 비슷한 사람들과 어울릴 일이 많아요.',
    geopjae: '오늘은 내 역할이나 돈 문제로 신경 쓸 사람이 생길 수 있어요.',
    siksin: '오늘은 사람을 소개하거나 연결해줄 일이 생겨요.',
    sanggwan: '오늘은 솔직한 말이 먼저 나와요.',
    pyeonjae: '오늘은 새로운 사람을 만날 일이 늘어요.',
    jeongjae: '오늘은 오래 볼 사람이 누군지 조금 더 분명해져요.',
    pyeongwan: '오늘은 껄끄러운 사람과 부딪혀요.',
    jeonggwan: '오늘은 누가 뭘 맡는지가 정해져요.',
    pyeonin: '오늘은 혼자 있고 싶어져요.',
    jeongin: '오늘은 도와주는 사람이 나타나요.',
  },
  health: {
    bijian: '오늘은 몸을 많이 움직이게 돼요.',
    geopjae: '오늘은 평소보다 무리하기 쉬워요.',
    siksin: '오늘은 식사도 잘 되고 쉬기도 수월해요.',
    sanggwan: '오늘은 참아온 피로가 몸으로 느껴져요.',
    pyeonjae: '오늘은 일정이 여러 곳으로 나뉘기 쉬워요.',
    jeongjae: '오늘은 정한 시간에 맞춰 움직이면 편해요.',
    pyeongwan: '오늘은 평소보다 몸이 쉽게 피곤해질 수 있어요.',
    jeonggwan: '오늘은 계획대로 움직이면 몸이 덜 힘들어요.',
    pyeonin: '오늘은 잠이 얕아지기 쉬워요.',
    jeongin: '오늘은 쉬는 만큼 몸이 회복돼요.',
  },
  mind: {
    bijian: '오늘은 혼자 있기보다 사람과 함께 있을 때 마음이 편해져요.',
    geopjae: '오늘은 남과 견주는 마음이 커져요.',
    siksin: '오늘은 마음속 얘기를 꺼내면 한결 가벼워져요.',
    sanggwan: '오늘은 생각보다 말이 먼저 나올 수 있어요.',
    pyeonjae: '오늘은 밖에 나가거나 사람을 만나고 싶어져요.',
    jeongjae: '오늘은 작은 일 하나를 끝내면 마음이 가라앉아요.',
    pyeongwan: '오늘은 부담감이 평소보다 크게 느껴져요.',
    jeonggwan: '오늘은 할 일을 정해두면 마음이 놓여요.',
    pyeonin: '오늘은 생각이 꼬리를 물기 쉬워요.',
    jeongin: '오늘은 믿는 사람에게 기대도 괜찮아요.',
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
    own: { jeongjae: '오늘은 내 값을 얼마로 정할지 생각하게 돼요.' },
  },
};

/** 고른 상황까지 보고 오늘 근거 한 줄을 고른다. 상황을 안 골랐으면 기본 칸. */
export function todayWhyOf(concern: ConcernKey, option: string | null, god: TenGod): string {
  const covered = option ? OVERRIDE[concern]?.[option]?.[god] : undefined;
  return covered ?? TODAY_WHY[concern][god];
}
