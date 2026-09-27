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
    bijian: '오늘은 같이 하는 사람 쪽으로 일이 몰려요.',
    geopjae: '오늘은 같은 자리를 노리는 사람이 눈에 들어와요.',
    siksin: '오늘은 만들어 낸 것으로 평가받아요.',
    sanggwan: '오늘은 하고 싶은 말이 세게 나가요.',
    pyeonjae: '오늘은 회사 밖에서 얘기가 들어와요.',
    jeongjae: '오늘은 연봉과 조건 얘기가 오가요.',
    pyeongwan: '오늘은 버거운 일이 먼저 와요.',
    jeonggwan: '오늘은 자리와 책임이 정해지는 쪽이에요.',
    pyeonin: '오늘은 자격이나 공부 쪽으로 손이 가요.',
    jeongin: '오늘은 도와줄 사람과 서류가 붙어요.',
  },
  money: {
    bijian: '오늘은 같이 쓰는 돈이 얽혀요.',
    geopjae: '오늘은 들어온 만큼 나갈 일이 생겨요.',
    siksin: '오늘은 내 손으로 버는 쪽이 열려요.',
    sanggwan: '오늘은 크게 걸고 싶어져요.',
    pyeonjae: '오늘은 큰돈이 오갈 일이 보여요.',
    jeongjae: '오늘은 모으는 쪽이 잘 붙어요.',
    pyeongwan: '오늘은 갚을 돈이 먼저 보여요.',
    jeonggwan: '오늘은 계약과 정산이 정리돼요.',
    pyeonin: '오늘은 넣기 전에 알아보게 돼요.',
    jeongin: '오늘은 받을 돈이 눈에 띄어요.',
  },
  love: {
    bijian: '오늘은 편한 사이가 가까워져요.',
    geopjae: '오늘은 마음이 여러 쪽으로 갈려요.',
    siksin: '오늘은 같이 뭘 하면 가까워져요.',
    sanggwan: '오늘은 한마디가 크게 남아요.',
    pyeonjae: '오늘은 새로 만날 자리가 생겨요.',
    jeongjae: '오늘은 앞일을 맞춰보게 돼요.',
    pyeongwan: '오늘은 미뤄둔 다툼이 올라와요.',
    jeonggwan: '오늘은 사이를 정할 말이 나와요.',
    pyeonin: '오늘은 혼자 생각이 길어져요.',
    jeongin: '오늘은 챙겨주는 마음이 오가요.',
  },
  people: {
    bijian: '오늘은 비슷한 사람들끼리 뭉쳐요.',
    geopjae: '오늘은 내 것을 가져가는 사람이 보여요.',
    siksin: '오늘은 사람을 이어주는 자리가 생겨요.',
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
    siksin: '오늘은 잘 먹히고 잘 쉬어져요.',
    sanggwan: '오늘은 참았던 게 몸으로 나와요.',
    pyeonjae: '오늘은 일정이 여기저기로 흩어져요.',
    jeongjae: '오늘은 정한 시간에 맞추면 잘 붙어요.',
    pyeongwan: '오늘은 몸에 부담이 먼저 와요.',
    jeonggwan: '오늘은 정해둔 대로 하면 편해요.',
    pyeonin: '오늘은 잠이 얕아지기 쉬워요.',
    jeongin: '오늘은 쉬면 그만큼 돌아와요.',
  },
  mind: {
    bijian: '오늘은 사람이 곁에 있어야 나아져요.',
    geopjae: '오늘은 남과 견주는 마음이 커져요.',
    siksin: '오늘은 꺼내놓으면 가벼워져요.',
    sanggwan: '오늘은 말이 먼저 나가요.',
    pyeonjae: '오늘은 마음이 밖으로 향해요.',
    jeongjae: '오늘은 작은 걸 끝내면 가라앉아요.',
    pyeongwan: '오늘은 눌리는 느낌이 커져요.',
    jeonggwan: '오늘은 정해두면 마음이 놓여요.',
    pyeonin: '오늘은 생각이 안으로 파고들어요.',
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
    own: { jeongjae: '오늘은 값을 얼마로 부를지 정하게 돼요.' },
  },
};

/** 고른 상황까지 보고 오늘 근거 한 줄을 고른다. 상황을 안 골랐으면 기본 칸. */
export function todayWhyOf(concern: ConcernKey, option: string | null, god: TenGod): string {
  const covered = option ? OVERRIDE[concern]?.[option]?.[god] : undefined;
  return covered ?? TODAY_WHY[concern][god];
}
