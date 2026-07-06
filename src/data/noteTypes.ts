import { hashSeed } from '../lib/dateSeed';

// 쪽지 유형 테스트 — 바이럴 리서치 반영.
// 공식: 쉬운 질문 4개 → 예쁜 유형 카드 → "너는 뭐야?" 대화거리 → 궁합으로 2인 참여.

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
  tagline: string;
  traits: [string, string, string];
  bestMatch: NoteTypeId;
  sparkMatch: NoteTypeId; // 티격태격인데 은근 케미
  cheer: string;
};

export const NOTE_TYPES: Record<NoteTypeId, NoteType> = {
  sunshine: {
    id: 'sunshine',
    emoji: '☀️',
    name: '햇살 스티커형',
    tagline: '있는 것만으로 주변이 밝아지는 사람',
    traits: ['긍정 에너지 뿜뿜', '칭찬을 잘해줘요', '먼저 연락하는 쪽'],
    bestMatch: 'cloud',
    sparkMatch: 'dawn',
    cheer: '당신의 밝음은 누군가의 하루를 살려요.',
  },
  dawn: {
    id: 'dawn',
    emoji: '🌙',
    name: '새벽 편지형',
    tagline: '마음이 깊어서 밤에 더 반짝이는 사람',
    traits: ['공감 능력 만렙', '혼자만의 시간 필수', '긴 답장을 쓰는 쪽'],
    bestMatch: 'tree',
    sparkMatch: 'firework',
    cheer: '깊이 느끼는 만큼, 깊이 사랑받을 사람이에요.',
  },
  stamp: {
    id: 'stamp',
    emoji: '🔥',
    name: '돌진 도장형',
    tagline: '고민보다 실행이 빠른 추진력 부자',
    traits: ['일단 해보는 스타일', '결정이 시원시원', '추진력 담당'],
    bestMatch: 'blanket',
    sparkMatch: 'cloud',
    cheer: '당신이 움직이면 일이 움직여요.',
  },
  cloud: {
    id: 'cloud',
    emoji: '☁️',
    name: '몽글 구름형',
    tagline: '내 속도로 둥둥, 마이페이스 힐러',
    traits: ['서두르지 않아요', '곁에 있으면 편안함', '내 리듬이 최우선'],
    bestMatch: 'sunshine',
    sparkMatch: 'stamp',
    cheer: '느긋한 당신 곁에서 다들 숨을 돌려요.',
  },
  firework: {
    id: 'firework',
    emoji: '🎆',
    name: '반짝 폭죽형',
    tagline: '모임의 온도를 올리는 분위기 메이커',
    traits: ['리액션 맛집', '아이디어가 팡팡', '노는 계획은 못 참지'],
    bestMatch: 'breeze',
    sparkMatch: 'dawn',
    cheer: '당신이 오면 그 자리가 축제가 돼요.',
  },
  tree: {
    id: 'tree',
    emoji: '🌳',
    name: '단단 나무형',
    tagline: '흔들려도 자리를 지키는 듬직한 버팀목',
    traits: ['약속은 꼭 지켜요', '고민 상담 단골', '한결같음이 매력'],
    bestMatch: 'dawn',
    sparkMatch: 'breeze',
    cheer: '당신 같은 사람 곁이 제일 안전해요.',
  },
  breeze: {
    id: 'breeze',
    emoji: '🍃',
    name: '살랑 바람형',
    tagline: '얽매이는 건 싫어, 자유로운 영혼',
    traits: ['즉흥 여행 가능', '새로운 것에 두근', '구속은 사양할게요'],
    bestMatch: 'firework',
    sparkMatch: 'tree',
    cheer: '당신의 자유로움이 세상을 넓혀요.',
  },
  blanket: {
    id: 'blanket',
    emoji: '🧸',
    name: '포근 담요형',
    tagline: '조용히 곁을 지키는 다정한 치유자',
    traits: ['잘 들어주는 귀', '작은 것도 기억해요', '따뜻한 말 전문가'],
    bestMatch: 'stamp',
    sparkMatch: 'sunshine',
    cheer: '당신의 다정함은 오래 기억돼요.',
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
  // 0000 ~ 1111 (index = 이진값)
  'cloud', //    0000 집순이·혼자·즉흥·토닥 → 몽글 구름
  'dawn', //     0001 집·혼자·즉흥·파이팅 → 새벽 편지
  'blanket', //  0010 집·혼자·계획·토닥 → 포근 담요
  'tree', //     0011 집·혼자·계획·파이팅 → 단단 나무
  'dawn', //     0100 집·수다·즉흥·토닥 → 새벽 편지
  'breeze', //   0101 집·수다·즉흥·파이팅 → 살랑 바람
  'blanket', //  0110 집·수다·계획·토닥 → 포근 담요
  'tree', //     0111 집·수다·계획·파이팅 → 단단 나무
  'breeze', //   1000 밖·혼자·즉흥·토닥 → 살랑 바람
  'firework', // 1001 밖·혼자·즉흥·파이팅 → 반짝 폭죽
  'cloud', //    1010 밖·혼자·계획·토닥 → 몽글 구름
  'stamp', //    1011 밖·혼자·계획·파이팅 → 돌진 도장
  'sunshine', // 1100 밖·수다·즉흥·토닥 → 햇살 스티커
  'firework', // 1101 밖·수다·즉흥·파이팅 → 반짝 폭죽
  'sunshine', // 1110 밖·수다·계획·토닥 → 햇살 스티커
  'stamp', //    1111 밖·수다·계획·파이팅 → 돌진 도장
];

export function computeNoteType(answers: boolean[]): NoteType {
  const idx = answers.reduce((acc, a) => (acc << 1) | (a ? 1 : 0), 0);
  return NOTE_TYPES[TYPE_MAP[idx] ?? 'cloud'];
}

// ── 궁합 (2인 참여 바이럴 엔진) ──
export type Compat = {
  score: number;
  title: string;
  comment: string;
};

export function computeCompat(a: NoteTypeId, b: NoteTypeId): Compat {
  const ta = NOTE_TYPES[a];
  // 베스트/스파크 매치는 보정
  let score: number;
  if (ta.bestMatch === b || NOTE_TYPES[b].bestMatch === a) {
    score = 90 + (hashSeed([a, b].sort().join('|')) % 10); // 90~99
  } else if (ta.sparkMatch === b || NOTE_TYPES[b].sparkMatch === a) {
    score = 82 + (hashSeed([a, b].sort().join('|')) % 10); // 82~91
  } else if (a === b) {
    score = 78 + (hashSeed(a) % 14); // 78~91 (닮은꼴)
  } else {
    score = 65 + (hashSeed([a, b].sort().join('|')) % 27); // 65~91
  }

  let title: string;
  let comment: string;
  if (score >= 95) {
    title = '천생연분 쪽지';
    comment = '말 안 해도 통하는 사이예요. 오늘 안부 한 통이면 더 완벽해져요.';
  } else if (score >= 88) {
    title = '찰떡 케미';
    comment = '서로의 부족한 조각을 채워주는 조합이에요. 같이 있으면 시간이 빨라요.';
  } else if (score >= 80) {
    title = '은근 좋은 합';
    comment = '겉으론 달라 보여도 결이 잘 맞아요. 깊은 얘기를 나눠보면 알게 돼요.';
  } else if (score >= 73) {
    title = '알아가는 재미';
    comment = '다른 점이 많아서 오히려 배울 게 많은 사이예요. 서두르지 않으면 좋아져요.';
  } else {
    title = '티격태격 매력';
    comment = '투닥거리면서 정드는 조합이에요. 다름을 웃어넘기면 오래가는 사이가 돼요.';
  }

  return { score, title, comment };
}
