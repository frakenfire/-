// 사주(四柱) 기반 '오늘의 일진' 로직 — AI 없이 전통 명리 규칙만으로 결정적 동작.
//
// 원리:
//  - 생년월일시가 없어 사주팔자 전체는 못 세우지만, 두 가지는 달력만으로 정확히 계산된다.
//    (1) 오늘의 '일진(日辰)' = 그날의 천간·지지(60갑자). 율리우스적일로 정확히 계산.
//    (2) 내 '띠' = 태어난 해의 지지(地支). 12띠가 곧 12지지다.
//  - 그래서 '오늘 일진의 지지'와 '내 띠(지지)'의 전통 관계(삼합·육합·상충·형·해·비화)와
//    '일간(천간)의 오행'과 '내 띠 오행'의 생극(生剋) 관계를 계산해, 사주식 '오늘의 기운'을 낸다.
//  - 모든 값은 (날짜, 띠)의 순수 함수 하루 동안 고정, 같은 조건이면 항상 같은 결과.
//
// 정확도: 일진 계산은 (JDN + 49) % 60, 甲子=0 (표준 만세력과 일치. 1970-01-01=辛巳, 2000-01-01=戊午 검증).
// 주의: 오락용이며 절기 기준 월주/시주는 다루지 않는다(일진·띠 관계에 집중).

import { GRADE } from './gradeWords.ts';
import type { ZodiacId } from '../data/zodiac.ts';

// 결정적 해시/선택 — dateSeed 와 동일한 FNV-1a 방식을 내장(이 모듈을 순수 leaf 로
// 유지해 노드 테스트 러너에서 바로 검증 가능하게 함).
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pickOne<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export const ELEMENT_KO: Record<Element, string> = {
  wood: '나무',
  fire: '불',
  earth: '흙',
  metal: '쇠',
  water: '물',
};
// 오행별 개운(開運) 컬러 — 전통 오방색을 토스 팔레트로 톤다운한 색들.
// 목=청록 계열, 화=적·분홍 계열, 토=황·베이지 계열, 금=백·회 계열, 수=흑·청 계열.
export const ELEMENT_COLORS: Record<Element, { name: string; hex: string }[]> = {
  wood: [
    { name: '초록색', hex: '#20b573' },
    { name: '민트색', hex: '#2bb9a6' },
  ],
  fire: [
    { name: '분홍색', hex: '#efa2ba' },
    { name: '살구색', hex: '#f0a986' },
  ],
  earth: [
    { name: '노란색', hex: '#f5c344' },
    { name: '베이지색', hex: '#cdb89a' },
  ],
  metal: [
    { name: '흰색', hex: '#eceff2' },
    { name: '연회색', hex: '#c2c8cf' },
  ],
  water: [
    { name: '파란색', hex: '#3182f6' },
    { name: '남색', hex: '#3f5bbf' },
  ],
};

// 천간 10 — 한자 / 한글 / 오행 / 음양
export const STEMS: { hanja: string; kor: string; el: Element }[] = [
  { hanja: '甲', kor: '갑', el: 'wood' },
  { hanja: '乙', kor: '을', el: 'wood' },
  { hanja: '丙', kor: '병', el: 'fire' },
  { hanja: '丁', kor: '정', el: 'fire' },
  { hanja: '戊', kor: '무', el: 'earth' },
  { hanja: '己', kor: '기', el: 'earth' },
  { hanja: '庚', kor: '경', el: 'metal' },
  { hanja: '辛', kor: '신', el: 'metal' },
  { hanja: '壬', kor: '임', el: 'water' },
  { hanja: '癸', kor: '계', el: 'water' },
];

// 지지 12 — 한자 / 한글 / 띠 / 오행. 배열 순서 = 子丑寅卯辰巳午未申酉戌亥 = 띠 순서.
export const BRANCHES: { hanja: string; kor: string; animal: ZodiacId; el: Element }[] = [
  { hanja: '子', kor: '자', animal: 'rat', el: 'water' },
  { hanja: '丑', kor: '축', animal: 'ox', el: 'earth' },
  { hanja: '寅', kor: '인', animal: 'tiger', el: 'wood' },
  { hanja: '卯', kor: '묘', animal: 'rabbit', el: 'wood' },
  { hanja: '辰', kor: '진', animal: 'dragon', el: 'earth' },
  { hanja: '巳', kor: '사', animal: 'snake', el: 'fire' },
  { hanja: '午', kor: '오', animal: 'horse', el: 'fire' },
  { hanja: '未', kor: '미', animal: 'sheep', el: 'earth' },
  { hanja: '申', kor: '신', animal: 'monkey', el: 'metal' },
  { hanja: '酉', kor: '유', animal: 'rooster', el: 'metal' },
  { hanja: '戌', kor: '술', animal: 'dog', el: 'earth' },
  { hanja: '亥', kor: '해', animal: 'pig', el: 'water' },
];

