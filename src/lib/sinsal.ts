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
  장생: { word: '새로 시작해요', line: '배우고 싶던 강의나 운동을 알아보는 날이에요. 오늘은 후기 세 개만 읽어두고 등록은 내일 하세요. 하루 지나도 하고 싶으면 낸 돈이 아깝지 않아요.' },
  목욕: { word: '마음이 흔들려요', line: '마음이 하루에도 몇 번 바뀌는 날이에요. 결제나 계약은 내일로 미루세요.' },
  관대: { word: '일이 손에 잡혀요', line: '하던 일의 순서와 날짜가 하나씩 정해지는 날이에요. 들떠서 놓치는 게 없게 보내기 전에 한 번 더 읽으세요.' },
  건록: { word: '내 힘으로 해내요', line: '남에게 기대지 말고 내가 맡은 일을 오늘 안에 직접 끝내세요.' },
  제왕: { word: '힘이 가장 강해요', line: '미뤄둔 일 하나를 오늘 끝까지 밀고 나가세요. 다만 남의 일까지 떠안지는 마세요.' },
  쇠: { word: '속도를 낮춰요', line: '오늘 새로 건 구독이나 할부는 손해로 남아요. 그래서 사고 싶은 건 장바구니에만 담아두고, 오늘은 이미 잡힌 일정만 끝내세요.' },
  병: { word: '쉽게 지쳐요', line: '겉으로 괜찮아 보여도 피로가 쌓이는 날이에요. 저녁 약속은 하나만 잡고 11시 전에 자세요.' },
  사: { word: '생각이 많아져요', line: '답을 바로 내기보다 생각이 길어지는 날이에요. 고민되는 일은 좋은 점과 걸리는 점을 세 개씩 종이에 적으세요.' },
  묘: { word: '마무리할 때예요', line: '오늘은 새 약속이나 결제를 잡지 말고 끝내는 날이에요. 미뤄둔 일 하나를 저녁 6시 전에 마무리하면 내일 아침 할 일 목록이 한 줄 줄어요.' },
  절: { word: '바꾸기 좋은 때예요', line: '이어오던 일이 멈추거나 바뀌는 날이에요. 오래 미뤄온 변화는 오늘 첫 연락부터 하세요.' },
  태: { word: '준비가 시작돼요', line: '아직 눈에 보이는 결과는 적어도 준비를 시작하는 날이에요. 필요한 것 목록을 오늘 적어두세요.' },
  양: { word: '배우며 키워요', line: '혼자 하기보다 배우고 도움받으면서 준비하면 빨라요. 아는 사람에게 오늘 한 가지만 물어보세요.' },
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
  충: { word: '부딪혀요', line: '예정에 없던 일로 계획이 바뀌는 날이에요. 돈이 드는 결정은 하루 미루고 내일 다시 보세요.' },
  합: { word: '가까워져요', line: '함께하는 사람과 말이 잘 통하는 날이에요. 다만 일이 끝나는 데는 시간이 더 걸리니 마감은 하루 넉넉히 잡으세요.' },
  삼합: { word: '힘을 모아요', line: '같은 일을 하는 사람들과 손이 맞는 날이에요. 여럿이 하는 일은 오늘 진행하세요.' },
  형: { word: '어긋나요', line: '겉으로 드러나지 않아도 속으로 불편함이 쌓이는 날이에요. 말을 세게 하지 않게 한 박자 쉬고 답하세요.' },
  파: { word: '계획이 어긋나요', line: '잡아둔 일정이 미뤄지거나 바뀌는 날이에요. 시간 약속은 30분 넉넉히 잡으세요.' },
  해: { word: '서운해지기 쉬워요', line: '사소한 일에서 오해가 생기는 날이에요. 서운한 건 그날 안에 말로 풀고 자정을 넘기지 마세요.' },
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
  천을귀인: { word: '도와주는 사람', line: '막혔을 때 도와줄 사람이 나타나요. 필요한 도움은 돌려 말하지 말고 그대로 말하세요.' },
  문창귀인: { word: '배움과 문서', line: '공부나 서류 일이 남보다 빨라요. 자격증이나 글쓰기는 올해 안에 하나 시작하세요.' },
  도화: { word: '인기와 구설', line: '사람들 눈에 잘 띄어요. 관심을 받는 만큼 뒷말도 따라오니 남 얘기는 입에 올리지 마세요.' },
  역마: { word: '이동과 이사', line: '이동이나 이사처럼 장소를 옮기는 일이 자주 생겨요. 한곳에 오래 있으면 답답해지니 한 달에 한 번은 멀리 다녀오세요.' },
  화개: { word: '혼자 깊게 생각해요', line: '혼자 깊게 생각하거나 만드는 일에 맞아요. 여럿과 어울리는 자리보다 혼자 있는 시간이 편해요.' },
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
