import type { IconName } from '../components/Icon.tsx';
// 일간(日干) 10종 — 사주에서 '나' 그 자체.
//
// 명리를 모르는 사람에게 "당신은 壬水입니다" 는 아무 말도 아니다.
// 한때는 이걸 '큰 물', '보석' 같은 상(象)으로 옮겼다. 그런데 비유는 한 번 더
// 풀어야 뜻이 닿는다. '큰 물인 사람' 이 어떤 사람인지 각자 다르게 읽었다.
// 그래서 비유를 걷고 사람을 바로 가리키는 말로 바꿨다 — 넓은 사람, 곧은 사람.
// 읽는 즉시 뜻이 서고, 그대로 남에게 옮겨 말할 수 있다.
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
  icon: IconName;
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
  /** 대표 색 — 배경 틴트·테두리 등 장식용 (TDS 값) */
  hue: string;
  /** 같은 계열의 글자용 색 — 밝은 값을 글자에 쓰면 흰 배경에서 AA 를 못 넘는다.
      실제로 戊(토)의 노랑을 한자에 그대로 썼다가 대비 1.79 가 나왔다. */
  hueText: string;
};

const DAY_MASTERS: Record<DayMasterId, DayMasterInfo> = {
  gap: {
    id: 'gap', hanja: '甲', kor: '갑목', icon: 'tree', name: '곧은 사람',
    tagline: '한 번 정하면 끝까지 가요',
    nature:
      '방향을 정하면 끝까지 밀고 가는 편이에요. 남의 눈치를 보기보다 원칙을 중요하게 여겨 믿음직하다는 말을 듣기도 해요. 다만 한번 정한 생각을 바꾸기까지는 시간이 걸릴 수 있어요.',
    strengths: ['추진력', '책임감', '리더 기질'],
    shadow: '아니다 싶어도 이미 세운 계획이라 끝까지 가버릴 때가 있어요.',
    shines: '아무도 먼저 나서지 않는 자리에서 "그럼 제가 할게요" 할 때',
    hue: '#03b26c',
    hueText: '#027648',
  },
  eul: {
    id: 'eul', hanja: '乙', kor: '을목', icon: 'leaf', name: '유연한 사람',
    tagline: '막히면 다른 길을 찾아요',
    nature:
      '문제가 생기면 다른 방법을 찾아내는 편이에요. 상황이 바뀌어도 잘 적응하고 자기 자리를 찾아요. 유연함이 큰 장점이에요.',
    strengths: ['적응력', '섬세함', '끈기'],
    shadow: '맞추는 게 익숙해서 정작 내가 뭘 원하는지 놓칠 때가 있어요.',
    shines: '다들 방법이 없다고 할 때 새로운 길을 찾아낼 때',
    hue: '#15c47e',
    hueText: '#027648',
  },
  byeong: {
    id: 'byeong', hanja: '丙', kor: '병화', icon: 'sun', name: '밝은 사람',
    tagline: '있는 자리가 환해져요',
    nature:
      '좋고 싫은 마음이 얼굴에 잘 드러나는 편이에요. 솔직한 성격 덕분에 주변 분위기가 밝아지기도 해요.',
    strengths: ['밝음', '솔직함', '분위기 메이커'],
    shadow: '기분이 얼굴에 다 드러나 주변 사람까지 영향을 받을 때가 있어요.',
    shines: '가라앉은 분위기를 밝게 바꿔놓을 때',
    hue: '#f57800',
    hueText: '#e45600',
  },
  jeong: {
    id: 'jeong', hanja: '丁', kor: '정화', icon: 'candle', name: '오래 가는 사람',
    tagline: '티 안 나게 끝까지 해내요',
    nature:
      '조용히 주변을 살피고 필요한 일을 챙기는 편이에요. 표정이나 말투의 변화를 잘 알아채고, 한 가지 일에 깊이 집중해요.',
    strengths: ['집중력', '눈치', '깊이'],
    shadow: '다른 사람의 마음을 너무 신경 써서 혼자 힘들어질 때가 있어요.',
    shines: '아무도 못 본 디테일을 짚어낼 때',
    hue: '#ffa927',
    hueText: '#e45600',
  },
  mu: {
    id: 'mu', hanja: '戊', kor: '무토', icon: 'mountain', name: '단단한 사람',
    tagline: '흔들려도 자리를 지켜요',
    nature:
      '급하게 움직이기보다 맡은 일을 꾸준히 해내는 편이에요. 사람들이 편하게 의지하고, 판단할 때도 충분히 생각해요.',
    strengths: ['안정감', '포용력', '신뢰'],
    shadow: '움직여야 할 때도 일단 버티는 쪽을 골라요.',
    shines: '주변이 흔들려도 차분히 자기 자리를 지킬 때',
    hue: '#ffb331',
    hueText: '#9c5d00',
  },
  gi: {
    id: 'gi', hanja: '己', kor: '기토', icon: 'field', name: '키우는 사람',
    tagline: '곁에 있는 사람이 잘돼요',
    nature:
      '앞에 나서기보다 주변을 챙기는 일이 편해요. 사람이나 일이 잘 굴러가도록 돕고, 필요한 일을 실속 있게 처리하는 편이에요.',
    strengths: ['살뜰함', '현실감각', '뒷심'],
    shadow: '남 걱정을 먼저 하다 정작 내 것을 미뤄둬요.',
    shines: '누군가 나 때문에 잘됐다는 말을 들을 때',
    hue: '#ffb331',
    hueText: '#9c5d00',
  },
  gyeong: {
    id: 'gyeong', hanja: '庚', kor: '경금', icon: 'blade', name: '끊어내는 사람',
    tagline: '아닌 건 빨리 접어요',
    nature:
      '애매한 걸 오래 못 견뎌요. 맞다 아니다를 빨리 정하고, 정하면 뒤도 안 봐요. 의리가 있고, 약속한 건 지켜요.',
    strengths: ['결단력', '의리', '추진'],
    shadow: '솔직하게 한 말이 상대에게 상처가 될 때가 있어요.',
    shines: '아무도 결정 못 할 때 "이걸로 가자" 할 때',
    hue: '#8b95a1',
    hueText: '#4e5968',
  },
  sin: {
    id: 'sin', hanja: '辛', kor: '신금', icon: 'gem', name: '정확한 사람',
    tagline: '대충이 잘 안 돼요',
    nature:
      '사소한 차이를 잘 알아채고 완성도를 중요하게 생각해요. 자기 일에 자부심이 있고, 차근차근 다듬어가는 편이에요.',
    strengths: ['안목', '섬세함', '자존'],
    shadow: '기준이 너무 높아 스스로에게 엄격해질 때가 있어요.',
    shines: '내가 고른 게 결국 맞았다고 드러날 때',
    hue: '#b0b8c1',
    hueText: '#4e5968',
  },
  im: {
    id: 'im', hanja: '壬', kor: '임수', icon: 'wave', name: '넓은 사람',
    tagline: '웬만한 건 다 받아줘요',
    nature:
      '생각이 다른 사람의 말도 잘 들어주는 편이에요. 관심사가 넓고 상황을 빠르게 파악하는 것도 장점이에요.',
    strengths: ['포용력', '순발력', '통찰'],
    shadow: '관심이 넓어 한 군데 오래 머무는 게 어려워요.',
    shines: '복잡하게 얽힌 걸 한 번에 정리해줄 때',
    hue: '#3182f6',
    hueText: '#1b64da',
  },
  gye: {
    id: 'gye', hanja: '癸', kor: '계수', icon: 'drop', name: '스며드는 사람',
    tagline: '조용히 분위기를 바꿔요',
    nature:
      '말수가 적어도 주변을 세심하게 살피는 편이에요. 다른 사람의 감정을 잘 알아채고 말하지 못한 사정까지 헤아리려 해요.',
    strengths: ['공감력', '직관', '차분함'],
    shadow: '다른 사람의 감정까지 떠안아 혼자 지칠 수 있어요.',
    shines: '누군가 "너한테는 편하게 말할 수 있어"라고 할 때',
    hue: '#4593fc',
    hueText: '#1b64da',
  },
};

/** 천간 인덱스(0=甲) → 일간 정보 */
export const DAY_MASTER_BY_INDEX: DayMasterInfo[] = [
  DAY_MASTERS.gap, DAY_MASTERS.eul, DAY_MASTERS.byeong, DAY_MASTERS.jeong, DAY_MASTERS.mu,
  DAY_MASTERS.gi, DAY_MASTERS.gyeong, DAY_MASTERS.sin, DAY_MASTERS.im, DAY_MASTERS.gye,
];