const BRANCH_OF_ANIMAL: Record<ZodiacId, number> = BRANCHES.reduce(
  (acc, b, i) => {
    acc[b.animal] = i;
    return acc;
  },
  {} as Record<ZodiacId, number>,
);

// 율리우스적일(Fliegel–Van Flandern, 그레고리력) — 정확한 정수 일련번호.
export function toJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

// dateKey 'YYYY-MM-DD'  60갑자 인덱스(0=甲子)
export function ganzhiIndexFromDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const jdn = toJDN(y, m, d);
  return (((jdn + 49) % 60) + 60) % 60;
}

//  지지 관계(전통) 
// 삼합(三合): 지지 인덱스가 mod 4로 같음 (申子辰=0·4·8 등)  최고의 조화
// 육합/상충/형·해는 쌍으로 정의
const UNION = new Set(['0-1', '2-11', '3-10', '4-9', '5-8', '6-7']); // 육합
const HARM = new Set(['0-7', '1-6', '2-9', '3-8', '4-11', '5-10']); // 원진/해
// 형(刑) — 삼형 寅巳申(2·5·8)·丑戌未(1·10·7), 상형 子卯(0·3).
// (寅申·丑未는 충, 巳申은 육합이 우선 적용되어 아래 우선순위에서 흡수된다)
const PUNISH = new Set(['2-5', '5-8', '2-8', '1-10', '7-10', '1-7', '0-3']);
// 자형(自刑) — 같은 지지끼리 만나면 형이 되는 넷: 辰(4)·午(6)·酉(9)·亥(11)
const SELF_PUNISH = new Set([4, 6, 9, 11]);
// 파(破) — 육파 子酉·丑辰·寅亥·卯午·巳申·戌未. 셋(寅亥·巳申·戌未)은 합/형이 우선.
const BREAK = new Set(['0-9', '1-4', '2-11', '3-6', '5-8', '7-10']);
function keyOf(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export type BranchRelation =
  | 'self'
  | 'selfPunish'
  | 'trine'
  | 'union'
  | 'clash'
  | 'punish'
  | 'harm'
  | 'break'
  | 'none';

// 지지 관계 판정 — 한 쌍이 여러 관계에 동시에 걸릴 수 있어(예: 寅申은 충이자 삼형,
// 巳申은 육합이자 형) 우선순위를 명시한다. 충 > 합 > 형 > 원진 > 파 순으로,
// 작용력이 큰 관계가 이긴다.
export function branchRelation(a: number, b: number): BranchRelation {
  if (a === b) return SELF_PUNISH.has(a) ? 'selfPunish' : 'self'; // 자형 / 비화(比和)
  if (Math.abs(a - b) === 6) return 'clash'; // 상충(정반대)
  if (a % 4 === b % 4) return 'trine'; // 삼합
  if (UNION.has(keyOf(a, b))) return 'union'; // 육합
  if (PUNISH.has(keyOf(a, b))) return 'punish'; // 형
  if (HARM.has(keyOf(a, b))) return 'harm'; // 원진
  if (BREAK.has(keyOf(a, b))) return 'break'; // 파
  return 'none';
}

// 두 띠의 지지 관계 — 궁합 등에서 재사용하는 단일 출처(single source of truth).
export function zodiacRelation(a: ZodiacId, b: ZodiacId): BranchRelation {
  return branchRelation(BRANCH_OF_ANIMAL[a], BRANCH_OF_ANIMAL[b]);
}

// 띠의 오행
export function elementOfZodiac(id: ZodiacId): Element {
  return BRANCHES[BRANCH_OF_ANIMAL[id]].el;
}

//  오행 생극(生剋) 
// 상생: 목화토금수목 / 상극: 목토수화금목
const GEN_NEXT: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};
const CTRL_NEXT: Record<Element, Element> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

// 나를 생(生)해주는 오행 — 명리의 인성(印星). 기운을 보충해주는 '개운 오행'으로 쓴다.
// (수생목, 목생화, 화생토, 토생금, 금생수의 역방향)
const GEN_PREV: Record<Element, Element> = {
  wood: 'water',
  fire: 'wood',
  earth: 'fire',
  metal: 'earth',
  water: 'metal',
};

