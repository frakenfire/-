
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


