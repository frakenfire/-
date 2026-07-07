import { hashSeed } from '../lib/dateSeed';

// 띠별 오늘의 한 줄 — 운세 앱 표준 필수 기능.
// 띠는 12개 중 선택(선택형 값만 저장, 생년월일 아님 — PRD 개인정보 원칙 준수).

export type ZodiacId =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'sheep'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig';

export type Zodiac = { id: ZodiacId; emoji: string; label: string };

export const ZODIACS: Zodiac[] = [
  { id: 'rat', emoji: '🐭', label: '쥐띠' },
  { id: 'ox', emoji: '🐮', label: '소띠' },
  { id: 'tiger', emoji: '🐯', label: '범띠' },
  { id: 'rabbit', emoji: '🐰', label: '토끼띠' },
  { id: 'dragon', emoji: '🐲', label: '용띠' },
  { id: 'snake', emoji: '🐍', label: '뱀띠' },
  { id: 'horse', emoji: '🐴', label: '말띠' },
  { id: 'sheep', emoji: '🐑', label: '양띠' },
  { id: 'monkey', emoji: '🐵', label: '원숭이띠' },
  { id: 'rooster', emoji: '🐔', label: '닭띠' },
  { id: 'dog', emoji: '🐶', label: '개띠' },
  { id: 'pig', emoji: '🐷', label: '돼지띠' },
];

export function findZodiac(id: string): Zodiac | undefined {
  return ZODIACS.find((z) => z.id === id);
}

// 띠별 한 줄 풀 — 날짜×띠 seed 로 결정. 같은 날 띠마다 다른 문장이 걸린다.
const ZODIAC_LINES: string[] = [
  '오전에 잡은 리듬이 하루 끝까지 가는 날이에요.',
  '귀인이 가까이 있어요. 오늘 만나는 사람에게 다정하게요.',
  '작은 소식 하나가 기분을 바꿔놓는 날이에요.',
  '서두르면 놓치고, 천천히 가면 다 챙기는 날이에요.',
  '오늘은 지갑보다 마음을 여는 게 이득이에요.',
  '미뤄둔 연락 한 통이 좋은 물꼬를 터줘요.',
  '점심 이후로 기운이 올라오는 흐름이에요.',
  '오늘의 직감이 평소보다 잘 맞는 편이에요.',
  '정리한 만큼 들어오는 날 — 책상부터 가볍게요.',
  '말수를 줄이면 실속이 커지는 날이에요.',
  '뜻밖의 칭찬이 기다리고 있어요. 평소대로만 해요.',
  '오늘은 새 것보다 익숙한 것에서 운이 나와요.',
  '한 박자 쉬어가면 더 멀리 가는 날이에요.',
  '저녁 무렵 반가운 연락이 닿기 쉬워요.',
  '몸을 먼저 챙기면 나머지가 따라오는 날이에요.',
  '오늘 건넨 친절이 곧 두 배로 돌아와요.',
  '결정은 오전에, 휴식은 오후에 — 그 순서가 좋아요.',
  '평소 안 가던 길에 작은 행운이 숨어 있어요.',
  '오늘은 듣는 사람이 이기는 날이에요.',
  '작게 시작한 일이 생각보다 커지는 기운이에요.',
  '먼저 웃으면 분위기가 내 편이 되는 날이에요.',
  '잊고 있던 것에서 반가운 소식이 나와요.',
  '오늘의 수고는 티가 나요. 조금만 더 힘내요.',
  '마음이 가는 쪽이 정답에 가까운 날이에요.',
];

export function zodiacLine(dateKey: string, zodiacId: ZodiacId): string {
  return ZODIAC_LINES[hashSeed(`zline|${dateKey}|${zodiacId}`) % ZODIAC_LINES.length];
}
