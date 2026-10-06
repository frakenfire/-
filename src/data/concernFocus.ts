import type { GodGroup } from '../lib/tenGods.ts';
import type { ConcernKey } from './concerns.ts';

// 이 주제를 볼 때 무엇을 보는지 - 명리 이름 대신 뜻으로 말한다.
//
// 전에는 고민과 상관없이 한 벌만 썼다. 그래서 연애를 물어본 사람에게
// '연애는 자리와 규칙으로 봐요' 가 나갔다. 연애를 묻는데 규칙 얘기가
// 나오면 그 줄은 읽을 이유가 없다. 같은 자리라도 돈에서는 갚을 돈이고
// 연애에서는 관계를 정하는 약속이다. 고민마다 그 말로 적는다.
export const FAVOR_WORD: Record<ConcernKey, Record<GodGroup, string>> = {
  work: {
    self: '같이 일하는 사람과의 관계',
    output: '내가 만든 결과물',
    wealth: '연봉과 조건',
    authority: '직함과 책임',
    support: '배우는 일과 추천',
  },
  money: {
    self: '내가 직접 버는 일',
    output: '내 기술로 버는 일',
    wealth: '수입과 지출',
    authority: '빚과 세금',
    support: '받을 돈',
  },
  love: {
    self: '친구처럼 편한 관계',
    output: '내 매력이 드러나는 모습',
    wealth: '끌리는 사람',
    authority: '관계를 정하는 약속',
    support: '챙겨주고 기대는 관계',
  },
  people: {
    self: '또래와 가까운 사람',
    output: '내가 하는 말',
    wealth: '내가 챙기는 사람',
    authority: '윗사람과 규칙',
    support: '나를 도와주는 사람',
  },
  health: {
    self: '버티는 체력',
    output: '몸을 많이 쓰는 일',
    wealth: '무리하는 습관',
    authority: '몸에 생기는 부담',
    support: '쉬는 시간',
  },
  mind: {
    self: '스스로 정하는 힘',
    output: '마음을 표현하는 말',
    wealth: '남의 일에 신경 쓰는 때',
    authority: '나를 압박하는 기준',
    support: '마음을 편하게 해주는 사람',
  },
};
