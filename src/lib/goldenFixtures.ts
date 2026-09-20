import type { BirthInput } from './fourPillars.ts';

// 만세력 골든 픽스처.
//
// 기대값을 어디서 땄는지를 반드시 같이 적는다. 출처 없이 숫자만 있으면, 나중에
// 어긋났을 때 '우리 버그' 인지 '기준이 다른 것' 인지 가릴 수 없다.
//
// source 가 말하는 것:
//   rule      명리 규칙에서 곧바로 유도되는 값. 외부 표가 없어도 손으로 검산된다.
//             (예: 60갑자 일주는 기준일 하나만 알면 날수 차이로 전부 나온다)
//   astro     공표된 천문 시각에서 유도. 절기 경계가 여기 걸린다.
//   history   한국 표준시 이력(IANA tzdata)에서 유도.
//
// 외부 만세력 사이트 한 곳을 베껴 맞추지 않는다. 그건 그 사이트의 관법을 우리
// 관법으로 바꾸는 일이지 검증이 아니다.

export type GoldenCase = {
  id: string;
  /** 왜 이 케이스가 필요한가 */
  why: string;
  input: BirthInput;
  expected: {
    /** 한글 간지. 모르는 자리는 안 적는다 (부분 검증 허용) */
    year?: string;
    month?: string;
    day?: string;
    /** 시각 미상이면 null 을 기대한다 */
    hour?: string | null;
    /** 절기 이름 */
    solarTerm?: string;
    /** 사주상의 띠 */
    zodiac?: string;
  };
  source: 'rule' | 'astro' | 'history';
  /** 이 기대값이 어느 규칙 아래에서 성립하는가 */
  ruleset: string;
  note?: string;
};

// 일주 검산의 기준점.
//
// 주의: 이 값은 아직 외부 만세력으로 대조하지 못했다. 이 세션에서 외부 페이지를
// 직접 열 수 없어서, 현재 엔진이 내는 값을 그대로 적어두면 '코드가 코드를 검증하는'
// 테스트가 된다. 그래서 절대 기준점은 통과하는 테스트로 만들지 않고 아래
// NEEDS_EXTERNAL_CHECK 에 남긴다.
//
// 대신 상대 성질(하루 뒤는 다음 간지, 60일 뒤는 같은 간지, 100년간 끊김 없음)은
// 규칙만으로 검산되므로 그건 정식 테스트로 건다. 기준점 하나가 밀려 있어도
// 상대 성질은 반드시 성립해야 한다.
export const DAY_ANCHOR = { date: '1900-01-01', ganzhi: 10, kor: '갑술' } as const;

/**
 * 외부 만세력으로 대조해야 확정되는 항목.
 *
 * 여기 적힌 것은 '현재 엔진이 내는 값' 이지 '검증된 값' 이 아니다. 만세력 한 곳을
 * 열어 대조한 뒤에야 source 를 붙여 GOLDEN 으로 옮긴다. 그전까지 PASS 라고 적지
 * 않는다.
 */
/**
 * 외부에서 대조한 일주 기준점.
 *
 * 2026-09-20 에 웹 검색으로 확인했다. 2000년 1월 1일은 무오일(60갑자 55번째,
 * 0부터 세면 54)이고 음력으로 1999년 11월 25일이다. 두 값 모두 엔진과 같다.
 *
 * 이 하나로 나머지가 따라온다. 일주는 하루에 정확히 한 칸씩 도는 산술이고,
 * golden.test 가 150년치를 율리우스일 계산과 따로 맞춰 끊김이 없음을 이미
 * 확인한다. 기준점 하나가 맞으면 그 범위의 모든 일주가 맞는다.
 *
 * 그래서 1900-01-01 갑술과 1984-02-02 병인은 '외부에서 본 값' 이 아니라
 * '확인된 기준점에서 날수로 끌어낸 값' 이다. 테스트에서도 그렇게 검산한다.
 */
export const DAY_ANCHOR_CHECKED = {
  date: '2000-01-01',
  ganzhi: 54,
  kor: '무오',
  lunar: { year: 1999, month: 11, day: 25, leap: false },
  checkedOn: '2026-09-20',
  how: '웹 검색. 일주와 음력 환산이 둘 다 엔진과 일치.',
} as const;

/**
 * 아직 외부 대조가 안 된 항목.
 *
 * 여기 적힌 것은 '현재 엔진이 내는 값' 이지 '검증된 값' 이 아니다. 대조한 뒤에야
 * GOLDEN 으로 옮긴다. 그전까지 PASS 라고 적지 않는다.
 */
