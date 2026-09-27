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
  장생: { word: '새로 시작해요', line: '새로 시작할 일을 준비하기 좋아요. 크게 벌이기보다 작게 시작해보세요.' },
  목욕: { word: '마음이 흔들려요', line: '생각이 자주 바뀔 수 있어요. 중요한 결정은 조금 미뤄도 돼요.' },
  관대: { word: '모양이 잡혀요', line: '하던 일이 조금씩 구체적으로 정리돼요. 의욕이 앞서 실수하지 않게 한 번 더 확인하세요.' },
  건록: { word: '내 힘으로 해내요', line: '남에게 기대기보다 내가 맡은 일을 직접 끝내기 좋은 때예요.' },
  제왕: { word: '힘이 가장 강해요', line: '자신 있게 움직이기 좋은 때예요. 다만 무리해서 한 번에 너무 많이 하지는 마세요.' },
  쇠: { word: '속도를 낮춰요', line: '새 일을 늘리기보다 지금 하는 일을 정리하고 지키는 편이 나아요.' },
  병: { word: '쉽게 지쳐요', line: '겉으로 괜찮아 보여도 안에서는 피로가 쌓일 수 있어요. 무리하지 마세요.' },
  사: { word: '생각이 많아져요', line: '바로 움직이기보다 생각이 길어질 수 있어요. 중요한 결정은 조금 미뤄도 돼요.' },
  묘: { word: '마무리할 때예요', line: '새 일을 벌이기보다 하던 일을 끝내고 정리하기 좋아요.' },
  절: { word: '바꾸기 좋은 때예요', line: '이어오던 일이 멈추거나 바뀔 수 있어요. 오래 미뤄온 변화를 시작하기에는 좋아요.' },
  태: { word: '준비가 시작돼요', line: '아직 눈에 보이는 결과는 적어도 새 일을 준비하기 좋은 때예요.' },
  양: { word: '배우며 키워요', line: '혼자 하기보다 배우고 도움받으면서 준비하는 편이 빨라요.' },
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
  충: { word: '부딪혀요', line: '서로 부딪히기 쉬운 관계예요. 변화가 생길 수 있지만 계획도 어긋날 수 있어요.' },
  합: { word: '가까워져요', line: '서로 가까워지기 쉬운 관계예요. 안정적이지만 진행 속도는 느려질 수 있어요.' },
  삼합: { word: '힘을 모아요', line: '같은 목표를 향해 힘을 모으기 쉬운 관계예요. 함께하는 일이 커질 수 있어요.' },
  형: { word: '어긋나요', line: '겉으로 드러나지 않아도 속으로 불편함이 쌓일 수 있어요. 말을 세게 하지 않게 조심하세요.' },
  파: { word: '계획이 어긋나요', line: '잡아둔 계획이나 일정이 흐트러지기 쉬운 관계예요.' },
  해: { word: '서운해지기 쉬워요', line: '사소한 일에서 오해가 생길 수 있어요. 서운함을 오래 담아두지 마세요.' },
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
  천을귀인: { word: '도와주는 사람', line: '막혔을 때 도와줄 사람이 생길 수 있어요. 필요한 도움을 말해보세요.' },
  문창귀인: { word: '배움과 문서', line: '공부나 서류 작업을 하기 좋은 때예요. 자격증이나 글쓰기를 준비해보세요.' },
  도화: { word: '인기와 구설', line: '사람들의 눈에 띄기 쉬워요. 관심을 받는 만큼 말도 조심하는 게 좋아요.' },
  역마: { word: '이동과 이사', line: '이동이나 이사처럼 장소를 옮기는 일이 늘 수 있어요. 한곳에 오래 있으면 답답하게 느낄 수 있어요.' },
  화개: { word: '혼자 깊게 생각해요', line: '혼자 깊게 생각하거나 만드는 일에 잘 맞아요. 많은 사람과 어울리기보다 혼자 있는 시간이 편할 수 있어요.' },
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
