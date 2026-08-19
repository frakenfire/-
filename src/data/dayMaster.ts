// 일간(日干) 10종 — 사주에서 '나' 그 자체.
//
// 명리를 모르는 사람에게 "당신은 壬水입니다" 는 아무 말도 아니다.
// 그래서 열 개의 천간을 각각 하나의 상(象)으로 옮겼다. 바다, 촛불, 큰 나무처럼
// 설명 없이 그림이 그려지는 말로. MBTI 가 네 글자로 성격을 쥐여주듯,
// 여기서는 한 글자가 그 일을 한다.
//
// 원칙:
//  - 좋은 말만 하지 않는다. 그림자를 함께 적어야 '나를 봤다' 는 느낌이 생긴다.
//  - 단정하되 규정하지 않는다. "당신은 ~다" 가 아니라 "~하는 쪽" 으로 쓴다.
//  - 운세가 아니라 성질을 말한다. 오늘의 운은 일진과 만나야 나온다.

export type DayMasterId =
  | 'gap' | 'eul' | 'byeong' | 'jeong' | 'mu'
  | 'gi' | 'gyeong' | 'sin' | 'im' | 'gye';

export type DayMasterInfo = {
  id: DayMasterId;
  hanja: string;
  kor: string;
  /** 상(象) — 이 일간을 한 장면으로 */
  icon: string;
  /** 별명. 공유될 때 이 이름이 돌아다닌다 */
  name: string;
  /** 한 줄 요약 — 카드 맨 위에 크게 */
  tagline: string;
  /** 성격 2~3문장 */
  nature: string;
  /** 잘하는 것 3개 (칩으로 표시) */
  strengths: string[];
  /** 조심할 것 — 하나만. 여러 개면 잔소리가 된다 */
  shadow: string;
  /** 이 사람이 살아나는 순간 */
  shines: string;
  /** 대표 색 (카드 그라데이션) */
  hue: string;
};