export type ElementFlow =
  | 'day_generates_me' // 일간이 나를 생 — 도움받는 기운
  | 'i_generate_day' // 내가 일간을 생 — 베푸는(소모) 기운
  | 'day_controls_me' // 일간이 나를 극 — 눌리는/조심
  | 'i_control_day' // 내가 일간을 극 — 주도하는 기운
  | 'same'; // 비화 — 안정/친화

export function elementFlow(dayEl: Element, myEl: Element): ElementFlow {
  if (dayEl === myEl) return 'same';
  if (GEN_NEXT[dayEl] === myEl) return 'day_generates_me';
  if (GEN_NEXT[myEl] === dayEl) return 'i_generate_day';
  if (CTRL_NEXT[dayEl] === myEl) return 'day_controls_me';
  if (CTRL_NEXT[myEl] === dayEl) return 'i_control_day';
  return 'same';
}

// 두 오행의 상성(궁합용, 대칭) — 상생 / 상극 / 비화. 5행은 서로 항상 이 셋 중 하나.
export type PairElementFlow = 'generate' | 'control' | 'same';
export const PAIR_FLOW_KO: Record<PairElementFlow, string> = {
  generate: '서로 돕는 사이',
  control: '서로 자극하는 사이',
  same: '비슷한 사이',
};
export function pairElementFlow(a: ZodiacId, b: ZodiacId): PairElementFlow {
  const ea = elementOfZodiac(a);
  const eb = elementOfZodiac(b);
  if (ea === eb) return 'same';
  if (GEN_NEXT[ea] === eb || GEN_NEXT[eb] === ea) return 'generate';
  return 'control';
}

export type SajuTone = 'great' | 'good' | 'steady' | 'caution';

// 지지 관계 + 오행 생극 종합 톤 점수(0~4). 관계가 주(主), 오행이 보조.
function toneScore(rel: BranchRelation, flow: ElementFlow): number {
  let s = 2;
  if (rel === 'trine') s += 2;
  else if (rel === 'union') s += 1.5;
  else if (rel === 'self') s += 0.5;
  else if (rel === 'clash') s -= 1.5;
  else if (rel === 'punish') s -= 1.2; // 형 — 충 다음으로 껄끄러운 관계
  else if (rel === 'harm') s -= 1;
  else if (rel === 'break') s -= 0.5; // 파 — 작용력이 약한 관계
  else if (rel === 'selfPunish') s -= 0.2; // 자형 — 같은 지지지만 스스로 부딪힘
  if (flow === 'day_generates_me') s += 1;
  else if (flow === 'i_control_day') s += 0.5;
  else if (flow === 'same') s += 0.3;
  else if (flow === 'day_controls_me') s -= 1;
  else if (flow === 'i_generate_day') s -= 0.3;
  return s;
}

// 톤 경계값 — 12띠 × 60일(전체 상태공간 720조합)의 실제 점수 분포를 뽑아
// 분위수 기준으로 맞췄다. 관계의 상대 서열(삼합 > 육합 > 평운 > 원진 > 형 > 충)은
// 그대로 두고 '어디부터 조심이라 부를지'만 조정한 것.
// 예전 값(4.0/2.8/1.8)은 조심이 39%라 열흘 중 나흘이 경고였는데,
// 이제 great 19% / good 35% / steady 34% / caution 12% 로 균형이 잡힌다.
function toneOf(score: number): SajuTone {
  if (score >= 3.5) return 'great';
  if (score >= 2.3) return 'good';
  if (score >= 1.0) return 'steady';
  return 'caution';
}

// 전통 용어에 붙이는 쉬운 말 — '비화·자형·원진' 같은 말은 일반 유저가 모른다.
// 용어는 사주앱다움을 위해 유지하되, 항상 괄호로 뜻을 병기해 "이게 뭐지?"를 없앤다.
// 전통 용어에 붙이는 쉬운 말은 두 벌이 필요하다. 한 벌로 쓰던 때는 이번 주
// 표에 '짝꿍 사이' 가 뜨고(화요일은 사이가 아니라 날이다) 띠 순위에 '부딪히는
// 날' 이 떴다(범띠는 날이 아니라 상대다). 읽는 자리가 다르면 말도 달라야 한다.
//
// 그리고 '고집 겹침'·'살짝 긴장'·'밀당 기류'·'엇박 주의' 는 동사가 없어서
// 무슨 일이 생기는지가 안 적혀 있었다. 무엇이 어떻게 되는지로 고쳐 쓴다.
// '찰떡 사이'·'짝꿍 사이' 는 그냥 둔다 - 누구나 쓰는 말이고 장면이 그려진다.

