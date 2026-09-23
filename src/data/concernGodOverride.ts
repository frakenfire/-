import type { TenGod } from '../lib/tenGods.ts';
import type { ConcernKey } from './concerns.ts';
import { CONCERN_GOD } from './concernReadings.ts';

// 고민 x 십신 표가 고른 상황과 부딪히는 칸만 덮는다.
//
// CONCERN_GOD 는 고민 여섯 x 십신 열 = 예순 칸이고 칸마다 열한 줄이 들어 있다.
// 상황 넷을 곱하면 이천육백 줄이 넘는다. 그런데 스물넷 상황에 상황별 금지어를
// 걸어 실제로 훑어보니 부딪히는 줄은 쉰여섯이었다.
//
// 어디가 부딪히느냐는 정해져 있다. 일과 이직의 낱말(연봉·지원·이력서·면접·
// 합격·승진)은 '내 일을 해볼까 해요' 한 사람에게만 남의 얘기고, 연애의
// '상대' 는 '혼자예요' 한 사람에게만 없는 사람이다. 그 자리만 덮는다.
//
// concernReadings.test.ts 가 상황마다 금지어로 재고 있어서, 문구를 고치다
// 새로 부딪히면 그 자리에서 빨개진다.

type Line = (typeof CONCERN_GOD)[ConcernKey][TenGod];
type Override = Partial<Record<TenGod, Partial<Line>>>;

