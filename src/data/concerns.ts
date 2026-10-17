import type { IconName } from '../components/Icon.tsx';
import type { GodGroup } from '../lib/tenGods.ts';

// 고민 상담 — 사람들이 사주 앱에 실제로 묻는 것들.
//
// 성격 풀이는 한 번 보면 끝이다. 돈이 오가는 건 언제냐를 묻는 쪽이다.
// 그래서 주제를 먼저 고르게 하고, 상황을 한 번 더 좁힌 다음, 시기를 답으로 준다.

export type ConcernKey = 'work' | 'money' | 'love' | 'people' | 'health' | 'mind';

export type ConcernOption = {
  key: string;
  label: string;
  /** 이 상황을 고른 사람에게만 붙는 한 줄 */
  line: string;
};

export type Concern = {
  key: ConcernKey;
  label: string;
  /** 목록에서 보일 한 줄 */
  hook: string;
  icon: IconName;
  /** 2단계 질문 */
  question: string;
  questionLead: string;
  options: ConcernOption[];
  /** 결과 화면 제목 */
  resultTitle: string;
  /** 무엇을 보고 답했는지 */
  basis: string;
  /**
   * 문장 가운데서 이 고민을 부를 때 쓰는 짧은 이름.
   *
   * label 을 그대로 쓰면 '몸과 컨디션은 70점이에요 … 몸과 컨디션에 바로 힘이
   * 되는 자리예요' 처럼 무거워진다. 그렇다고 '이 고민' 이라고 쓰면 앱이
   * 아는 것을 일부러 안 말하는 게 된다.
   */
  shortName: string;
  /**
   * 행운 여섯 칸을 이 고민의 말로 풀 때 쓰는 두 구절.
   *
   * 왜 필요한가: 돈을 물은 사람에게 화면 아래쪽이 '서쪽이 오늘 내 자리예요,
   * 중요한 건 늦은 오후에 놓으면 수월해요' 라고만 말했다. 위에서는 촘촘히
   * 돈 얘기를 하다가 내려갈수록 아무 고민에나 똑같이 붙는 말로 바뀌었다.
   * 실제로 돈 화면 361줄 중 돈을 말하는 줄은 49줄(13%)뿐이었고,
   * 아래쪽에는 돈이 한 번도 안 나오는 90줄짜리 구간이 있었다.
   */
  luckyWhere: string;
  /** 같은 이유로, 시각을 말할 때 쓰는 구절 */
  luckyWhen: string;
};

/** 이 고민에 힘이 되는 기운과 버거운 기운 */
export const CONCERN_FAVOR: Record<ConcernKey, { good: GodGroup[]; ok: GodGroup[]; hard: GodGroup[] }> = {
  work: { good: ['authority', 'support'], ok: ['self'], hard: ['output'] },
  money: { good: ['wealth', 'output'], ok: ['self'], hard: ['support'] },
  love: { good: ['wealth'], ok: ['output', 'self'], hard: ['authority'] },
  people: { good: ['self', 'output'], ok: ['support'], hard: ['authority'] },
  health: { good: ['support', 'self'], ok: ['authority'], hard: ['output', 'wealth'] },
  mind: { good: ['support', 'output'], ok: ['self'], hard: ['authority', 'wealth'] },
};

/** 연애는 남녀가 보는 자리가 다르다. 여자는 관성, 남자는 재성을 짝의 자리로 본다. */
export const LOVE_FAVOR_FEMALE = { good: ['authority'], ok: ['wealth', 'support'], hard: ['output'] } as const;

