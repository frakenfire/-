import { hashSeed } from '../lib/dateSeed';

// "나는 무슨 빵?" 테스트 — 바이럴 공식: 애착 있는 실물(빵)에 대입해야 퍼진다.
// "나 꽈배기래 ㅋㅋ 너는?"이 되는 순간 공유가 시작된다.
// (id 는 저장 호환을 위해 유지, 콘텐츠만 빵으로 교체)

export type NoteTypeId =
  | 'sunshine'
  | 'dawn'
  | 'stamp'
  | 'cloud'
  | 'firework'
  | 'tree'
  | 'breeze'
  | 'blanket';

export type NoteType = {
  id: NoteTypeId;
  emoji: string;
  name: string;
  short: string; // 칩/뱃지용 짧은 이름
  tagline: string;
  traits: [string, string, string];
  bestMatch: NoteTypeId;
  sparkMatch: NoteTypeId; // 단짠 케미 (다른데 끌리는 조합)
  cheer: string;
};

export const NOTE_TYPES: Record<NoteTypeId, NoteType> = {
  sunshine: {
    id: 'sunshine',
    emoji: '🧂',
    name: '겉바속촉 소금빵',
    short: '소금빵',
    tagline: '요즘 제일 잘나가는 그 빵, 알고 보면 진국',
    traits: ['유행은 내가 제일 먼저', '웨이팅도 기꺼이', '겉바속촉 반전 매력'],
    bestMatch: 'cloud',
    sparkMatch: 'dawn',
    cheer: '당신 인기, 다 이유가 있어요.',
  },
  dawn: {
    id: 'dawn',
    emoji: '🥐',
    name: '결결이 크루아상',
    short: '크루아상',
    tagline: '결이 몇 겹인지 나도 몰라, 생각 부자 감성러',
    traits: ['생각이 겹겹이', '감수성 만렙', '혼자 시간 필수'],
    bestMatch: 'tree',
    sparkMatch: 'firework',
    cheer: '겹겹이 쌓인 생각만큼 깊은 사람이에요.',
  },
  stamp: {
    id: 'stamp',
    emoji: '🧄',
    name: '못 참는 마늘빵',
    short: '마늘빵',
    tagline: '한 입 물면 멈출 수 없는 직진 그 자체',
    traits: ['직진밖에 몰라요', '호불호? 호가 이겨요', '존재감이 복도 끝까지'],
    bestMatch: 'blanket',
    sparkMatch: 'cloud',
    cheer: '당신의 직진이 누군가에겐 용기가 돼요.',
  },
  cloud: {
    id: 'cloud',
    emoji: '🍰',
    name: '사르르 카스테라',
    short: '카스테라',
    tagline: '닿기만 해도 사르르, 걸어다니는 힐링',
    traits: ['급할 거 하나 없어요', '옆에 있으면 스르르 힐링', '포근함 그 자체'],
    bestMatch: 'sunshine',
    sparkMatch: 'stamp',
    cheer: '당신 옆자리가 세상에서 제일 포근해요.',
  },
  firework: {
    id: 'firework',
    emoji: '🥨',
    name: '배배꼬인 꽈배기',
    short: '꽈배기',
    tagline: '인생이 꼬여도 설탕 뿌리면 그만, 웃음 담당',
    traits: ['드립이 쉴 틈 없음', '흥이 많아도 너무 많음', '꼬여도 달콤하게'],
    bestMatch: 'breeze',
    sparkMatch: 'dawn',
    cheer: '당신이 웃기면 그 방이 살아나요.',
  },
  tree: {
    id: 'tree',
    emoji: '🥯',
    name: '쫀득단단 베이글',
    short: '베이글',
    tagline: '겉은 단단, 알고 보면 쫀득한 믿음직 츤데레',
    traits: ['무뚝뚝한데 다 챙겨줌', '약속은 철벽 수비', '한결같음이 매력'],
    bestMatch: 'dawn',
    sparkMatch: 'breeze',
    cheer: '묵묵한 당신이 결국 제일 오래 남아요.',
  },
  breeze: {
    id: 'breeze',
    emoji: '🍈',
    name: '반전의 멜론빵',
    short: '멜론빵',
    tagline: '멜론 없는 멜론빵, 알수록 반전인 사람',
    traits: ['겉과 속이 달라요', '예측 불가 매력', '알수록 빠져듦'],
    bestMatch: 'firework',
    sparkMatch: 'tree',
    cheer: '당신의 반전은 아는 사람만 아는 매력이에요.',
  },
  blanket: {
    id: 'blanket',
    emoji: '🥮',
    name: '속꽉찬 단팥빵',
    short: '단팥빵',
    tagline: '수수한 겉모습, 속은 앙금까지 꽉 찬 정 부자',
    traits: ['겉은 수수 속은 꽉 참', '정이 많아도 너무 많음', '오래 볼수록 최고'],
    bestMatch: 'stamp',
    sparkMatch: 'sunshine',
    cheer: '속 깊은 당신, 오래 볼수록 최고예요.',
  },
};

