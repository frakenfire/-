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
    tagline: '한번 정하면 끝까지 가요',
    nature:
      '한번 방향을 정하면 곧게 밀고 올라가요. 눈치보다 원칙이 먼저고, 그래서 믿음직하다는 말을 자주 들어요. 대신 한번 정한 길을 바꾸는 건 남들보다 오래 걸려요.',
    strengths: ['추진력', '책임감', '리더 기질'],
    shadow: '아니다 싶어도 이미 세운 계획이라 끝까지 가버릴 때가 있어요.',
    shines: '아무도 먼저 나서지 않는 상황에서 "그럼 제가 할게요" 하고 나설 때',
    hue: '#03b26c',
    hueText: '#027648',
  },
  eul: {
    id: 'eul', hanja: '乙', kor: '을목', icon: 'leaf', name: '유연한 사람',
    tagline: '막히면 다른 길을 찾아요',
    nature:
      '정면으로 부딪히기보다 다른 방법을 잘 찾아요. 상황이 바뀌어도 금방 적응하고, 낯선 환경에서도 금세 익숙해져요. 유연해 보여도 쉽게 포기하지 않는 편이에요.',
    strengths: ['적응력', '섬세함', '끈기'],
    shadow: '맞추는 게 익숙해서 정작 내가 뭘 원하는지 놓칠 때가 있어요.',
    shines: '아무도 답이 없다고 할 때 옆길을 찾아낼 때',
    hue: '#15c47e',
    hueText: '#027648',
  },
  byeong: {
    id: 'byeong', hanja: '丙', kor: '병화', icon: 'sun', name: '밝은 사람',
    tagline: '함께 있으면 분위기가 밝아져요',
    nature:
      '감정을 숨기는 게 서툰 편이에요. 좋으면 좋다고, 아니면 아니라고 얼굴에 드러나요. 그 솔직함 덕분에 함께 있는 사람도 편하게 느낄 수 있어요.',
    strengths: ['밝음', '솔직함', '분위기 메이커'],
    shadow: '기분이 그대로 새어나가서 주변이 같이 출렁일 때가 있어요.',
    shines: '조용하거나 어색한 자리에서 먼저 말을 걸어 분위기를 풀 때',
    hue: '#f57800',
    hueText: '#e45600',
  },
  jeong: {
    id: 'jeong', hanja: '丁', kor: '정화', icon: 'candle', name: '오래 가는 사람',
    tagline: '티 안 나게 끝까지 해내요',
    nature:
      '크게 나서지는 않지만 필요한 일을 정확히 챙겨요. 사람의 표정 변화나 말끝을 잘 알아채고, 한 가지를 깊게 파고드는 힘이 있어요.',
    strengths: ['집중력', '눈치', '깊이'],
    shadow: '너무 잘 알아채서 혼자 마음을 앓을 때가 많아요.',
    shines: '아무도 못 본 디테일을 짚어낼 때',
    hue: '#ffa927',
    hueText: '#e45600',
  },
  mu: {
    id: 'mu', hanja: '戊', kor: '무토', icon: 'mountain', name: '단단한 사람',
    tagline: '쉽게 흔들리지 않고 맡은 일을 지켜요',
    nature:
      '급하게 움직이지 않아요. 대신 한번 맡으면 끝까지 책임지고, 주변 사람에게 안정감을 줘요. 판단은 느려 보여도 충분히 생각한 뒤 정하는 편이에요.',
    strengths: ['안정감', '포용력', '신뢰'],
    shadow: '바꿔야 할 때도 익숙한 상태를 계속 유지하려는 편이에요.',
    shines: '모두가 흔들릴 때 혼자 그대로 서 있을 때',
    hue: '#ffb331',
    hueText: '#9c5d00',
  },
  gi: {
    id: 'gi', hanja: '己', kor: '기토', icon: 'field', name: '키우는 사람',
    tagline: '곁에 있는 사람이 잘돼요',
    nature:
      '앞에 나서기보다 필요한 일을 챙겨주는 역할이 편해요. 사람이나 일을 세심하게 돌보고, 실제 도움이 되는 판단을 하는 편이에요.',
    strengths: ['살뜰함', '현실 감각', '뒷심'],
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
    shadow: '직진하는 말이 상대에겐 베이는 말이 될 때가 있어요.',
    shines: '아무도 결정 못 할 때 "이걸로 가자" 할 때',
    hue: '#8b95a1',
    hueText: '#4e5968',
  },
  sin: {
    id: 'sin', hanja: '辛', kor: '신금', icon: 'gem', name: '정확한 사람',
    tagline: '대충이 잘 안 돼요',
    nature:
      '대충이 잘 안 돼요. 눈이 예민해서 남들이 넘기는 차이를 봐요. 그만큼 자기 것에 자부심이 있고, 다듬을수록 빛나요.',
    strengths: ['안목', '섬세함', '자존'],
    shadow: '기준이 높아 스스로를 지나치게 낮게 평가하기 쉬워요.',
    shines: '내가 고른 게 결국 맞았다고 드러날 때',
    hue: '#b0b8c1',
    hueText: '#4e5968',
  },
  im: {
    id: 'im', hanja: '壬', kor: '임수', icon: 'wave', name: '넓은 사람',
    tagline: '웬만한 건 다 받아줘요',
    nature:
      '다른 생각도 일단 들어보고 다양한 사람과 잘 어울려요. 판단이 빨라서 상황이 어떻게 바뀔지 먼저 살피는 편이에요.',
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
      '크게 나서지는 않아요. 대신 맡은 일을 조용히 정리해놓는 편이에요. 사람의 감정을 잘 읽고, 말하지 않은 부분도 잘 알아채요.',
    strengths: ['공감력', '직관', '차분함'],
    shadow: '남의 감정까지 내 일처럼 받아들여 혼자 지치기 쉬워요.',
    shines: '누군가 "너한테는 말할 수 있어" 할 때',
    hue: '#4593fc',
    hueText: '#1b64da',
  },
};

/** 천간 인덱스(0=甲) → 일간 정보 */
export const DAY_MASTER_BY_INDEX: DayMasterInfo[] = [
  DAY_MASTERS.gap, DAY_MASTERS.eul, DAY_MASTERS.byeong, DAY_MASTERS.jeong, DAY_MASTERS.mu,
  DAY_MASTERS.gi, DAY_MASTERS.gyeong, DAY_MASTERS.sin, DAY_MASTERS.im, DAY_MASTERS.gye,
];
