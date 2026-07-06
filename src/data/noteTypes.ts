import { hashSeed } from '../lib/dateSeed';

// "나는 무슨 동물?" 테스트 — 실물 대입 바이럴.
// 동물상 밈(리트리버상·곰상·고양이상)은 자기표현 욕구가 검증된 포맷.
// "나 마이웨이 고양이래 ㅋㅋ 너는?"이 되는 순간 공유가 시작된다.
// (id 는 저장 호환을 위해 유지, 콘텐츠만 교체)

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
  sparkMatch: NoteTypeId; // 톰과 제리 케미 (다른데 끌리는 조합)
  cheer: string;
};

export const NOTE_TYPES: Record<NoteTypeId, NoteType> = {
  sunshine: {
    id: 'sunshine',
    emoji: '🐶',
    name: '온동네 인싸 리트리버',
    short: '리트리버',
    tagline: '꼬리부터 반기는 에너지, 온 동네가 내 친구',
    traits: ['먼저 인사하는 쪽', '리액션 자동 발사', '사람이 세상에서 제일 좋아'],
    bestMatch: 'cloud',
    sparkMatch: 'dawn',
    cheer: '당신이 오면 분위기가 켜져요.',
  },
  dawn: {
    id: 'dawn',
    emoji: '🦉',
    name: '새벽 감성 부엉이',
    short: '부엉이',
    tagline: '낮보다 밤에 더 반짝이는 생각 부자',
    traits: ['새벽 2시가 골든타임', '긴 답장 전문', '감수성 만렙'],
    bestMatch: 'tree',
    sparkMatch: 'firework',
    cheer: '깊은 밤의 생각들이 지금의 당신을 만들었어요.',
  },
  stamp: {
    id: 'stamp',
    emoji: '🐯',
    name: '직진밖에 모르는 호랑이',
    short: '호랑이',
    tagline: '고민은 3초, 실행은 바로 지금',
    traits: ['일단 GO', '결정이 시원시원', '추진력이 무기'],
    bestMatch: 'blanket',
    sparkMatch: 'cloud',
    cheer: '당신이 움직이면 길이 생겨요.',
  },
  cloud: {
    id: 'cloud',
    emoji: '🦥',
    name: '마이페이스 나무늘보',
    short: '나무늘보',
    tagline: '서두르면 지는 거야, 내 속도로 간다',
    traits: ['급할 거 하나 없음', '옆에 있으면 저절로 힐링', '평온 그 자체'],
    bestMatch: 'sunshine',
    sparkMatch: 'stamp',
    cheer: '당신 옆에서는 시간도 천천히 가요.',
  },
  firework: {
    id: 'firework',
    emoji: '🦦',
    name: '흥폭발 수달',
    short: '수달',
    tagline: '노는 게 제일 좋아, 타고난 분위기 메이커',
    traits: ['드립 자동 생성', '리액션 맛집', '노는 계획은 못 참지'],
    bestMatch: 'breeze',
    sparkMatch: 'dawn',
    cheer: '당신이 웃기면 그 방이 살아나요.',
  },
  tree: {
    id: 'tree',
    emoji: '🐻',
    name: '등 넓은 곰',
    short: '곰',
    tagline: '말없이 다 챙겨주는 든든함 그 자체',
    traits: ['무뚝뚝 츤데레', '약속은 철벽 수비', '기댈 수 있는 등'],
    bestMatch: 'dawn',
    sparkMatch: 'breeze',
    cheer: '묵묵한 당신이 결국 제일 오래 남아요.',
  },
  breeze: {
    id: 'breeze',
    emoji: '🐈',
    name: '마이웨이 고양이',
    short: '고양이',
    tagline: '부르면 안 오고, 내킬 때 오는 매력',
    traits: ['마이웨이 그 자체', '츤 90 데레 10', '알수록 빠져듦'],
    bestMatch: 'firework',
    sparkMatch: 'tree',
    cheer: '당신의 마이웨이가 누군가에겐 로망이에요.',
  },
  blanket: {
    id: 'blanket',
    emoji: '🐰',
    name: '다정한 토끼',
    short: '토끼',
    tagline: '작은 것도 다 기억하는 다정함',
    traits: ['잘 들어주는 귀', '기념일 다 기억함', '따뜻한 말 전문'],
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
  'cloud', //    0000 집·혼자·즉흥·토닥 → 나무늘보
  'dawn', //     0001 집·혼자·즉흥·파이팅 → 부엉이
  'blanket', //  0010 집·혼자·계획·토닥 → 토끼
  'tree', //     0011 집·혼자·계획·파이팅 → 곰
  'dawn', //     0100 집·수다·즉흥·토닥 → 부엉이
  'breeze', //   0101 집·수다·즉흥·파이팅 → 고양이
  'blanket', //  0110 집·수다·계획·토닥 → 토끼
  'tree', //     0111 집·수다·계획·파이팅 → 곰
  'breeze', //   1000 밖·혼자·즉흥·토닥 → 고양이
  'firework', // 1001 밖·혼자·즉흥·파이팅 → 수달
  'cloud', //    1010 밖·혼자·계획·토닥 → 나무늘보
  'stamp', //    1011 밖·혼자·계획·파이팅 → 호랑이
  'sunshine', // 1100 밖·수다·즉흥·토닥 → 리트리버
  'firework', // 1101 밖·수다·즉흥·파이팅 → 수달
  'sunshine', // 1110 밖·수다·계획·토닥 → 리트리버
  'stamp', //    1111 밖·수다·계획·파이팅 → 호랑이
];

export function computeNoteType(answers: boolean[]): NoteType {
  const idx = answers.reduce((acc, a) => (acc << 1) | (a ? 1 : 0), 0);
  return NOTE_TYPES[TYPE_MAP[idx] ?? 'cloud'];
}

// ── 동물 궁합 (2인 참여 바이럴 엔진) ──
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
    score = 78 + (hashSeed(a) % 14); // 78~91 (같은 동물)
  } else {
    score = 65 + (hashSeed([a, b].sort().join('|')) % 27); // 65~91
  }

  let title: string;
  let comment: string;
  if (score >= 95) {
    title = '운명의 단짝';
    comment = '전생에 같은 무리였던 게 분명해요. 오늘 안부 한 통이면 꼬리가 두 배로 흔들려요.';
  } else if (score >= 88) {
    title = '찰떡 케미';
    comment = '노는 물이 같은 사이예요. 같이 있으면 시간이 순삭이에요.';
  } else if (score >= 80) {
    title = '산책 메이트';
    comment = '걷는 속도는 달라도 같은 길을 걷는 사이예요. 나란히 가면 멀리 가요.';
  } else if (score >= 73) {
    title = '서로 길들이는 중';
    comment = '어린왕자의 여우처럼, 조금씩 특별해지는 중이에요. 서두르지 않아도 돼요.';
  } else {
    title = '톰과 제리';
    comment = '투닥거리는 게 일상인데, 없으면 제일 허전한 사이예요. 그게 정이에요.';
  }

  return { score, title, comment };
}
