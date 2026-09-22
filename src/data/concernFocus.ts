import type { GodGroup } from '../lib/tenGods.ts';
import type { ConcernKey } from './concerns.ts';

// 이 주제를 볼 때 무엇을 보는지 - 명리 이름 대신 뜻으로 말한다.
//
// 전에는 고민과 상관없이 한 벌만 썼다. 그래서 연애를 물어본 사람에게
// '연애는 자리와 규칙으로 봐요' 가 나갔다. 연애를 묻는데 규칙 얘기가
// 나오면 그 줄은 읽을 이유가 없다. 같은 자리라도 돈에서는 갚을 돈이고
// 연애에서는 사이가 정해지는 자리다. 고민마다 그 말로 적는다.
export const FAVOR_WORD: Record<ConcernKey, Record<GodGroup, string>> = {
  work: {
    self: '같이 일하는 사람 자리',
    output: '내놓는 결과물 자리',
    wealth: '연봉과 조건 자리',
    authority: '직함과 책임 자리',
    support: '배우고 추천받는 자리',
  },
  money: {
    self: '내가 몸으로 버는 자리',
    output: '내 기술로 버는 자리',
    wealth: '돈이 들어오고 나가는 자리',
    authority: '갚을 돈과 세금 자리',
    support: '받는 돈 자리',
  },
  love: {
    self: '친구처럼 편한 자리',
    output: '내 매력이 드러나는 자리',
    wealth: '끌리는 사람이 보이는 자리',
    authority: '사이가 정해지는 자리',
    support: '챙겨주고 기대는 자리',
  },
  people: {
    self: '또래와 가까운 사람 자리',
    output: '내 말이 밖으로 나가는 자리',
    wealth: '내가 챙기는 사람 자리',
    authority: '윗사람과 규칙 자리',
    support: '나를 받쳐주는 사람 자리',
  },
  health: {
    self: '버티는 체력 자리',
    output: '기운을 밖으로 쓰는 자리',
    wealth: '무리하게 되는 자리',
    authority: '몸에 부담이 오는 자리',
    support: '쉬고 채우는 자리',
  },
  mind: {
    self: '내 중심을 잡는 자리',
    output: '마음을 꺼내 놓는 자리',
    wealth: '마음이 바깥으로 쏠리는 자리',
    authority: '나를 누르는 자리',
    support: '마음을 채워주는 자리',
  },
};
