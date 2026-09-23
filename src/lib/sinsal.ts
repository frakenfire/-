import type { FourPillars } from './fourPillars.ts';

// 계산으로 확정되는 명리 요소들.
//
// 이 파일은 해석을 고르지 않는다. 표에 적힌 대로 대조만 한다. 용신이나 격국처럼
// 학파마다 결론이 갈리는 것은 여기 없다. 여덟 글자와 오늘 글자를 맞대면 누가
// 계산해도 같은 답이 나오는 것들만 담는다.
//
//   십이운성  천간이 지지를 만났을 때의 단계. 양간은 순행, 음간은 역행
//   지지 관계  충 합 삼합 형 파 해. 오늘 글자와 내 글자 사이에서 매일 달라진다
//   신살       천을귀인 문창 도화 역마 화개. 일간이나 삼합 기준 조견표
//   공망       일주가 속한 순(旬)에서 비는 두 글자
//
// 지지 번호는 0=자 ... 11=해, 천간은 0=갑 ... 9=계.

// ── 십이운성 ─────────────────────────────────────────────────────────────
export const UNSEONG = [
  '장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양',
] as const;
export type Unseong = (typeof UNSEONG)[number];

/** 천간별 장생 자리. 양간(갑병무경임)은 순행, 음간(을정기신계)은 역행한다. */
const JANGSAENG: number[] = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

export function unseongOf(stem: number, branch: number): Unseong {
  const start = JANGSAENG[stem];
  const forward = stem % 2 === 0;
  const step = forward ? (branch - start + 12) % 12 : (start - branch + 12) % 12;
  return UNSEONG[step];
}

/** 화면에 쓸 한 줄. 명리 용어를 그대로 두지 않는다. */
export const UNSEONG_KO: Record<Unseong, { word: string; line: string }> = {
  장생: { word: '싹트는 자리', line: '새로 시작하는 힘이 붙는 자리예요. 크지 않아도 출발이 순해요.' },
  목욕: { word: '흔들리는 자리', line: '설익은 힘이라 기복이 있어요. 마음이 자주 바뀌는 자리예요.' },
  관대: { word: '갖춰지는 자리', line: '모양이 잡히는 자리예요. 의욕이 앞서 실수도 같이 와요.' },
  건록: { word: '맡은 일을 해내는 자리', line: '스스로 버티는 힘이 제일 안정적인 자리예요.' },
  제왕: { word: '한창때', line: '힘이 꼭대기에 있는 자리예요. 밀어붙이면 통하지만 꺾이면 크게 꺾여요.' },
  쇠: { word: '한풀 꺾인 자리', line: '기세가 한 번 지나간 자리예요. 넓히기보다 지키는 쪽이 맞아요.' },
  병: { word: '힘이 도는 자리', line: '겉보다 속이 먼저 지치는 자리예요. 무리하면 바로 표시가 나요.' },
  사: { word: '멈추는 자리', line: '움직임보다 생각이 많아지는 자리예요. 결정은 미루는 편이 나아요.' },
  묘: { word: '갈무리하는 자리', line: '거두고 정리하는 자리예요. 새로 벌이면 흩어져요.' },
  절: { word: '끊기는 자리', line: '이어오던 것이 한 번 끊기는 자리예요. 바꾸기에는 오히려 좋아요.' },
  태: { word: '움트는 자리', line: '아직 안 보이지만 씨가 앉는 자리예요. 준비하는 때예요.' },
  양: { word: '기르는 자리', line: '받아서 키우는 자리예요. 혼자보다 배우고 기대는 쪽이 빨라요.' },
};

// ── 지지 관계 ────────────────────────────────────────────────────────────
export type BranchRelation = '충' | '합' | '삼합' | '형' | '파' | '해';

const YUKHAP: [number, number][] = [
  [0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7],
];
const SAMHAP: number[][] = [
  [8, 0, 4], // 신자진 물
  [11, 3, 7], // 해묘미 나무
  [2, 6, 10], // 인오술 불
  [5, 9, 1], // 사유축 쇠
];
// 삼형(인사신 · 축술미)을 두 글자만으로 잡는다 — RULESET.hyeongScope === 'pair'.
// 둘만 있는 것을 육형(상형)이라 부르며 형으로 보는 게 통설이다. 대신 작용력이
// 많이 줄어드니 문장도 세게 쓰지 않는다. 자세한 근거는 sajuRuleset.ts 에.
const HYEONG: [number, number][] = [
  [2, 5], [5, 8], [8, 2], // 인사신
  [1, 10], [10, 7], [7, 1], // 축술미
  [0, 3], [3, 0], // 자묘 — 이건 둘만으로 성립하는 상형이라 관법이 안 갈린다
];
const JAHYEONG = [4, 6, 9, 11]; // 진 오 유 해는 같은 글자끼리 형
const PA: [number, number][] = [
  [0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10],
];
const HAE: [number, number][] = [
  [0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10],
];

function has(pairs: [number, number][], a: number, b: number): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** 두 지지 사이의 관계를 전부 찾는다. 하나도 없으면 빈 배열. */
export function branchRelations(a: number, b: number): BranchRelation[] {
  const out: BranchRelation[] = [];
  if ((a - b + 12) % 12 === 6) out.push('충');
  if (has(YUKHAP, a, b)) out.push('합');
  if (SAMHAP.some((g) => g.includes(a) && g.includes(b) && a !== b)) out.push('삼합');
  if (has(HYEONG, a, b) || (a === b && JAHYEONG.includes(a))) out.push('형');
  if (has(PA, a, b)) out.push('파');
  if (has(HAE, a, b)) out.push('해');
  return out;
}

