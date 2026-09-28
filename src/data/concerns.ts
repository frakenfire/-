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
    luckyWhere: '일 얘기를 꺼내기 좋은 방향',
    luckyWhen: '중요한 일은',
    label: '일과 이직',
    hook: '옮길까 말까, 언제가 좋을까',
    icon: 'briefcase',
    question: '지금 일은 어떤 상태예요?',
    questionLead: '고른 상황에 맞춰 시기를 잡아요.',
    options: [
      { key: 'stay', label: '다니는데 옮기고 싶어요', line: '이미 마음이 나가 있는 상태예요. 나가는 날보다 들어갈 곳을 먼저 정해야 손해가 없어요.' },
      { key: 'rest', label: '지금은 쉬는 중이에요', line: '비어 있는 시간이라 조급함이 제일 큰 적이에요. 들어가는 시기만 맞추면 돼요.' },
      { key: 'start', label: '첫 직장을 구하고 있어요', line: '첫 직장은 오래 다닐 수 있는지만 보기보다 배울 게 있는지도 함께 보는 게 좋아요.' },
      { key: 'own', label: '내 일을 해볼까 해요', line: '내 일을 시작할 때는 준비 정도와 시작 시기를 함께 봐야 해요.' },
    ],
    resultTitle: '일과 이직',
    basis: '직장과 서류를 뜻하는 글자가 언제 나타나는지로 봐요.',
  },
  {
    key: 'money',
    shortName: '돈',
    luckyWhere: '돈 얘기를 꺼내기 좋은 방향',
    luckyWhen: '큰돈이 오가는 일은',
    label: '돈',
    hook: '모을 때인지 지킬 때인지',
    icon: 'coin',
    question: '돈에서 가장 신경 쓰이는 건 무엇인가요?',
    questionLead: '고른 내용에 맞춰 답을 구체적으로 볼게요.',
    options: [
      { key: 'save', label: '모으고 싶어요', line: '돈을 모으려면 한 번에 큰 금액을 넣기보다 꾸준히 이어갈 방법을 정하는 게 좋아요.' },
      { key: 'leak', label: '나가는 게 너무 많아요', line: '새는 곳이 있는 상태예요. 늘리기 전에 막는 게 먼저예요.' },
      { key: 'big', label: '큰돈 쓸 일이 있어요', line: '큰 지출은 날짜를 고를 수 있어요. 고를 수 있으면 고르는 게 이득이에요.' },
      { key: 'invest', label: '투자를 생각 중이에요', line: '넣는 시기와 빼는 시기를 같이 정해두면 흔들릴 일이 줄어요.' },
    ],
    resultTitle: '돈',
    basis: '돈을 맡는 글자가 언제 들어오고 언제 빠지는지로 봐요.',
  },
  {
    key: 'love',
    shortName: '연애',
    luckyWhere: '만날 약속을 잡기 좋은 방향',
    luckyWhen: '만나는 약속은',
    label: '연애',
    hook: '만날 때인지 기다릴 때인지',
    icon: 'heart',
    question: '지금 어떤 사이예요?',
    questionLead: '지금 관계에 따라 보는 내용이 달라져요.',
    options: [
      { key: 'alone', label: '혼자예요', line: '새 사람을 만날 일이 적은 시기도 있어요. 지금 만남이 없는 걸 너무 크게 해석하지 않아도 돼요.' },
      { key: 'some', label: '썸을 타는 중이에요', line: '서로의 마음을 확인하려면 누군가는 먼저 말을 꺼내야 해요. 언제 말할지도 함께 볼게요.' },
      { key: 'couple', label: '만나는 사람이 있어요', line: '관계가 오래가려면 힘든 시기에 어떻게 대화하고 풀어가는지가 중요해요.' },
      { key: 'past', label: '끝난 사이가 남아 있어요', line: '다시 연락해도 되는 때와 그대로 끝내는 게 나은 때는 사주에서 다르게 보여요.' },
    ],
    resultTitle: '연애',
    basis: '연애와 배우자를 뜻하는 글자를 보고, 성별에 따라 계산하는 기준을 달리해요.',
  },
  {
    key: 'people',
    shortName: '사람 사이',
    luckyWhere: '사람을 만나기 좋은 방향',
    luckyWhen: '어려운 말을 꺼낼 일은',
    label: '사람 관계',
    hook: '누구를 믿고 누구를 거를까',
    icon: 'chat',
    question: '누구와의 사이가 걸려요?',
    questionLead: '상대가 누구냐에 따라 답이 달라져요.',
    options: [
      { key: 'work', label: '회사 사람이에요', line: '고를 수 없는 사이라서 얼마나 자주 볼지만 내가 정할 수 있어요.' },
      { key: 'friend', label: '친구예요', line: '오래된 사이일수록 말 한마디가 크게 남아요.' },
      { key: 'family', label: '가족이에요', line: '끊을 수 없는 사이라 이기는 것보다 덜 다치는 게 목표예요.' },
      { key: 'new', label: '새로 만난 사람이에요', line: '아직 정해지지 않은 사이예요. 지금 재는 게 나중을 정해요.' },
    ],
    resultTitle: '사람 관계',
    basis: '내 편이 되는 글자와 나를 누르는 글자의 세기로 봐요.',
  },
  {
    key: 'health',
    shortName: '몸',
    luckyWhere: '몸을 움직이기 좋은 방향',
    luckyWhen: '몸을 챙기는 일은',
    label: '몸과 컨디션',
    hook: '어디를 먼저 챙길까',
    icon: 'leaf',
    question: '요즘 몸은 어때요?',
    questionLead: '지금 가장 불편한 부분이 무엇인지부터 볼게요.',
    options: [
      { key: 'tired', label: '기운이 없어요', line: '할 일은 많은데 쉴 시간이 부족한 상태예요.' },
      { key: 'sleep', label: '잠을 잘 못 자요', line: '생각이 계속 이어져 잠들기 어려울 수 있어요. 자기 전에는 생각을 멈추고 쉬는 시간이 필요해요.' },
      { key: 'ache', label: '아픈 데가 있어요', line: '사주는 병을 못 봐요. 다만 무리하기 쉬운 달은 알려줄 수 있어요.' },
      { key: 'keep', label: '그냥 관리하고 싶어요', line: '불편해지기 전에 생활 습관과 검진을 챙기는 게 좋아요.' },
    ],
    resultTitle: '몸과 컨디션',
    basis: '사주에서 나를 도와주는 글자와 지치게 하는 글자가 얼마나 맞는지로 봐요.',
  },
  {
    key: 'mind',
    shortName: '마음',
    luckyWhere: '마음이 놓이기 쉬운 방향',
    luckyWhen: '마음이 무거워지는 일은',
    label: '마음',
    hook: '이 마음이 언제 가라앉을까',
    icon: 'balloon',
    question: '마음에서 가장 힘든 부분은 무엇인가요?',
    questionLead: '결을 알면 넘기는 방법이 달라져요.',
    options: [
      { key: 'anxious', label: '불안해요', line: '아직 안 온 일을 미리 겪는 중이에요.' },
      { key: 'burnt', label: '지쳤어요', line: '쉬는 게 게으름이 아니라 다음을 위한 준비예요.' },
      { key: 'stuck', label: '결정을 못 하겠어요', line: '고르지 못하는 건 정보가 없어서가 아니라 잃을 게 보여서예요.' },
      { key: 'lonely', label: '외로워요', line: '새 사람을 만나거나 가까워질 일이 적은 시기도 있어요. 지금 혼자인 걸 너무 크게 해석하지 않아도 돼요.' },
    ],
    resultTitle: '마음',
    basis: '마음을 안정시키는 글자와 표현을 돕는 글자가 언제 들어오는지 봐요.',
  },
];

export function findConcern(key: ConcernKey): Concern {
  return CONCERNS.find((c) => c.key === key) ?? CONCERNS[0];
}