/** 이번 주 표·오늘 한 줄 — 하루를 가리킨다 */
export const REL_GLOSS: Record<BranchRelation, string> = {
  self: '고집 겹치는 날',
  selfPunish: '고집 세지는 날',
  trine: '잘 맞는 날',
  union: '손발 맞는 날',
  clash: '부딪히는 날',
  punish: '조심할 날',
  harm: '오해 사기 쉬운 날',
  break: '엇갈리는 날',
  none: '무난한 날',
};

/** 띠 순위 — 오늘 그 띠와 나 사이를 가리킨다 */
export const REL_PAIR_GLOSS: Record<BranchRelation, string> = {
  self: '비슷한 사이',
  selfPunish: '고집 센 사이',
  trine: '찰떡 사이',
  union: '짝꿍 사이',
  clash: '안 맞는 사이',
  punish: '조심할 사이',
  harm: '오해하기 쉬운 사이',
  break: '엇갈린 사이',
  none: '무난한 사이',
};

export const REL_KO: Record<BranchRelation, string> = {
  self: '비화',
  selfPunish: '자형',
  trine: '삼합',
  union: '육합',
  clash: '상충',
  punish: '상형',
  harm: '원진',
  break: '상파',
  none: '평운',
};

// 등급 말은 gradeWords.ts 의 사다리에서만 가져온다. 여기서 새로 짓지 않는다.
const TONE_WORD: Record<SajuTone, string> = {
  great: GRADE.best,
  good: GRADE.good,
  steady: GRADE.plain,
  caution: GRADE.care,
};

// 히어로 큰 제목용 짧은 문구 — 톤별 풀에서 seed로 골라 같은 톤이라도 날마다 변주
export const TONE_TITLE: Record<SajuTone, string[]> = {
  great: [
    '오늘은 미뤄둔 일을 시작하세요',
    '오늘 시작한 일은 끝까지 가요',
    '오늘은 먼저 말을 꺼내면 통해요',
    '오늘 내민 제안은 받아들여져요',
    '오늘 보낸 연락에는 답이 빨리 와요',
    '오늘은 손대는 일마다 풀려요',
  ],
  good: [
    '오늘은 하던 일이 막힘없이 이어져요',
    '오늘은 부탁하면 들어줘요',
    '오늘은 손발이 맞는 하루예요',
    '오늘은 한 만큼 결과가 나와요',
    '오늘은 연락에 답이 바로 와요',
    '오늘은 계획한 일이 예정대로 끝나요',
  ],
  steady: [
    '오늘은 벌이지 말고 끝내는 날이에요',
    '오늘은 밀린 일 하나를 끝내세요',
    '오늘은 정리하는 쪽이 이득이에요',
    '오늘은 돈 쓸 일을 내일로 넘기세요',
    '오늘은 저녁 일정을 비워두세요',
    '오늘은 새로 시작하면 손해예요',
  ],
  caution: [
    '오늘은 할 일을 세 개로 줄이세요',
    '오늘은 말이 세게 나가는 날이에요',
    '오늘은 서명할 일을 내일로 미루세요',
    '오늘은 답장을 한 시간 뒤에 보내세요',
    '오늘은 약속에 10분 일찍 나가세요',
    '오늘은 돈 얘기를 꺼내지 마세요',
  ],
};