export const DAY_MASTERS: Record<DayMasterId, DayMasterInfo> = {
  gap: {
    id: 'gap', hanja: '甲', kor: '갑목', icon: '🌳', name: '큰 나무',
    tagline: '휘지 않고 위로 자라는 사람',
    nature:
      '한번 방향을 정하면 곧게 밀고 올라가요. 눈치보다 원칙이 먼저고, 그래서 믿음직하다는 말을 자주 들어요. 대신 한번 정한 길을 바꾸는 건 남들보다 오래 걸려요.',
    strengths: ['추진력', '책임감', '리더 기질'],
    shadow: '아니다 싶어도 이미 세운 계획이라 끝까지 가버릴 때가 있어요.',
    shines: '아무도 먼저 나서지 않는 자리에서 "그럼 제가 할게요" 할 때',
    hue: '#2f9e63',
  },
  eul: {
    id: 'eul', hanja: '乙', kor: '을목', icon: '🌿', name: '풀과 덩굴',
    tagline: '부러지지 않고 감아 오르는 사람',
    nature:
      '정면으로 부딪히기보다 돌아가는 길을 잘 찾아요. 상황이 바뀌어도 금방 적응하고, 어디에 놓아도 결국 자리를 잡아요. 유연한 게 약해 보일 뿐, 실은 제일 오래 버티는 쪽이에요.',
    strengths: ['적응력', '섬세함', '끈기'],
    shadow: '맞추는 게 익숙해서 정작 내가 뭘 원하는지 놓칠 때가 있어요.',
    shines: '아무도 답이 없다고 할 때 옆길을 찾아낼 때',
    hue: '#5cb85c',
  },
  byeong: {
    id: 'byeong', hanja: '丙', kor: '병화', icon: '☀️', name: '한낮의 해',
    tagline: '있으면 티가 나는 사람',
    nature:
      '숨기는 게 잘 안 돼요. 좋으면 좋다고, 아니면 아니라고 얼굴에 다 나와요. 그 솔직함이 사람을 끌어당기고, 있는 자리를 환하게 만들어요.',
    strengths: ['밝음', '솔직함', '분위기 메이커'],
    shadow: '기분이 그대로 새어나가서 주변이 같이 출렁일 때가 있어요.',
    shines: '가라앉은 자리에 들어가 공기를 바꿔놓을 때',
    hue: '#f5883b',
  },
  jeong: {
    id: 'jeong', hanja: '丁', kor: '정화', icon: '🕯️', name: '촛불',
    tagline: '조용히, 그러나 오래 밝히는 사람',
    nature:
      '크게 떠들지 않지만 필요한 자리에 정확히 빛을 둬요. 사람의 표정 변화나 말끝을 잘 알아채고, 한 가지에 깊게 파고드는 힘이 있어요.',
    strengths: ['집중력', '눈치', '깊이'],
    shadow: '너무 잘 알아채서 혼자 마음을 앓을 때가 많아요.',
    shines: '아무도 못 본 디테일을 짚어낼 때',
    hue: '#e8695f',
  },
  mu: {
    id: 'mu', hanja: '戊', kor: '무토', icon: '⛰️', name: '큰 산',
    tagline: '흔들려도 자리를 지키는 사람',
    nature:
      '급하게 움직이지 않아요. 대신 한번 맡으면 끝까지 있고, 사람들이 기대 쉬어가는 자리가 돼요. 판단은 느려 보여도 웬만해선 틀리지 않아요.',
    strengths: ['안정감', '포용력', '신뢰'],
    shadow: '움직여야 할 때도 일단 버티는 쪽을 골라요.',
    shines: '모두가 흔들릴 때 혼자 그대로 서 있을 때',
    hue: '#b08d57',
  },
  gi: {
    id: 'gi', hanja: '己', kor: '기토', icon: '🌾', name: '기름진 밭',
    tagline: '남을 자라게 하는 사람',
    nature:
      '드러나기보다 받쳐주는 쪽이 편해요. 챙길 걸 먼저 챙기고, 사람이든 일이든 손이 닿으면 확실히 나아져요. 실속 있는 판단을 해요.',
    strengths: ['살뜰함', '현실감각', '뒷심'],
    shadow: '남 걱정을 먼저 하다 정작 내 것을 미뤄둬요.',
    shines: '누군가 나 때문에 잘됐다는 말을 들을 때',
    hue: '#c9a227',
  },
  gyeong: {
    id: 'gyeong', hanja: '庚', kor: '경금', icon: '⚔️', name: '벼려진 쇠',
    tagline: '끊을 때 끊는 사람',
    nature:
      '애매한 걸 오래 못 견뎌요. 맞다 아니다를 빨리 정하고, 정하면 뒤도 안 봐요. 의리가 있고, 약속한 건 지켜요.',
    strengths: ['결단력', '의리', '추진'],
    shadow: '직진하는 말이 상대에겐 베이는 말이 될 때가 있어요.',
    shines: '아무도 결정 못 할 때 "이걸로 가자" 할 때',
    hue: '#8c9aa8',
  },
  sin: {
    id: 'sin', hanja: '辛', kor: '신금', icon: '💎', name: '보석',
    tagline: '기준이 높은 사람',
    nature:
      '대충이 잘 안 돼요. 눈이 예민해서 남들이 넘기는 차이를 봐요. 그만큼 자기 것에 자부심이 있고, 다듬을수록 빛나요.',
    strengths: ['안목', '섬세함', '자존'],
    shadow: '기준이 높아 스스로를 제일 많이 깎아요.',
    shines: '내가 고른 게 결국 옳았다고 판명될 때',
    hue: '#a9b7c6',
  },
  im: {
    id: 'im', hanja: '壬', kor: '임수', icon: '🌊', name: '큰 물',
    tagline: '넓게 받아들이는 사람',
    nature:
      '경계가 넓어요. 다른 생각도 일단 들어보고, 사람도 가리지 않아요. 머리가 빨리 돌아가서 판이 어떻게 흘러갈지 먼저 읽어요.',
    strengths: ['포용력', '순발력', '통찰'],
    shadow: '관심이 넓어 한 군데 오래 머무는 게 어려워요.',
    shines: '복잡하게 얽힌 걸 한 번에 정리해줄 때',
    hue: '#3182f6',
  },
  gye: {
    id: 'gye', hanja: '癸', kor: '계수', icon: '💧', name: '이슬비',
    tagline: '스며들어 바꾸는 사람',
    nature:
      '큰 소리를 내지 않아요. 그런데 지나간 자리는 달라져 있어요. 감정을 잘 읽고, 말하지 않은 것까지 알아채요.',
    strengths: ['공감력', '직관', '차분함'],
    shadow: '남의 감정까지 다 받아서 혼자 무거워져요.',
    shines: '누군가 "너한테는 말할 수 있어" 할 때',
    hue: '#5b7fd4',
  },
};

/** 천간 인덱스(0=甲) → 일간 정보 */
export const DAY_MASTER_BY_INDEX: DayMasterInfo[] = [
  DAY_MASTERS.gap, DAY_MASTERS.eul, DAY_MASTERS.byeong, DAY_MASTERS.jeong, DAY_MASTERS.mu,
  DAY_MASTERS.gi, DAY_MASTERS.gyeong, DAY_MASTERS.sin, DAY_MASTERS.im, DAY_MASTERS.gye,
];
