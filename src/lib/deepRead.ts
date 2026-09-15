import { DAY_MASTER_BY_INDEX } from '../data/dayMaster.ts';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { TEN_GOD_KO } from './tenGods.ts';
import { BAND_WORD, monthsAway, type TimingRead, type TimingSlot } from './timing.ts';
import { CONCERN_GOD, GOD_SCALE, INNER_GAP, INNER_SAME, REFRESH_NOTE } from '../data/concernReadings.ts';
import type { FourPillars } from './fourPillars.ts';

// 고민 하나에 대한 심층 답 — 결론, 시기, 근거, 할 일.
// 모든 문장은 규칙에서 나온다. 같은 생년월일과 같은 고민이면 언제 봐도 같은 답이다.

export type Verdict = 'now' | 'soon' | 'wait';

export type DeepRead = {
  verdict: Verdict;
  headline: string;
  sub: string;
  situationLine: string;
  /** 시기 표 */
  when: { k: string; v: string; band?: string }[];
  /** 왜 그렇게 봤는지 */
  why: { k: string; v: string }[];
  actions: string[];
  caution: string;
  daeunLine: string;
  basis: string;
  /** 달마다 한 덩이씩 — 이번 달, 좋은 달, 피할 달 */
  slots: { k: string; label: string; band: string; outer: string; inner: string; note: string }[];
  /** 올해와 내년 */
  yearLines: { k: string; label: string; band: string; v: string }[];
  /** 겉과 속이 같은지 */
  innerNote: string;
  /** 이 답이 언제 다시 계산되는지 */
  refresh: string;
};

const HEADLINE: Record<ConcernKey, Record<Verdict, string>> = {
  work: {
    now: '지금 움직여도 되는 구간이에요',
    soon: '조금만 더 있다가 움직이는 게 나아요',
    wait: '올해는 자리를 지키면서 준비하는 해예요',
  },
  money: {
    now: '지금은 들어오는 쪽이 큰 구간이에요',
    soon: '곧 돈이 도는 구간이 와요',
    wait: '지금은 늘리기보다 막아두는 구간이에요',
  },
  love: {
    now: '지금 자리가 열려 있어요',
    soon: '곧 사람이 닿는 구간이 와요',
    wait: '지금은 사람보다 나를 먼저 채우는 때예요',
  },
  people: {
    now: '지금은 내 편이 늘어나는 구간이에요',
    soon: '곧 사람 사이가 풀리는 구간이 와요',
    wait: '지금은 관계를 넓히기보다 정리하는 때예요',
  },
  health: {
    now: '지금은 회복이 잘 붙는 구간이에요',
    soon: '곧 몸이 올라오는 구간이 와요',
    wait: '지금은 무리가 바로 표시 나는 구간이에요',
  },
  mind: {
    now: '지금은 마음이 가라앉는 구간이에요',
    soon: '곧 마음이 풀리는 구간이 와요',
    wait: '지금은 결정을 미뤄도 되는 때예요',
  },
};