// 톤별 오늘의 사주 한 줄 — 날짜·띠 seed로 변주(같은 날/같은 띠는 고정)
const HEADLINE: Record<SajuTone, string[]> = {
  great: [
    '오늘 날짜와 내 띠가 잘 맞아요. 한 달 넘게 미뤄둔 일 하나를 오전에 시작하세요.',
    '오늘은 손에 잡은 일이 막히지 않아요. 계획만 세워둔 일을 오늘 첫 단계까지 해두세요.',
    '오늘은 도와달라는 말에 사람들이 바로 응해요. 혼자 붙들던 일을 한 명에게 부탁하세요.',
    '오늘 시작한 일은 이번 주 안에 결과가 보여요. 오후 3시 전에 첫 연락을 넣으세요.',
    '막혀 있던 일에서 오늘 해결할 방법이 나와요. 미뤄둔 일 하나를 오늘 한 단계 끝내세요.',
    '오늘은 먼저 연락한 쪽이 원하는 답을 받아요. 망설이던 메시지는 점심 전에 보내세요.',
  ],
  good: [
    '오늘 날짜와 내 띠가 잘 어울려요. 진행 중인 일 하나를 오늘 한 단계 더 밀어두세요.',
    '오늘은 일정이 어긋나지 않아요. 이번 주 할 일 하나를 오늘로 당겨서 끝내세요.',
    '오늘은 누구와 해도 말이 잘 통해요. 혼자 붙들던 일 하나를 가족이나 친구에게 나눠 맡기세요.',
    '이틀 넘게 답 안 한 메시지가 있으면 오전에 답하세요. 오늘은 그 답장에서 일이 이어져요.',
    '오늘은 들인 시간이 그대로 결과가 돼요. 두 시간짜리 일 하나를 정해서 오늘 끝내세요.',
    '오늘은 미뤄둔 만남을 잡기 좋아요. 한 달 넘게 못 본 사람에게 이번 주 날짜 두 개를 보내세요.',
  ],
  steady: [
    '오늘 시작한 일은 이번 주 안에 결과가 안 나와요. 이미 손댄 일 하나를 골라 오늘 마무리하세요.',
    '오늘은 기다리던 소식이 안 와요. 답을 기다리는 일이 있으면 내일 오전에 다시 확인하세요.',
    '오늘은 손에 익은 일에서 실수가 안 나요. 익숙한 일 세 개를 오전에 몰아서 끝내세요.',
    '오늘은 들어오는 돈도 나가는 돈도 계획대로예요. 카드 앱을 열어 이번 주 결제 내역만 훑어보세요.',
    '오늘은 나한테 쓰는 시간이 아깝지 않은 날이에요. 저녁 한 시간을 잠, 운동, 방 정리 중 하나에 쓰세요.',
    '오늘은 갑자기 잡히는 약속을 거절해도 손해가 없어요. 오늘 할 일 목록은 다섯 개 안으로 줄이세요.',
  ],
  caution: [
    '오늘 날짜와 내 띠가 부딪혀요. 오늘 정하려던 일은 하루 미루고 내일 오전에 정하세요.',
    '오늘은 별것 아닌 말에 신경이 곤두서요. 언성이 올라가면 그 자리에서 5분 나갔다 오세요.',
    '오늘은 돈 계산에서 실수가 나와요. 송금 전에 계좌번호와 금액을 두 번 확인하세요.',
    '오늘은 시간 약속 하나가 틀어져요. 일정 사이에 30분씩 빈칸을 두세요.',
    '오늘은 같은 말을 서로 다르게 알아들어요. 시간과 장소는 메시지로 한 번 더 적어 보내세요.',
    '오늘은 일을 늘리면 실수가 따라와요. 새 부탁은 내일 답하고 쌓인 일부터 정리하세요.',
  ],
};

export const TIP: Record<SajuTone, string[]> = {
  great: [
    '오늘 점심 전에 하고 싶던 제안 하나를 먼저 보내세요.',
    '미뤄둔 신청이나 예약 하나를 오늘 끝내세요.',
    '한 달 넘게 미룬 일을 오늘 30분만 손대세요.',
    '해볼까 싶던 일은 오늘 첫 단계까지만 해두세요.',
    '오늘 모임이나 단톡방에서 내 의견을 먼저 말하세요.',
  ],
  good: [
    '어제 하다 만 일을 오늘 오전에 이어서 끝내세요.',
    '오늘 만나는 사람에게서 반가운 소식을 하나 들어요.',
    '미뤄둔 부탁 하나를 오늘 저녁 전에 꺼내세요.',
    '오늘 한 약속은 시간까지 정해서 메시지로 남기세요.',
    '오늘 들어온 연락에는 한 시간 안에 답하세요.',
  ],
  steady: [
    '이번 주에 끝내기로 한 일 하나를 오늘 끝내세요.',
    '오늘은 밤 11시 전에 휴대폰을 내려놓으세요.',
    '아침에 할 일 세 개만 적고 그 셋만 하세요.',
    '10만 원 넘는 결제는 오늘 말고 사흘 뒤에 다시 보세요.',
    '일주일 넘게 연락 안 한 사람 한 명에게 안부를 보내세요.',
  ],
  caution: [
    '오늘 꼭 답해야 하는 일이 아니면 답은 내일 하세요.',
    '오늘 대화에서는 내 말을 하기 전에 끝까지 들으세요.',
    '오늘은 10만 원 넘는 결제와 계약서 서명을 내일로 넘기세요.',
    '목소리가 커지면 대화를 멈추고 10분 뒤에 다시 얘기하세요.',
    '오늘 약속은 하나만 잡고 나머지는 다음 주로 옮기세요.',
  ],
};

