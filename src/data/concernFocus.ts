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
    self: '동료와의 협력을 뜻하는 비겁',
    output: '표현과 결과물을 뜻하는 식상',
    wealth: '보수와 조건을 뜻하는 재성',
    authority: '직함과 책임을 뜻하는 관성',
    support: '배움과 추천을 뜻하는 인성',
  },
  money: {
    self: '직접 일해서 버는 돈을 뜻하는 비겁',
    output: '기술로 얻는 수입을 뜻하는 식상',
    wealth: '수입과 재산을 뜻하는 재성',
    authority: '세금과 갚을 돈을 뜻하는 관성',
    support: '지원과 도움을 뜻하는 인성',
  },
  love: {
    self: '친구처럼 편한 관계를 뜻하는 비겁',
    output: '매력과 표현을 뜻하는 식상',
    wealth: '관심과 인연을 뜻하는 재성',
    authority: '약속과 책임을 뜻하는 관성',
    support: '배려와 도움을 뜻하는 인성',
  },
  people: {
    self: '또래와 가까운 사람을 뜻하는 비겁',
    output: '대화와 표현을 뜻하는 식상',
    wealth: '관심과 배려를 뜻하는 재성',
    authority: '윗사람과 규칙을 뜻하는 관성',
    support: '도움을 주는 사람을 뜻하는 인성',
  },
  health: {
    self: '활동을 지속하는 성향을 뜻하는 비겁',
    output: '움직임과 표현을 뜻하는 식상',
    wealth: '바깥 활동을 뜻하는 재성',
    authority: '규칙과 부담을 뜻하는 관성',
    support: '휴식과 도움을 뜻하는 인성',
  },
  mind: {
    self: '자신의 생각을 지키는 성향을 뜻하는 비겁',
    output: '생각과 감정의 표현을 뜻하는 식상',
    wealth: '현실에 대한 관심을 뜻하는 재성',
    authority: '기준과 책임을 뜻하는 관성',
    support: '이해와 위로를 뜻하는 인성',
  },
};