const OVERRIDE: Partial<Record<ConcernKey, Record<string, Override>>> = {
  work: {
    // 쉬는 중인 사람에게는 같이 일하는 동료도, 올라갈 자리도 아직 없다.
    rest: {
      bijian: {
        line: '같이 준비하는 사람이 있으면 빨라요. 혼자 알아보면 늦어져요.',
        good: '같이 준비하는 사람과 나눠서 알아보는 일',
        month: '같이 알아보는 사람이 늘어나는 달이라 모은 정보를 한곳에 쌓아둬야 해요.',
      },
      jeonggwan: {
        line: '자리가 정해지는 때예요. 합격 소식이 붙는 자리예요.',
        month: '규칙대로 준비해둔 것이 결과로 돌아오는 달이라 서류 전형에 유리해요.',
        year: '자리가 정해지기 좋은 해라 합격 소식이 붙어요.',
      },
    },
    // 첫 자리를 구하는 사람에게는 옮길 자리도 올라갈 자리도 없다.
    start: {
      sanggwan: { year: '틀을 깨고 싶어지는 해라 남들 안 가는 길로 눈이 가요.' },
      pyeonjae: { decide: '밖에서 오는 제안을 받아보는 쪽이에요.' },
      jeonggwan: {
        line: '자리가 정해지는 때예요. 합격 소식이 붙는 자리예요.',
        month: '규칙대로 준비해둔 것이 결과로 돌아오는 달이라 서류 전형에 유리해요.',
        year: '자리가 정해지기 좋은 해라 합격 소식이 붙어요.',
      },
    },
    // 내 일을 하려는 사람에게 연봉·지원·이력서·면접·합격·승진은 남의 얘기다.
    own: {
      siksin: {
        year: '올해 쌓은 산출물이 내년 소개 자료의 본문이 돼요. 시작한 수보다 끝낸 수가 값을 해요.',
        daeun: '만든 것으로 먹고사는 십 년이에요. 결과물이 소개를 대신해요.',
      },
      sanggwan: { year: '틀을 깨고 싶어지는 해라 내 간판을 달 생각이 자주 올라와요.' },
      pyeonjae: {
        month: '바깥에서 제안이 들어오는 달이라 미팅을 몰아 잡기 좋아요.',
        decide: '밖에서 오는 일 제안을 받아보는 쪽이에요.',
        year: '올해는 내 일을 아는 사람이 몇인지로 매출이 갈려요.',
      },
      jeongjae: {
        act: '받을 값의 하한선을 숫자로 정해둬요',
        good: '받을 값과 조건을 숫자로 따지는 것',
        yearGood: '값을 올리는 곡선을 한 해 단위로 설계하기',
        month: '값과 조건 이야기가 실제로 오가는 달이라 희망 금액을 숫자로 정해둬야 해요.',
        decide: '받을 값을 못 박는 순서예요.',
        pull: '받을 값과 조건이 숫자로 정해지는',
        year: '값과 조건을 따지기 좋은 해라 협상이 숫자로 통해요.',
        daeun: '한 자리에서 값이 쌓이는 십 년이에요. 오래 한 것이 단가로 돌아와요.',
      },
      jeonggwan: {
        line: '자리가 정해지는 때예요. 계약과 등록이 붙는 자리예요.',
        act: '계약서를 이 달 안에 써요',
        good: '계약을 맺고 범위를 정하는 것',
        month: '규칙대로 해둔 일이 인정으로 돌아오는 달이라 계약과 등록에 유리해요.',
        year: '자리가 정해지기 좋은 해라 계약과 등록이 붙어요.',
      },
      pyeonin: {
        act: '소개 자료에 쓸 자격이나 기술 한 줄을 준비해요',
        yearCare: '준비만 하다 시작을 안 하는 것',
        month: '자격증과 기술 공부가 붙는 달이라 소개 자료에 한 줄 더할 준비를 하기 좋아요.',
        decide: '시작보다 준비가 앞이에요.',
      },
      jeongin: {
        line: '문서와 사람이 도와줘요. 소개와 계약이 잘 붙어요.',
        month: '소개와 계약 소식이 붙는 달이라 도와줄 사람에게 먼저 연락하기 좋아요.',
        year: '올해는 혼자 준비한 사람보다 계획을 같이 봐준 사람이 있는 쪽이 빨라요.',
      },
    },
  },
  love: {
    // 혼자인 사람에게는 아직 '상대' 가 없다.
    alone: {
      bijian: { yearCare: '친구와 그 이상 사이를 흐리는 것' },
      siksin: {
        decide: '같이 할 거리가 있는 자리를 만드는 순서예요.',
        pull: '같이 뭘 하면서 사이가 가까워지는',
      },
      sanggwan: { pull: '한마디가 사이에 크게 남는' },
      jeongjae: {
        decide: '앞일을 같이 볼 사람인지 보는 게 먼저예요.',
        pull: '설렘보다 같이 살 수 있는지를 재게 되는',
      },
      pyeongwan: {
        decide: '부담스러운 자리를 매듭짓는 순서예요.',
        pull: '미뤄둔 다툼이 사람 사이에서 올라오는',
        daeun: '사람과 부딪히면서 배우는 십 년이에요. 참기만 하면 사이가 한 번에 끝나요.',
      },
      jeonggwan: { yearCare: '결정을 미루며 기다리게 하는 것' },
      pyeonin: { year: '올해는 남이 아니라 내가 뭘 원하는지를 먼저 정해야 해요.' },
      jeongin: {
        decide: '사람을 먼저 챙기는 쪽에 서는 순서예요.',
        year: '받고 채우는 해라 먼저 챙기는 쪽으로 서면 오래 가요.',
        daeun: '챙겨주는 사람이 붙는 십 년이에요. 받기만 하면 그 사람이 먼저 지쳐요.',
      },
    },
    some: {
      bijian: { yearCare: '친구와 그 이상 사이를 흐리는 것' },
    },
    // 만나는 사람이 있는데 새 사람을 만나보라고 하면 안 된다.
    couple: {
      bijian: { line: '친구 같은 사이가 편해요. 편한 만큼 설렘은 줄어요.' },
      pyeonjae: {
        line: '다른 사람이 눈에 들어와요. 흔들리기 쉬운 자리예요.',
        decide: '흔들리는 마음을 먼저 가라앉히는 순서예요.',
      },
    },
  },
  people: {
    // 새로 만난 사람에게 '오래 안 본' 은 성립하지 않는다.
    new: {
      bijian: { line: '내 편이 늘어나요. 처음 보는 자리에서 사람이 닿아요.' },
    },
  },
};

/** 고민 x 상황 x 십신 풀이. 덮을 게 없으면 원래 것. */
export function godLineOf(concern: ConcernKey, optionKey: string | null, god: TenGod): Line {
  const base = CONCERN_GOD[concern][god];
  const over = optionKey ? OVERRIDE[concern]?.[optionKey]?.[god] : undefined;
  return over ? { ...base, ...over } : base;
}