export const NEEDS_EXTERNAL_CHECK: { date: string; engineSays: string; why: string }[] = [];

const RS = 'v1 / ipchun / solarTerm / trueSolarMidnight / nightZi:nextDay / trueSolar@126.9784 / daeun:round';

export const GOLDEN: GoldenCase[] = [
  // ── 평범한 날짜 ──────────────────────────────────────────────────────
  {
    id: 'plain-1990',
    why: '경계에 걸리지 않는 보통 날. 여기가 틀리면 나머지를 볼 필요가 없다.',
    input: { year: 1990, month: 5, day: 15, hour: 14, minute: 30 },
    expected: { year: '경오', solarTerm: '입하', zodiac: 'horse' },
    source: 'rule',
    ruleset: RS,
    note: '1990 은 경오년. 5/15 는 입하(4/20경)와 망종(6/5경) 사이라 사월이다.',
  },

  // ── 연도 경계: 입춘 ──────────────────────────────────────────────────
  {
    id: 'ipchun-2024-before',
    why: '입춘 전이면 달력 해와 사주 해가 다르다. 띠가 갈리는 자리.',
    input: { year: 2024, month: 2, day: 4, hour: 10 },
    expected: { year: '계묘', zodiac: 'rabbit', solarTerm: '소한' },
    source: 'astro',
    ruleset: RS,
    note: '2024 입춘은 2/4 17:27 KST. 10시는 아직 전년(계묘) 축월.',
  },
  {
    id: 'ipchun-2024-after',
    why: '입춘 몇 시간 뒤. 같은 날인데 년주와 월주가 통째로 바뀐다.',
    input: { year: 2024, month: 2, day: 4, hour: 20 },
    expected: { year: '갑진', zodiac: 'dragon', solarTerm: '입춘' },
    source: 'astro',
    ruleset: RS,
  },
  {
    id: 'newyear-1231',
    why: '달력 해가 바뀌어도 사주 해는 안 바뀐다. 12/31 은 여전히 전년.',
    input: { year: 2024, month: 12, day: 31, hour: 12 },
    expected: { year: '갑진', zodiac: 'dragon' },
    source: 'rule',
    ruleset: RS,
  },
  {
    id: 'newyear-0101',
    why: '1/1 도 입춘 전이라 여전히 전년 간지.',
    input: { year: 2025, month: 1, day: 1, hour: 12 },
    expected: { year: '갑진', zodiac: 'dragon' },
    source: 'rule',
    ruleset: RS,
  },

  // ── 절기 경계: 월주 ──────────────────────────────────────────────────
  {
    id: 'gyeongchip-before',
    why: '경칩 전날은 아직 인월. 달력 3월이라고 묘월이 아니다.',
    input: { year: 2024, month: 3, day: 4, hour: 12 },
    expected: { solarTerm: '입춘' },
    source: 'astro',
    ruleset: RS,
  },
  {
    id: 'gyeongchip-after',
    why: '경칩 다음날은 묘월.',
    input: { year: 2024, month: 3, day: 6, hour: 12 },
    expected: { solarTerm: '경칩' },
    source: 'astro',
    ruleset: RS,
  },

  // ── 일주 경계 ────────────────────────────────────────────────────────
  // 일주 절대값은 NEEDS_EXTERNAL_CHECK 로 뺐다. 상대 성질만 golden.test.ts 에서 건다.

  // ── 시각 미상 ────────────────────────────────────────────────────────
  {
    id: 'unknown-hour',
    why: '시각을 모르면 시주는 없어야 한다. 억지로 만들면 남의 시주가 된다.',
    input: { year: 1995, month: 8, day: 20, hour: null },
    expected: { hour: null },
    source: 'rule',
    ruleset: RS,
  },

  // ── 윤년 ─────────────────────────────────────────────────────────────
  {
    id: 'leap-0229',
    why: '2월 29일이 실재하는 날로 처리되는지.',
    input: { year: 2024, month: 2, day: 29, hour: 12 },
    expected: { year: '갑진', solarTerm: '입춘' },
    source: 'rule',
    ruleset: RS,
  },

  // ── 한국 표준시 이력 ─────────────────────────────────────────────────
  {
    id: 'kst-830-era',
    why: '1954~1961 은 +8:30 이었다. 지금 기준으로 계산하면 시주가 밀린다.',
    input: { year: 1959, month: 5, day: 10, hour: 23, minute: 30 },
    expected: {},
    source: 'history',
    ruleset: RS,
    note: '기대값은 같은 벽시계 시각을 +9 로 계산한 것과 달라야 한다는 형태로 검증한다.',
  },
];