export const NOTE_TYPE_LIST: NoteType[] = Object.values(NOTE_TYPES);

// ── 테스트 질문 (쉽고 가볍게 — 낮은 참여 허들) ──
export type Question = {
  q: string;
  a: string; // 선택 시 비트 1
  b: string; // 선택 시 비트 0
};

export const QUESTIONS: Question[] = [
  {
    q: '금요일 저녁, 갑자기 친구가 "나올래?" 하면?',
    a: '오케이! 10분 컷으로 준비 완료',
    b: '오늘은 이불이랑 약속이 있어…',
  },
  {
    q: '고민이 생기면 나는?',
    a: '친구한테 바로 톡! 같이 고민해줘',
    b: '일단 혼자 곰곰이 정리해볼래',
  },
  {
    q: '여행 스타일은?',
    a: '계획표 촘촘하게! 동선이 생명',
    b: '발 닿는 대로~ 그게 여행이지',
  },
  {
    q: '위로가 필요할 때 듣고 싶은 말은?',
    a: '"잘될 거야! 넌 할 수 있어!"',
    b: '"많이 힘들었겠다…" 하고 토닥토닥',
  },
];

// 16가지 응답 조합 → 8유형 매핑 (a=1, b=0, [q1q2q3q4])
const TYPE_MAP: NoteTypeId[] = [
  'cloud', //    0000 집·혼자·즉흥·토닥 → 카스테라
  'dawn', //     0001 집·혼자·즉흥·파이팅 → 크루아상
  'blanket', //  0010 집·혼자·계획·토닥 → 단팥빵
  'tree', //     0011 집·혼자·계획·파이팅 → 베이글
  'dawn', //     0100 집·수다·즉흥·토닥 → 크루아상
  'breeze', //   0101 집·수다·즉흥·파이팅 → 멜론빵
  'blanket', //  0110 집·수다·계획·토닥 → 단팥빵
  'tree', //     0111 집·수다·계획·파이팅 → 베이글
  'breeze', //   1000 밖·혼자·즉흥·토닥 → 멜론빵
  'firework', // 1001 밖·혼자·즉흥·파이팅 → 꽈배기
  'cloud', //    1010 밖·혼자·계획·토닥 → 카스테라
  'stamp', //    1011 밖·혼자·계획·파이팅 → 마늘빵
  'sunshine', // 1100 밖·수다·즉흥·토닥 → 소금빵
  'firework', // 1101 밖·수다·즉흥·파이팅 → 꽈배기
  'sunshine', // 1110 밖·수다·계획·토닥 → 소금빵
  'stamp', //    1111 밖·수다·계획·파이팅 → 마늘빵
];

export function computeNoteType(answers: boolean[]): NoteType {
  const idx = answers.reduce((acc, a) => (acc << 1) | (a ? 1 : 0), 0);
  return NOTE_TYPES[TYPE_MAP[idx] ?? 'cloud'];
}

// ── 빵 궁합 (2인 참여 바이럴 엔진) ──
export type Compat = {
  score: number;
  title: string;
  comment: string;
};

export function computeCompat(a: NoteTypeId, b: NoteTypeId): Compat {
  const ta = NOTE_TYPES[a];
  let score: number;
  if (ta.bestMatch === b || NOTE_TYPES[b].bestMatch === a) {
    score = 90 + (hashSeed([a, b].sort().join('|')) % 10); // 90~99
  } else if (ta.sparkMatch === b || NOTE_TYPES[b].sparkMatch === a) {
    score = 82 + (hashSeed([a, b].sort().join('|')) % 10); // 82~91
  } else if (a === b) {
    score = 78 + (hashSeed(a) % 14); // 78~91 (같은 빵)
  } else {
    score = 65 + (hashSeed([a, b].sort().join('|')) % 27); // 65~91
  }

  let title: string;
  let comment: string;
  if (score >= 95) {
    title = '갓 구운 단짝';
    comment = '따로 먹어도 맛있는데 같이 두면 완벽해지는 조합이에요. 오늘 안부 한 통이면 더 고소해져요.';
  } else if (score >= 88) {
    title = '겉바속촉 케미';
    comment = '서로의 식감을 살려주는 사이예요. 같이 있으면 시간이 순삭이에요.';
  } else if (score >= 80) {
    title = '커피랑 빵 사이';
    comment = '따로 보면 완전 다른데, 같이 두면 그림이 완성되는 조합이에요.';
  } else if (score >= 73) {
    title = '숙성 중인 반죽';
    comment = '아직 부풀어 오르는 중이에요. 천천히 구우면 꽤 근사한 사이가 돼요.';
  } else {
    title = '단짠단짠 콤비';
    comment = '달았다가 짰다가, 그래서 절대 안 질리는 사이예요. 투닥거리며 정들어요.';
  }

  return { score, title, comment };
}