const ACTIONS: Record<ConcernKey, Record<Verdict, string[]>> = {
  work: {
    now: [
      '이력서를 오늘 손봐요. 숫자로 쓸 수 있는 성과부터 채워요',
      '가고 싶은 곳 세 군데를 적고 아는 사람이 있는지 먼저 확인해요',
      '나가는 날짜보다 들어가는 날짜를 먼저 확정해요',
    ],
    soon: [
      '지금은 조용히 준비해요. 소문이 먼저 나면 카드가 없어져요',
      '면접에서 쓸 이야기 세 개를 미리 만들어둬요',
      '연봉 기준선을 숫자로 정해두면 흔들릴 일이 줄어요',
    ],
    wait: [
      '올해는 기록을 남기는 해로 써요. 한 일을 문서로 모아둬요',
      '자격이나 배움처럼 남는 걸 하나 걸어둬요',
      '지금 자리에서 결정권이 붙는 일을 한 개 맡아요',
    ],
  },
  money: {
    now: [
      '들어오는 돈을 쓰기 전에 떼어서 따로 옮겨요',
      '미뤄둔 정산이나 받을 돈을 이번 달에 정리해요',
      '큰 지출은 이 구간 안에 몰아서 끝내요',
    ],
    soon: [
      '지금은 고정비부터 줄여요. 늘리는 건 그다음이에요',
      '나가는 돈을 한 달만 전부 적어봐요. 새는 곳이 바로 보여요',
      '계약이나 서명은 흐름이 좋은 달로 미뤄요',
    ],
    wait: [
      '새로 벌이는 건 미뤄요. 지금은 지키는 게 버는 거예요',
      '빌려주는 돈은 만들지 말아요. 돌려받기 어려운 구간이에요',
      '보험이나 구독처럼 조용히 나가는 걸 점검해요',
    ],
  },
  love: {
    now: [
      '아는 사람을 통해 닿는 자리를 만들어요. 낯선 자리보다 잘 붙어요',
      '먼저 연락하는 쪽이 되어봐요. 지금은 그게 통해요',
      '만나면 다음 약속을 그 자리에서 잡아요',
    ],
    soon: [
      '지금은 답을 재촉하지 말아요. 정해질 때가 따로 있어요',
      '내 하루를 채우는 게 제일 좋은 준비예요',
      '연락은 짧고 가볍게 이어두기만 해요',
    ],
    wait: [
      '지금 결론을 내면 나중에 후회하기 쉬워요. 미뤄둬요',
      '혼자 하는 일을 하나 시작해봐요. 사람은 그다음에 와요',
      '끝난 사이라면 이번 구간엔 연락하지 말아요',
    ],
  },
  people: {
    now: [
      '먼저 연락해요. 지금은 내가 여는 쪽이 이득이에요',
      '도움을 청해도 되는 구간이에요. 혼자 안고 가지 말아요',
      '고마운 사람한테 표시를 해둬요. 오래 가요',
    ],
    soon: [
      '오해가 있으면 지금 풀지 말고 사실만 정리해둬요',
      '자리에 나가되 말은 줄여요. 듣는 쪽이 유리해요',
      '중요한 대화는 흐름이 좋은 달로 옮겨요',
    ],
    wait: [
      '새로 넓히지 말아요. 지금은 걸러내는 구간이에요',
      '부탁을 거절해도 되는 때예요. 다 받으면 내가 무너져요',
      '단톡방이나 모임을 한 개만 줄여도 숨이 트여요',
    ],
  },
  health: {
    now: [
      '미뤄둔 검진을 이번 구간에 잡아요',
      '운동을 시작하기 좋은 때예요. 작게 시작해서 붙여요',
      '자는 시간을 먼저 고정해요. 나머지는 따라와요',
    ],
    soon: [
      '지금은 늘리지 말고 회복부터 해요',
      '카페인을 한 잔 줄이고 물을 한 잔 늘려요',
      '무리한 일정은 흐름이 좋은 달로 미뤄요',
    ],
    wait: [
      '이 구간엔 밤을 새우지 말아요. 바로 표시가 나요',
      '아픈 데가 있으면 참지 말고 병원에 가요. 사주는 병을 못 봐요',
      '약속을 하나 줄이고 그 시간에 누워요',
    ],
  },
  mind: {
    now: [
      '하고 싶었던 말을 한 번 꺼내봐요. 지금은 잘 나가요',
      '기록을 남겨요. 지나고 나면 이 구간이 기준이 돼요',
      '미뤄둔 결정을 이번에 하나만 끝내요',
    ],
    soon: [
      '지금은 답을 정하지 말고 적어만 둬요',
      '몸을 먼저 움직여요. 마음은 뒤따라와요',
      '믿는 사람 한 명한테만 말해요',
    ],
    wait: [
      '큰 결정은 미뤄요. 지금 내린 답은 나중에 바뀌어요',
      '잘 자고 잘 먹는 것만 해도 이 구간은 충분해요',
      '혼자 견디지 말아요. 힘들면 전문가를 찾아도 돼요',
    ],
  },
};

const CAUTION: Record<ConcernKey, string> = {
  work: '버거운 달에 사표를 던지면 다음 자리가 급해져요. 그 달은 넘기고 움직여요.',
  money: '버거운 달엔 큰 계약과 보증을 피해요. 한 달만 미뤄도 달라져요.',
  love: '버거운 달엔 말이 세게 나가요. 중요한 얘기는 그 달을 넘겨요.',
  people: '버거운 달엔 오해가 잘 생겨요. 말보다 글로 남기면 덜 꼬여요.',
  health: '버거운 달엔 무리가 바로 옵니다. 일정을 미리 비워둬요.',
  mind: '버거운 달엔 혼자 결론 내지 말아요. 하루만 자고 다시 봐요.',
};

const VERDICT_SUB: Record<Verdict, string> = {
  now: '지금 흐름이 이 고민 쪽으로 열려 있어요.',
  soon: '지금은 아니고, 가까운 달에 자리가 열려요.',
  wait: '이 구간은 미는 것보다 지키는 쪽이 남아요.',
};

