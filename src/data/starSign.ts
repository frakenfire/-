
// 별자리 — 띠와 나란히 쓰는 두 번째 정체성 선택. 생년월일이 아니라
// 별자리 12개 중 직접 선택(선택형 값만 저장, PRD 개인정보 원칙 준수).
// 웹서치 기준(찰떡궁합·도파민 등 인기 궁합 앱): 띠·별자리·혈액형이 3대 표준 축.

export type StarSignId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type StarSign = { id: StarSignId; emoji: string; label: string; dateRange: string };

export const STAR_SIGNS: StarSign[] = [
  { id: 'aries', emoji: '♈', label: '양자리', dateRange: '3/21~4/19' },
  { id: 'taurus', emoji: '♉', label: '황소자리', dateRange: '4/20~5/20' },
  { id: 'gemini', emoji: '♊', label: '쌍둥이자리', dateRange: '5/21~6/21' },
  { id: 'cancer', emoji: '♋', label: '게자리', dateRange: '6/22~7/22' },
  { id: 'leo', emoji: '♌', label: '사자자리', dateRange: '7/23~8/22' },
  { id: 'virgo', emoji: '♍', label: '처녀자리', dateRange: '8/23~9/22' },
  { id: 'libra', emoji: '♎', label: '천칭자리', dateRange: '9/23~10/23' },
  { id: 'scorpio', emoji: '♏', label: '전갈자리', dateRange: '10/24~11/22' },
  { id: 'sagittarius', emoji: '♐', label: '사수자리', dateRange: '11/23~12/21' },
  { id: 'capricorn', emoji: '♑', label: '염소자리', dateRange: '12/22~1/19' },
  { id: 'aquarius', emoji: '♒', label: '물병자리', dateRange: '1/20~2/18' },
  { id: 'pisces', emoji: '♓', label: '물고기자리', dateRange: '2/19~3/20' },
];

export function findStarSign(id: string): StarSign | undefined {
  return STAR_SIGNS.find((s) => s.id === id);
}