export const RELATION_KO: Record<BranchRelation, { word: string; line: string }> = {
  충: { word: '부딪혀요', line: '자리를 흔드는 관계예요. 움직임이 생기지만 그만큼 깨지기도 해요.' },
  합: { word: '묶여요', line: '붙잡아 두는 관계예요. 안정되는 대신 속도가 느려져요.' },
  삼합: { word: '뭉쳐요', line: '힘이 한 방향으로 모이는 관계예요. 일이 커지기 좋아요.' },
  형: { word: '어긋나요', line: '겉으로 티는 덜 나도 안에서 어긋나는 관계예요. 말이 세게 나가요.' },
  파: { word: '깨져요', line: '잡아둔 것이 흩어지는 관계예요. 계획이 틀어지기 쉬워요.' },
  해: { word: '걸려요', line: '사소한 데서 막히는 관계예요. 서운함이 남기 쉬워요.' },
};

// ── 신살 ─────────────────────────────────────────────────────────────────
export type SinsalKey = '천을귀인' | '문창귀인' | '도화' | '역마' | '화개';

/** 일간 기준 천을귀인 */
const CHEONEUL: number[][] = [
  [1, 7], [0, 8], [11, 9], [11, 9], [1, 7],
  [0, 8], [1, 7], [2, 6], [5, 3], [5, 3],
];
/** 일간 기준 문창귀인 */
const MUNCHANG: number[] = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];

/** 삼합 무리를 알면 도화 역마 화개가 한 번에 나온다 */
function samhapGroup(branch: number): number[] | null {
  return SAMHAP.find((g) => g.includes(branch)) ?? null;
}
const DOHWA: Record<string, number> = { '2,6,10': 3, '8,0,4': 9, '5,9,1': 6, '11,3,7': 0 };
const YEOKMA: Record<string, number> = { '2,6,10': 8, '8,0,4': 2, '5,9,1': 11, '11,3,7': 5 };
const HWAGAE: Record<string, number> = { '2,6,10': 10, '8,0,4': 4, '5,9,1': 1, '11,3,7': 7 };

export const SINSAL_KO: Record<SinsalKey, { word: string; line: string }> = {
  천을귀인: { word: '도와주는 사람', line: '막혔을 때 사람이 나서주는 자리예요. 부탁을 꺼내면 통해요.' },
  문창귀인: { word: '배움과 문서', line: '공부와 서류가 잘 붙는 자리예요. 자격과 글이 결과가 돼요.' },
  도화: { word: '인기와 구설', line: '사람 눈에 잘 띄는 자리예요. 인기와 구설이 같이 와요.' },
  역마: { word: '이동과 이사', line: '자리를 옮기고 멀리 가는 자리예요. 한곳에 오래 못 있어요.' },
  화개: { word: '혼자 파고들기', line: '파고들고 만들어내는 자리예요. 사람보다 혼자가 편해요.' },
};

/** 원국 지지들에서 찾은 신살 */
export function sinsalOf(pillars: FourPillars): { key: SinsalKey; at: string }[] {
  const dayStem = pillars.dayStem;
  const spots: { label: string; branch: number }[] = [
    { label: '태어난 해', branch: pillars.year.branch },
    { label: '태어난 달', branch: pillars.month.branch },
    { label: '태어난 날', branch: pillars.day.branch },
    ...(pillars.hour ? [{ label: '태어난 시각', branch: pillars.hour.branch }] : []),
  ];
  // 도화 역마 화개는 년지와 일지의 삼합 무리로 본다
  const bases = [pillars.year.branch, pillars.day.branch];
  const keyOf = (g: number[]) => g.join(',');
  const dohwa = new Set(bases.map(samhapGroup).filter(Boolean).map((g) => DOHWA[keyOf(g!)]));
  const yeokma = new Set(bases.map(samhapGroup).filter(Boolean).map((g) => YEOKMA[keyOf(g!)]));
  const hwagae = new Set(bases.map(samhapGroup).filter(Boolean).map((g) => HWAGAE[keyOf(g!)]));

  const out: { key: SinsalKey; at: string }[] = [];
  for (const s of spots) {
    if (CHEONEUL[dayStem].includes(s.branch)) out.push({ key: '천을귀인', at: s.label });
    if (MUNCHANG[dayStem] === s.branch) out.push({ key: '문창귀인', at: s.label });
    if (dohwa.has(s.branch)) out.push({ key: '도화', at: s.label });
    if (yeokma.has(s.branch)) out.push({ key: '역마', at: s.label });
    if (hwagae.has(s.branch)) out.push({ key: '화개', at: s.label });
  }
  // 같은 신살이 여러 자리에 있으면 첫 자리만 남긴다
  const seen = new Set<string>();
  return out.filter((o) => (seen.has(o.key) ? false : (seen.add(o.key), true)));
}

// ── 공망 ─────────────────────────────────────────────────────────────────
/** 일주가 속한 순(旬)에서 비는 두 지지 */
export function gongmangOf(dayGanzhi: number): [number, number] {
  const sun = Math.floor(dayGanzhi / 10);
  const first = ((10 - 2 * sun) % 12 + 12) % 12;
  return [first, (first + 1) % 12];
}

/** 지지 이름 */
