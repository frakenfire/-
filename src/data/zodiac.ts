
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



/**
 * 그 띠에 해당하는 최근 출생 연도 세 개 (뒤 두 자리, 오래된 것부터).
 *
 * 왜 필요한가: 고르는 화면에 이름만 열둘 늘어놓으면 '나 92년생인데 무슨
 * 띠지' 에서 막힌다. 생년은 다들 알지만 자기 띠 이름은 모르는 사람이 많다.
 * 별자리 칸에 날짜 범위를 둔 것과 같은 이유다.
 *
 * 해의 지지는 (해 - 4) mod 12 다. lib/timing.ts 의 yearBranchOf 와 같은 식을
 * 쓰고, ZODIACS 의 차례(쥐=자=0)가 지지 차례와 같아서 그대로 맞는다.
 *
 * 다만 띠가 바뀌는 자리는 1월 1일이 아니라 입춘이다. 1월과 2월 초에 태어난
 * 사람은 앞 띠다. 그래서 이건 '고르는 데 쓰는 실마리'이지 판정이 아니고,
 * 화면에도 그렇게 적는다.
 */
export function zodiacYears(id: ZodiacId, asOfYear: number, count = 3): string[] {
  const want = ZODIACS.findIndex((z) => z.id === id);
  if (want < 0) return [];
  let y = asOfYear;
  while ((((y - 4) % 12) + 12) % 12 !== want) y -= 1;
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) out.push(y - i * 12);
  return out.reverse().map((v) => String(v % 100).padStart(2, '0'));
}