export function buildDeepRead(
  pillars: FourPillars,
  timing: TimingRead,
  concernKey: ConcernKey,
  optionKey: string | null,
): DeepRead {
  const concern = findConcern(concernKey);
  const dm = DAY_MASTER_BY_INDEX[pillars.dayStem];
  const away = monthsAway(timing.bestMonth, timing.months);

  let verdict: Verdict;
  if (timing.thisMonth.band === 'good') verdict = 'now';
  else if (timing.bestMonth.band === 'good' && away <= 3) verdict = 'soon';
  else verdict = 'wait';

  const option = concern.options.find((o) => o.key === optionKey) ?? null;

  const when: { k: string; v: string; band?: string }[] = [
    {
      k: '이번 달',
      v: `${TEN_GOD_KO[timing.thisMonth.tenGod]}이 들어와요`,
      band: BAND_WORD[timing.thisMonth.band],
    },
    {
      k: '가장 좋은 때',
      v: away === 0 ? `${timing.bestMonth.label}, 바로 지금이에요` : `${timing.bestMonth.label}, ${away}달 뒤예요`,
      band: BAND_WORD[timing.bestMonth.band],
    },
    {
      k: '피할 때',
      v: `${timing.hardMonth.label}`,
      band: BAND_WORD[timing.hardMonth.band],
    },
    {
      k: '좋은 해',
      v: `${timing.bestYear.label}`,
      band: BAND_WORD[timing.bestYear.band],
    },
  ];

  const why: { k: string; v: string }[] = [
    { k: '내 글자', v: `${dm.name}이에요. ${dm.tagline}` },
    { k: '올해', v: `${TEN_GOD_KO[timing.years[0].tenGod]}이 도는 해예요` },
    { k: '겉 기운', v: `${TEN_GOD_KO[timing.thisMonth.tenGod]}이 들어와요` },
    { k: '속 기운', v: `${TEN_GOD_KO[timing.thisMonth.branchGod]}이 깔려 있어요` },
    { k: '십 년', v: timing.daeunSlot ? `${TEN_GOD_KO[timing.daeunSlot.tenGod]}이에요` : '아직 첫 대운 전이에요' },
  ];

  const cur = timing.daeun.current;
  const left = timing.daeun.yearsToNext;
  const daeunLine = cur
    ? `${cur.startAge}세부터 ${cur.endAge}세까지는 ${cur.kor} 대운이에요.` +
      (timing.daeunSlot
        ? ` ${GOD_SCALE[timing.daeunSlot.tenGod].daeun} ${CONCERN_GOD[concernKey][timing.daeunSlot.tenGod].line}`
        : '') +
      (left !== null && left > 0 ? ` 다음 대운까지 ${left}해 남았어요.` : '')
    : `첫 대운이 ${timing.daeun.startAge}세부터 들어와요. 그전까지는 태어난 자리의 기운을 그대로 써요.`;

  // 달 한 덩이 — 겉(천간)과 속(지지)을 따로 대야 열두 달이 전부 다른 얼굴이 된다
  const slotBlock = (k: string, slot: TimingSlot) => ({
    k,
    label: slot.label,
    band: BAND_WORD[slot.band],
    outer: GOD_SCALE[slot.tenGod].month,
    inner: CONCERN_GOD[concernKey][slot.tenGod].line,
    note: CONCERN_GOD[concernKey][slot.branchGod].line,
  });

  const slots = [
    slotBlock('이번 달', timing.thisMonth),
    ...(timing.bestMonth.label !== timing.thisMonth.label ? [slotBlock('가장 좋은 달', timing.bestMonth)] : []),
    ...(timing.hardMonth.label !== timing.thisMonth.label ? [slotBlock('조심할 달', timing.hardMonth)] : []),
  ];

  const yearLines = timing.years.slice(0, 2).map((y, i) => ({
    k: i === 0 ? '올해' : '내년',
    label: y.label,
    band: BAND_WORD[y.band],
    v: `${GOD_SCALE[y.tenGod].year} ${CONCERN_GOD[concernKey][y.tenGod].line}`,
  }));

  // 할 일 셋 중 하나는 이번 달 글자에서, 하나는 가장 좋은 달 글자에서 뽑는다.
  // 그래야 같은 고민이라도 달이 바뀌면 할 일이 바뀐다.
  const actions = [
    CONCERN_GOD[concernKey][timing.thisMonth.tenGod].act,
    CONCERN_GOD[concernKey][timing.bestMonth.branchGod].act,
    ACTIONS[concernKey][verdict][0],
  ].filter((a, i, arr) => arr.indexOf(a) === i);
  while (actions.length < 3) {
    const extra = ACTIONS[concernKey][verdict].find((a) => !actions.includes(a));
    if (!extra) break;
    actions.push(extra);
  }

  return {
    verdict,
    headline: HEADLINE[concernKey][verdict],
    sub: `${CONCERN_GOD[concernKey][timing.thisMonth.tenGod].line} ${VERDICT_SUB[verdict]}`,
    slots,
    yearLines,
    innerNote: timing.thisMonth.tenGod === timing.thisMonth.branchGod ? INNER_SAME : INNER_GAP,
    refresh: REFRESH_NOTE,
    situationLine: option?.line ?? '',
    when,
    why,
    actions: actions.slice(0, 3),
    caution: CAUTION[concernKey],
    daeunLine,
    basis: concern.basis,
  };
}