export const CONCERNS: Concern[] = [
  {
    key: 'work',
    shortName: '일',
    luckyWhere: '일 이야기를 꺼내기 좋은 쪽',
    luckyWhen: '중요한 일은',
    label: '일과 이직',
    hook: '옮길까 말까, 언제가 좋을까',
    icon: 'briefcase',
    question: '지금 일은 어떤 상태예요?',
    questionLead: '지금 상황에 맞춰 일과 이직운을 살펴볼게요.',
    options: [
      { key: 'stay', label: '다니는데 옮기고 싶어요', line: '옮길 곳을 알아보면서 지금 회사에서 마무리할 일도 함께 살펴보세요.' },
      { key: 'rest', label: '지금은 쉬는 중이에요', line: '쉬는 동안 다음 일을 준비하고 있군요. 서두르지 않고 지원할 곳부터 살펴보세요.' },
      { key: 'start', label: '첫 직장을 구하고 있어요', line: '처음 일할 곳을 알아보고 있군요. 어떤 일을 배우고 싶은지도 함께 생각해보세요.' },
      { key: 'own', label: '내 일을 해볼까 해요', line: '사업이나 독립을 생각하고 있군요. 시작할 시기와 필요한 준비를 함께 살펴보세요.' },
    ],
    resultTitle: '일과 이직',
    basis: '책임과 직장을 뜻하는 관성, 공부와 문서를 뜻하는 인성을 중심으로 일과 이직운을 봐요.',
  },
  {
    key: 'money',
    shortName: '돈',
    luckyWhere: '돈 얘기를 꺼내기 좋은 쪽',
    luckyWhen: '큰돈이 오가는 일은',
    label: '돈',
    hook: '모을 때인지 지킬 때인지',
    icon: 'coin',
    question: '돈에 관해 어떤 점이 궁금한가요?',
    questionLead: '선택한 상황에 맞춰 금전운을 살펴볼게요.',
    options: [
      { key: 'save', label: '모으고 싶어요', line: '돈을 꾸준히 모으고 싶군요. 무리 없이 저축할 수 있는 금액부터 정해보세요.' },
      { key: 'leak', label: '나가는 게 너무 많아요', line: '지출이 부담스럽군요. 어떤 항목에 돈이 많이 나가는지 먼저 살펴보세요.' },
      { key: 'big', label: '큰돈 쓸 일이 있어요', line: '큰 지출을 앞두고 있군요. 필요한 금액과 결제 조건을 미리 비교해보세요.' },
      { key: 'invest', label: '투자를 생각 중이에요', line: '넣는 시기와 빼는 시기를 같이 정해두면 흔들릴 일이 줄어요.' },
    ],
    resultTitle: '돈',
    basis: '수입과 재산을 뜻하는 재성을 중심으로, 시기별 금전운을 살펴봐요.',
  },
  {
    key: 'love',
    shortName: '연애',
    luckyWhere: '만날 약속을 잡기 좋은 쪽',
    luckyWhen: '만나는 약속은',
    label: '연애',
    hook: '만날 때인지 기다릴 때인지',
    icon: 'heart',
    question: '지금 어떤 사이예요?',
    questionLead: '선택한 상황에 맞춰 연애운을 살펴볼게요.',
    options: [
      { key: 'alone', label: '혼자예요', line: '새로운 인연을 기대하고 있군요. 사람을 만날 수 있는 모임이나 취미도 찾아보세요.' },
      { key: 'some', label: '썸을 타는 중이에요', line: '서로의 마음이 궁금한 사이군요. 가까워질 때와 대화할 때를 함께 살펴볼게요.' },
      { key: 'couple', label: '만나는 사람이 있어요', line: '지금 만나는 사람과 앞으로 어떻게 지낼지 궁금하군요. 서로의 생각도 차근차근 나눠보세요.' },
      { key: 'past', label: '헤어진 사람이 마음에 남아요', line: '지난 인연이 아직 마음에 남아 있군요. 다시 연락하고 싶은 이유부터 살펴보세요.' },
    ],
    resultTitle: '연애',
    basis: '전통 사주에서 인연을 뜻하는 재성·관성을 보고, 입력한 성별에 따라 풀이 기준을 달리해요.',
  },
  {
    key: 'people',
    shortName: '사람 사이',
    luckyWhere: '사람을 만나기 좋은 쪽',
    luckyWhen: '어려운 말을 꺼낼 일은',
    label: '사람 관계',
    hook: '사람들과 어떻게 지내면 좋을까',
    icon: 'chat',
    question: '누구와의 관계가 고민인가요?',
    questionLead: '상대가 누구냐에 따라 답이 달라져요.',
    options: [
      { key: 'work', label: '회사 사람이에요', line: '함께 일하는 사람과의 관계군요. 업무에 필요한 대화부터 차분하게 정리해보세요.' },
      { key: 'friend', label: '친구예요', line: '오래된 사이일수록 말 한마디가 크게 남아요.' },
      { key: 'family', label: '가족이에요', line: '가족과의 관계가 고민이군요. 가까운 사이여도 내가 감당할 수 있는 범위는 중요해요.' },
      { key: 'new', label: '새로 만난 사람이에요', line: '이제 알아가는 사이군요. 서두르지 않고 그 사람의 말과 행동을 살펴보세요.' },
    ],
    resultTitle: '사람 관계',
    basis: '협력과 경쟁을 뜻하는 비겁, 표현을 뜻하는 식상 등을 함께 보고 사람 관계를 풀이해요.',
  },
  {
    key: 'health',
    shortName: '몸',
    luckyWhere: '몸을 움직이기 좋은 쪽',
    luckyWhen: '몸을 챙기는 일은',
    label: '몸과 컨디션',
    hook: '어디를 먼저 챙길까',
    icon: 'leaf',
    question: '요즘 몸은 어때요?',
    questionLead: '몸을 돌볼 때 참고할 생활 습관을 살펴볼게요.',
    options: [
      { key: 'tired', label: '기운이 없어요', line: '피로가 쌓였군요. 최근 잠과 식사를 충분히 챙겼는지 돌아보세요.' },
      { key: 'sleep', label: '잠을 잘 못 자요', line: '잠들기 어려운 날이 이어지고 있군요. 요즘 수면 습관을 천천히 돌아보세요.' },
      { key: 'ache', label: '아픈 데가 있어요', line: '몸이 불편하군요. 운세로 증상을 판단할 수는 없으니, 필요한 진료는 미루지 마세요.' },
      { key: 'keep', label: '그냥 관리하고 싶어요', line: '평소에 몸을 챙기고 싶군요. 꾸준히 실천할 수 있는 습관부터 찾아보세요.' },
    ],
    resultTitle: '몸과 컨디션',
    basis: '사주의 오행과 휴식·활동에 관한 풀이를 참고해요. 실제 몸 상태를 판단하는 기준은 아니에요.',
  },
  {
    key: 'mind',
    shortName: '마음',
    luckyWhere: '마음이 놓이는 쪽',
    luckyWhen: '마음이 무거워지는 일은',
    label: '마음',
    hook: '이 마음이 언제 가라앉을까',
    icon: 'balloon',
    question: '요즘 마음이 어떤가요?',
    questionLead: '지금 느끼는 마음에 맞춰 풀이해드릴게요.',
    options: [
      { key: 'anxious', label: '불안해요', line: '걱정이 많아 마음이 편치 않군요. 지금 확인할 수 있는 일부터 살펴보세요.' },
      { key: 'burnt', label: '지쳤어요', line: '쉬는 게 게으름이 아니라 다음을 위한 준비예요.' },
      { key: 'stuck', label: '결정을 못 하겠어요', line: '결정을 앞두고 고민이 많군요. 선택마다 좋은 점과 걱정되는 점을 나눠 적어보세요.' },
      { key: 'lonely', label: '외로워요', line: '누군가와 마음을 나누고 싶군요. 편하게 연락할 수 있는 사람을 떠올려보세요.' },
    ],
    resultTitle: '마음',
    basis: '휴식과 배움을 뜻하는 인성, 표현을 뜻하는 식상을 중심으로 마음에 관한 풀이를 살펴봐요.',
  },
];

export function findConcern(key: ConcernKey): Concern {
  return CONCERNS.find((c) => c.key === key) ?? CONCERNS[0];
}
