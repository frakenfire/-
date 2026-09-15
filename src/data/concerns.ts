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
    label: '일과 이직',
    hook: '옮길까 말까, 언제가 좋을까',
    icon: 'briefcase',
    question: '지금 일은 어떤 상태예요?',
    questionLead: '고른 상황에 맞춰 시기를 잡아요.',
    options: [
      { key: 'stay', label: '다니는데 옮기고 싶어요', line: '이미 마음이 나가 있는 상태예요. 나가는 날보다 들어갈 곳을 먼저 정해야 손해가 없어요.' },
      { key: 'rest', label: '지금은 쉬는 중이에요', line: '비어 있는 시간이라 조급함이 제일 큰 적이에요. 들어가는 시기만 맞추면 돼요.' },
      { key: 'start', label: '이제 첫 자리를 구해요', line: '첫 자리는 오래 다닐 곳보다 배울 게 있는 곳이 남아요.' },
      { key: 'own', label: '내 일을 해볼까 해요', line: '내 간판을 다는 일은 시작 시기가 절반이에요. 준비보다 타이밍을 봐야 해요.' },
    ],
    resultTitle: '일과 이직',
    basis: '자리와 문서를 뜻하는 기운이 언제 들어오는지로 봐요.',
  },
  {
    key: 'money',
    label: '돈',
    hook: '모을 때인지 지킬 때인지',
    icon: 'coin',
    question: '돈은 어느 쪽이 걸려요?',
    questionLead: '고른 쪽으로 답을 좁혀요.',
    options: [
      { key: 'save', label: '모으고 싶어요', line: '모으는 건 액수보다 기간이에요. 흐름이 좋은 구간에 묶어두면 남아요.' },
      { key: 'leak', label: '나가는 게 너무 많아요', line: '새는 곳이 있는 상태예요. 늘리기 전에 막는 게 먼저예요.' },
      { key: 'big', label: '큰돈 쓸 일이 있어요', line: '큰 지출은 날짜를 고를 수 있어요. 고를 수 있으면 고르는 게 이득이에요.' },
      { key: 'invest', label: '투자를 생각 중이에요', line: '넣는 시기와 빼는 시기를 같이 정해두면 흔들릴 일이 줄어요.' },
    ],
    resultTitle: '돈',
    basis: '재물을 뜻하는 기운이 언제 들어오고 언제 빠지는지로 봐요.',
  },
  {
    key: 'love',
    label: '연애',
    hook: '만날 때인지 기다릴 때인지',
    icon: 'heart',
    question: '지금 어떤 사이예요?',
    questionLead: '사이에 따라 볼 자리가 달라요.',
    options: [
      { key: 'alone', label: '혼자예요', line: '만날 사람이 없는 게 아니라 만나는 자리가 안 열린 때가 있어요.' },
      { key: 'some', label: '썸을 타는 중이에요', line: '한쪽이 먼저 말해야 정해지는 사이예요. 말할 시기가 따로 있어요.' },
      { key: 'couple', label: '만나는 사람이 있어요', line: '오래 가는 사이는 좋은 날보다 버거운 달을 어떻게 넘기냐로 갈려요.' },
      { key: 'past', label: '끝난 사이가 남아 있어요', line: '다시 닿는 흐름과 접는 게 나은 흐름은 글자가 달라요.' },
    ],
    resultTitle: '연애',
    basis: '짝의 자리에 오는 기운을 보고, 남녀에 따라 보는 글자를 바꿔요.',
  },
  {
    key: 'people',
    label: '사람 관계',
    hook: '누구를 믿고 누구를 거를까',
    icon: 'chat',
    question: '누구와의 사이가 걸려요?',
    questionLead: '상대가 누구냐에 따라 답이 달라져요.',
    options: [
      { key: 'work', label: '회사 사람이에요', line: '고를 수 없는 사이라서 거리를 조절하는 게 유일한 방법이에요.' },
      { key: 'friend', label: '친구예요', line: '오래된 사이일수록 말 한마디가 크게 남아요.' },
      { key: 'family', label: '가족이에요', line: '끊을 수 없는 사이라 이기는 것보다 덜 다치는 게 목표예요.' },
      { key: 'new', label: '새로 만난 사람이에요', line: '아직 정해지지 않은 사이예요. 지금 재는 게 나중을 정해요.' },
    ],
    resultTitle: '사람 관계',
    basis: '내 편이 되는 기운과 나를 누르는 기운의 세기로 봐요.',
  },
  {
    key: 'health',
    label: '몸과 컨디션',
    hook: '어디를 먼저 챙길까',
    icon: 'leaf',
    question: '요즘 몸은 어때요?',
    questionLead: '증상보다 어느 쪽이 비었는지를 봐요.',
    options: [
      { key: 'tired', label: '기운이 없어요', line: '쓰는 곳이 많고 채우는 곳이 적은 상태예요.' },
      { key: 'sleep', label: '잠을 잘 못 자요', line: '머리가 안 꺼지는 상태예요. 몸보다 생각을 먼저 내려야 해요.' },
      { key: 'ache', label: '아픈 데가 있어요', line: '사주는 병을 못 봐요. 다만 무리하기 쉬운 구간은 알려줄 수 있어요.' },
      { key: 'keep', label: '그냥 관리하고 싶어요', line: '아프기 전에 챙기는 게 제일 싸게 먹혀요.' },
    ],
    resultTitle: '몸과 컨디션',
    basis: '나를 채우는 기운과 빼가는 기운의 균형으로 봐요.',
  },
  {
    key: 'mind',
    label: '마음',
    hook: '이 마음이 언제 가라앉을까',
    icon: 'balloon',
    question: '마음이 어느 쪽으로 힘들어요?',
    questionLead: '결을 알면 넘기는 방법이 달라져요.',
    options: [
      { key: 'anxious', label: '불안해요', line: '아직 안 온 일을 미리 겪는 중이에요.' },
      { key: 'burnt', label: '지쳤어요', line: '쉬는 게 게으름이 아니라 다음을 위한 준비인 구간이에요.' },
      { key: 'stuck', label: '결정을 못 하겠어요', line: '고르지 못하는 건 정보가 없어서가 아니라 잃을 게 보여서예요.' },
      { key: 'lonely', label: '외로워요', line: '사람이 없는 게 아니라 닿는 자리가 안 열린 때가 있어요.' },
    ],
    resultTitle: '마음',
    basis: '나를 받쳐주는 기운과 풀어내는 기운이 언제 도는지로 봐요.',
  },
];

export function findConcern(key: ConcernKey): Concern {
  return CONCERNS.find((c) => c.key === key) ?? CONCERNS[0];
}
