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

/** 짧은 표에는 명리 이름을 쓰고, 본문에서 의미를 설명한다. */
export const UNSEONG_KO: Record<Unseong, { word: string; line: string }> = {
  장생: { word: '장생', line: '새로운 일을 시작해볼 만한 시기예요. 작은 일부터 차근차근 해보세요.' },
  목욕: { word: '목욕', line: '마음이 자주 바뀔 수 있는 때로 봐요. 결정하기 전에 한 번 더 생각해보세요.' },
  관대: { word: '관대', line: '배우고 익힌 것이 드러나기 시작하는 때예요. 의욕이 앞서 실수하지 않도록 살펴보세요.' },
  건록: { word: '건록', line: '스스로 맡은 일을 해내기 좋은 때로 풀이해요.' },
  제왕: { word: '제왕', line: '의욕이 강해지는 때로 봐요. 자신 있게 하되 무리한 일까지 맡지는 마세요.' },
  쇠: { word: '쇠', line: '한숨 돌리며 지금까지 해온 일을 살펴볼 때예요. 새 일을 늘리기보다 마무리에 집중해보세요.' },
  병: { word: '병', line: '쉽게 지칠 수 있는 때로 풀이해요. 몸 상태를 살피고 충분히 쉬어가세요.' },
  사: { word: '사', line: '행동하기보다 생각이 많아지는 때로 봐요. 결정할 일이 있다면 차분히 정리해보세요.' },
  묘: { word: '묘', line: '하던 일을 마무리하기 좋은 때로 풀이해요. 새 일을 시작하기 전 정리부터 해보세요.' },
  절: { word: '절', line: '이어오던 일에 변화가 생길 수 있는 때로 봐요. 바꿀 일과 지킬 일을 살펴보세요.' },
  태: { word: '태', line: '새로운 일을 준비하는 때로 풀이해요. 아직 결과가 보이지 않아도 차근차근 알아보세요.' },
  양: { word: '양', line: '배우고 경험을 쌓는 때로 풀이해요. 혼자 해결하기 어렵다면 도움을 청해보세요.' },
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
  충: { word: '충', line: '충은 서로 부딪히는 관계예요. 이동이나 변화가 생기기 쉬운 것으로 풀이해요.' },
  합: { word: '합', line: '합은 서로 끌어당기는 관계예요. 함께하는 일에서 안정감을 얻는 것으로 풀이해요.' },
  삼합: { word: '삼합', line: '삼합은 세 지지가 한 무리를 이루는 관계예요. 협력하거나 일을 넓히는 때로 풀이해요.' },
  형: { word: '형', line: '형은 서로 불편함이 생기기 쉬운 관계예요. 말이 날카로워지지 않도록 살펴보세요.' },
  파: { word: '파', line: '파는 계획이 어긋나기 쉬운 관계로 풀이해요. 약속과 일정을 한 번 더 확인해보세요.' },
  해: { word: '해', line: '해는 사소한 오해나 서운함이 생기기 쉬운 관계로 봐요. 마음에 걸리는 일은 차분히 이야기해보세요.' },
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
  천을귀인: { word: '천을귀인', line: '천을귀인은 어려울 때 도움을 받는 인연으로 풀이해요. 혼자 고민하기보다 조언을 구해보세요.' },
  문창귀인: { word: '문창귀인', line: '문창귀인은 공부와 글쓰기의 재능으로 풀이해요. 배운 것을 기록하거나 정리해보세요.' },
  도화: { word: '도화', line: '도화는 사람들의 관심을 끄는 특징으로 풀이해요. 말과 행동이 주목받기 쉬우니 한 번 더 살펴보세요.' },
  역마: { word: '역마', line: '역마는 이동과 변화를 뜻해요. 한곳에 머물기보다 새로운 환경에 관심을 갖는 성향으로 풀이해요.' },
  화개: { word: '화개', line: '화개는 혼자 집중하고 깊이 탐구하는 특징으로 풀이해요. 공부나 만드는 일에 관심을 가져보세요.' },
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
