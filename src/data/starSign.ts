import { hashSeed } from '../lib/dateSeed';

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

// 별자리별 한 줄 풀 — 띠와는 다른 결(감정·직관 중심)로 차별화.
const STAR_LINES: string[] = [
  '직감이 유난히 잘 맞는 날이에요. 망설여지면 처음 든 생각을 따라가요.',
  '오늘은 끌리는 대로 움직여도 크게 어긋나지 않아요.',
  '평소보다 감정이 선명하게 느껴지는 날이에요. 억누르지 말고 흘려보내요.',
  '누군가 당신의 이야기를 궁금해하는 날이에요. 먼저 꺼내봐도 좋아요.',
  '집중력이 반짝 오르는 시간대가 있어요. 놓치지 말고 그때 밀어붙여요.',
  '오늘은 계획보다 즉흥이 더 잘 통해요.',
  '마음이 이끄는 사람에게 한 발 다가가기 좋은 날이에요.',
  '작은 신호 하나를 곱씹지 말고 그냥 흘려보내요.',
  '평소 안 쓰던 감각(냄새·소리·색)에 반응이 좋은 날이에요.',
  '혼자 있는 시간이 오히려 답을 주는 날이에요.',
  '오늘의 직관은 근거보다 빠르고 정확해요. 믿어봐도 돼요.',
  '가벼운 대화 속에 뜻밖의 힌트가 섞여 있어요.',
  '오늘은 애쓰지 않아도 자연스럽게 풀리는 쪽이 많아요.',
  '내 마음을 먼저 정리하면 주변도 따라 정리되는 날이에요.',
  '평소와 다른 선택이 의외로 잘 맞는 날이에요.',
  '누군가에게 받은 인상이 오래 남는 하루예요.',
  '오늘은 속도보다 방향이 중요해요. 천천히 확인해요.',
  '마음이 향하는 곳에 오늘의 답이 있어요.',
  '괜히 미뤄둔 연락, 오늘 해보면 반가운 답이 와요.',
  '기분이 하루의 흐름을 정하는 날이에요. 나를 먼저 다독여요.',
  '오늘 느낀 촉이 나중에 맞았다고 느낄 확률이 높아요.',
  '사소한 우연이 의미 있게 다가오는 날이에요.',
  '평소보다 표현이 잘 되는 날이에요. 마음을 말로 옮겨봐요.',
  '고요한 순간에 좋은 생각이 떠오르는 하루예요.',
];

export function starLine(dateKey: string, starId: StarSignId): string {
  return STAR_LINES[hashSeed(`starline|${dateKey}|${starId}`) % STAR_LINES.length];
}