export type SajuToday = {
  iljin: { hanja: string; kor: string; stemEl: Element; branchEl: Element };
  relation: BranchRelation;
  relationKo: string;
  /** 쉬운 말 병기 — '비화' 만 보면 모르는 유저를 위해 항상 함께 노출 */
  relationGloss: string;
  flow: ElementFlow;
  tone: SajuTone;
  toneWord: string;
  title: string;
  myElement: Element;
  /** 개운 오행 — 내 오행을 생해주는 오행(인성). 오늘 기운을 보충하는 방향 */
  boostElement: Element;
  /** 개운 컬러 — 개운 오행의 오방색에서 seed로 선택. 행운 색의 사주 근거가 된다 */
  luckyColor: { name: string; hex: string };
  headline: string;
  tip: string;
};

//  오늘의 12띠 서열 
// 그날의 일진(지지 관계 + 오행 생극)으로 12띠 전체 점수를 매겨 순위를 낸다.
// 동점은 날짜·띠 seed 로 결정적 타이브레이크 하루 동안 고정, 매일 갈림.
// 단톡방에 던지는 '오늘 띠 서열표'의 데이터 소스.

export type ZodiacRank = {
  animal: ZodiacId;
  rank: number; // 1~12
  relation: BranchRelation;
  relationKo: string;
  relationGloss: string;
  tone: SajuTone;
  toneWord: string;
};

export function dailyZodiacRanking(dateKey: string): ZodiacRank[] {
  const idx = ganzhiIndexFromDateKey(dateKey);
  const stem = STEMS[idx % 10];
  const dayBranchIdx = idx % 12;

  const scored = BRANCHES.map((b, i) => {
    const rel = branchRelation(dayBranchIdx, i);
    const flow = elementFlow(stem.el, b.el);
    const score = toneScore(rel, flow);
    return {
      animal: b.animal,
      relation: rel,
      tone: toneOf(score),
      score,
      tiebreak: hashSeed(`rank|${dateKey}|${b.animal}`),
    };
  });

  scored.sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak);

  return scored.map((s, i) => ({
    animal: s.animal,
    rank: i + 1,
    relation: s.relation,
    relationKo: REL_KO[s.relation],
    relationGloss: REL_PAIR_GLOSS[s.relation],
    tone: s.tone,
    toneWord: TONE_WORD[s.tone],
  }));
}

// 오늘의 일진만 (띠 없이도 표시 가능)
export function iljinOf(dateKey: string): {
  hanja: string;
  kor: string;
  stemEl: Element;
  branchEl: Element;
} {
  const idx = ganzhiIndexFromDateKey(dateKey);
  const s = STEMS[idx % 10];
  const b = BRANCHES[idx % 12];
  return { hanja: s.hanja + b.hanja, kor: s.kor + b.kor, stemEl: s.el, branchEl: b.el };
}

// 오늘의 사주 — 내 띠 기준 종합
export function sajuToday(dateKey: string, zodiacId: ZodiacId): SajuToday {
  const idx = ganzhiIndexFromDateKey(dateKey);
  const stem = STEMS[idx % 10];
  const dayBranchIdx = idx % 12;
  const myBranchIdx = BRANCH_OF_ANIMAL[zodiacId];
  const myEl = BRANCHES[myBranchIdx].el;

  const relation = branchRelation(dayBranchIdx, myBranchIdx);
  const flow = elementFlow(stem.el, myEl);
  const tone = toneOf(toneScore(relation, flow));

  const seed = hashSeed(`saju|${dateKey}|${zodiacId}`);
  const title = pickOne(TONE_TITLE[tone], seed >>> 5);
  const headline = pickOne(HEADLINE[tone], seed);
  const tip = pickOne(TIP[tone], seed >>> 3);
  const boostElement = GEN_PREV[myEl];
  const luckyColor = pickOne(ELEMENT_COLORS[boostElement], seed >>> 7);

  return {
    iljin: iljinOf(dateKey),
    relation,
    relationKo: REL_KO[relation],
    relationGloss: REL_GLOSS[relation],
    flow,
    tone,
    toneWord: TONE_WORD[tone],
    title,
    myElement: myEl,
    boostElement,
    luckyColor,
    headline,
    tip,
  };
}
