import { DAY_MASTER_BY_INDEX } from '../data/dayMaster.ts';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { TEN_GOD_KO } from './tenGods.ts';
import { BAND_WORD, monthsAway, type TimingRead, type TimingSlot } from './timing.ts';
import { CONCERN_GOD, GOD_SCALE, REFRESH_NOTE } from '../data/concernReadings.ts';
import { computeConcernScore, scoreVerdictLine, type ConcernScore } from './concernScore.ts';
import { NATAL_SHAPE, SHAPE_LABELS, type ShapeRow } from '../data/natalShape.ts';
import { CONCERN_DAY } from '../data/concernDay.ts';
import { CONCERN_NOW, NOW_HEAD } from '../data/concernNow.ts';
import { DECADE_AREAS, GOD_KEYWORD, type DecadeAreas } from '../data/decadeAreas.ts';
import { DECISION, STANCE_WORD, WHEN_ACT, type Stance } from '../data/decision.ts';
import { GOD_GROUP_OF } from './tenGods.ts';
import type { FourPillars } from './fourPillars.ts';

// 고민 하나에 대한 심층 답 — 결론, 시기, 근거, 할 일.
// 모든 문장은 규칙에서 나온다. 같은 생년월일과 같은 고민이면 언제 봐도 같은 답이다.

export type Verdict = 'now' | 'soon' | 'wait';

export type DeepRead = {
  verdict: Verdict;
  /** 명식에서 계산된 이 고민의 점수 — 날짜 seed 가 아니라 여덟 글자에서 나온다 */
  score: ConcernScore;
  /** 점수와 결론을 한 문장으로 묶은 줄 */
  scoreLine: string;
  /** 평생 안 바뀌는 바탕 — 나는 원래 어떤 사람인가 */
  shape: ShapeRow & { head: string; rows: { k: string; v: string }[] };
  /** 오늘 하루의 행동. 고른 주제에 일진을 대어 뽑는다 */
  today: { doIt: string; avoid: string; hold: string | null };
  /** 결정 카드 — 지금 어느 상태이고, 뭘 하고 뭘 하지 말 것인가 */
  decision: { stance: Stance; stanceWord: string; verdict: string; dos: string[]; donts: string[] };
  /** 왜 지금 이 고민이 커졌는지 — 십 년, 올해, 이번 달을 겹쳐 본다 */
  now: { head: string; situation: string; rows: { k: string; label: string; v: string }[] };
  headline: string;
  sub: string;
  situationLine: string;
  /** 시기 표 */
  when: { k: string; v: string; band?: string; act?: string }[];
  /** 왜 그렇게 봤는지 */
  why: { k: string; v: string }[];
  actions: string[];
  caution: string;
  daeunLine: string;
  /** 지금 지나는 십 년을 체감되는 자리로 쪼갠 것 */
  decade: { span: string; head: string; rows: { k: string; v: string }[]; next: string | null } | null;
  /** 올해와 내년을 맞대 놓은 표 */
  yearCompare: { k: string; thisYear: string; nextYear: string }[];
  /** 두 해의 차이를 한 문장으로 */
  yearGap: string;
  basis: string;
  /** 달마다 한 덩이씩 — 이번 달, 좋은 달, 피할 달 */
  slots: { k: string; label: string; band: string; outer: string; good: string; care: string }[];
  /** 열두 달 전부. 막대를 눌렀을 때 그 달의 풀이를 바로 펴 준다 */
  monthSlots: { label: string; month: number; band: string; outer: string; good: string; care: string }[];
  /** 올해와 내년 */
  yearLines: { k: string; label: string; band: string; v: string }[];
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
  dateKey: string,
): DeepRead {
  const concern = findConcern(concernKey);
  const dm = DAY_MASTER_BY_INDEX[pillars.dayStem];
  const away = monthsAway(timing.bestMonth, timing.months);

  const score = computeConcernScore(pillars, timing, dateKey);

  // 결론과 점수가 따로 놀면 둘 다 못 믿을 말이 된다.
  // 62점인데 '지금 움직여도 돼요' 가 뜨면 그 화면은 그걸로 끝이다.
  // 그래서 '지금' 은 이번 달이 열려 있고 총점도 받쳐줄 때만 쓴다.
  let verdict: Verdict;
  if (timing.thisMonth.band === 'good' && score.total >= 74) verdict = 'now';
  else if (timing.bestMonth.band === 'good' && away <= 3) verdict = 'soon';
  else verdict = 'wait';

  const option = concern.options.find((o) => o.key === optionKey) ?? null;

  const shapeRow = NATAL_SHAPE[concernKey][GOD_GROUP_OF[score.natalTopGod]];
  const lab = SHAPE_LABELS[concernKey];
  // 지금 어느 상태인가. 이번 달 판정과 가장 좋은 달까지의 거리로 정한다.
  // verdict 와 같은 재료를 쓰되 네 갈래로 나눠야 '실행' 과 '유지' 가 안 섞인다.
  let stance: Stance;
  if (timing.thisMonth.band === 'good' && score.total >= 74) stance = 'run';
  else if (timing.thisMonth.band === 'hard') stance = 'hold';
  else if (timing.bestMonth.band === 'good' && away > 0 && away <= 3) stance = 'prep';
  else stance = 'keep';

  const cell = DECISION[concernKey][stance];
  const decision = {
    stance,
    stanceWord: STANCE_WORD[stance],
    verdict: cell.verdict,
    dos: [...cell.dos],
    donts: [...cell.donts],
  };

  // 오늘 칸이 버거울 때만 '미뤄도 돼요' 를 낸다. 늘 띄우면 접어두라는 말만 쌓인다.
  const dayAct = CONCERN_DAY[concernKey][score.dayGod];
  const today = {
    doIt: dayAct.doIt,
    avoid: dayAct.avoid,
    hold: score.dayBand === 'hard' ? dayAct.hold : null,
  };

  // 지금 이 고민이 왜 커졌는지. 십 년이 배경을 깔고, 올해가 방향을 정하고,
  // 이번 달이 눈앞에 밀어놓는다. 세 칸을 따로 두면 사용자가 제 상황을 짚어 읽는다.
  const nowRows = [
    timing.daeunSlot
      ? {
          k: '지금 지나는 십 년',
          label: timing.daeun.current ? `${timing.daeun.current.startAge}세부터` : '',
          v: CONCERN_NOW[concernKey][timing.daeunSlot.tenGod].decade,
        }
      : null,
    {
      k: '올해',
      label: timing.years[0].label,
      v: CONCERN_NOW[concernKey][timing.years[0].tenGod].year,
    },
    {
      k: '이번 달',
      label: timing.thisMonth.label,
      v: CONCERN_NOW[concernKey][timing.thisMonth.tenGod].month,
    },
  ].filter((r): r is { k: string; label: string; v: string } => r !== null);

  const now = {
    head: NOW_HEAD[concernKey],
    situation: option?.line ?? '',
    rows: nowRows,
  };

  const shape = {
    ...shapeRow,
    head: lab.head,
    rows: [
      { k: lab.inflow, v: shapeRow.inflow },
      { k: lab.grow, v: shapeRow.grow },
      { k: lab.rise, v: shapeRow.rise },
      { k: lab.leak, v: shapeRow.leak },
      { k: lab.trap, v: shapeRow.trap },
    ],
  };

  const act = WHEN_ACT[concernKey];
  const when: { k: string; v: string; band?: string; act?: string }[] = [
    {
      k: '이번 달',
      v: timing.thisMonth.label,
      band: BAND_WORD[timing.thisMonth.band],
    },
    {
      k: '가장 좋은 때',
      v: away === 0 ? `${timing.bestMonth.label}, 바로 이번 달이에요` : `${timing.bestMonth.label}, ${away}달 뒤`,
      band: BAND_WORD[timing.bestMonth.band],
      act: act.best,
    },
    {
      k: '피할 때',
      v: `${timing.hardMonth.label}`,
      band: BAND_WORD[timing.hardMonth.band],
      act: act.hard,
    },
    {
      k: '좋은 해',
      v: `${timing.bestYear.label}`,
      band: BAND_WORD[timing.bestYear.band],
      act: act.year,
    },
  ];

  // 근거 줄은 이름만 대면 아무 뜻이 없다. 이름 옆에 그게 무슨 뜻인지 한 문장을 붙인다.
  const why: { k: string; v: string }[] = [
    { k: '내 글자', v: `${dm.name}이에요. ${dm.tagline}` },
    {
      k: '올해',
      v: `${TEN_GOD_KO[timing.years[0].tenGod]}이 돌아요. ${GOD_SCALE[timing.years[0].tenGod].year}`,
    },
    {
      k: '이번 달',
      v: `${TEN_GOD_KO[timing.thisMonth.tenGod]}이 들어와요. ${GOD_SCALE[timing.thisMonth.tenGod].month}`,
    },
    {
      k: '십 년',
      v: timing.daeunSlot
        ? `${TEN_GOD_KO[timing.daeunSlot.tenGod]}을 지나요. ${GOD_SCALE[timing.daeunSlot.tenGod].daeun}`
        : '아직 첫 십 년이 시작되기 전이라 태어난 자리를 그대로 봐요.',
    },
  ];

  const cur = timing.daeun.current;
  const left = timing.daeun.yearsToNext;
  // 대운 이름(기묘 같은 것)을 그대로 쓰면 아무 뜻이 없다. 무슨 기운인지로 말한다.
  const daeunLine = cur
    ? `${cur.startAge}세부터 ${cur.endAge}세까지가 지금 지나는 십 년이에요.` +
      (timing.daeunSlot
        ? ` ${GOD_SCALE[timing.daeunSlot.tenGod].daeun} ${CONCERN_GOD[concernKey][timing.daeunSlot.tenGod].line}`
        : '') +
      (left !== null && left > 0 ? ` 다음 십 년으로 넘어가기까지 ${left}년 남았어요.` : '')
    : `${timing.daeun.startAge}세부터 첫 십 년이 시작돼요. 그전까지는 태어난 자리의 기운을 그대로 써요.`;

  // 십 년을 자리별로 쪼갠다. '틀을 깨는 십 년입니다' 로 끝내면 아무것도 안 남는다.
  const areas: DecadeAreas | null = timing.daeunSlot ? DECADE_AREAS[timing.daeunSlot.tenGod] : null;
  const decade =
    cur && areas
      ? {
          span: `${cur.startAge}세부터 ${cur.endAge}세까지`,
          head: areas.head,
          rows: [
            { k: '일', v: areas.work },
            { k: '돈', v: areas.money },
            { k: '사람', v: areas.people },
            { k: '몸', v: areas.body },
            { k: '이 십 년의 숙제', v: areas.task },
          ],
          next:
            left !== null && left > 0
              ? `${left}년 뒤에 다음 십 년으로 넘어가요. 그때가 되면 여기 적힌 배경 자체가 바뀌어요.`
              : null,
        }
      : null;

  // 올해와 내년은 따로 설명만 하면 뭐가 다른지 안 보인다. 같은 줄에 맞대 놓는다.
  const [y0, y1] = timing.years;
  const yearCompare = [
    { k: '한 해의 결', thisYear: GOD_KEYWORD[y0.tenGod], nextYear: GOD_KEYWORD[y1.tenGod] },
    {
      k: '유리하게 쓰는 법',
      thisYear: CONCERN_GOD[concernKey][y0.tenGod].good,
      nextYear: CONCERN_GOD[concernKey][y1.tenGod].good,
    },
    {
      k: '조심할 것',
      thisYear: CONCERN_GOD[concernKey][y0.branchGod].care,
      nextYear: CONCERN_GOD[concernKey][y1.branchGod].care,
    },
  ];
  const yearGap =
    y0.tenGod === y1.tenGod
      ? `올해와 내년의 결이 비슷해요. 흐름이 이어지는 구간이라 올해 잡아둔 것이 내년에 그대로 굴러가요.`
      : `올해가 ${GOD_KEYWORD[y0.tenGod]}에 가까운 해라면, 내년은 ${GOD_KEYWORD[y1.tenGod]}에 가까운 해예요.`;

  // 달 한 덩이 — 겉(천간)과 속(지지)을 따로 대야 열두 달이 전부 다른 얼굴이 된다
  const slotBlock = (k: string, slot: TimingSlot) => ({
    k,
    label: slot.label,
    band: BAND_WORD[slot.band],
    outer: GOD_SCALE[slot.tenGod].month,
    good: CONCERN_GOD[concernKey][slot.tenGod].good,
    care: CONCERN_GOD[concernKey][slot.branchGod].care,
  });

  const slots = [
    slotBlock('이번 달', timing.thisMonth),
    ...(timing.bestMonth.label !== timing.thisMonth.label ? [slotBlock('가장 좋은 달', timing.bestMonth)] : []),
    ...(timing.hardMonth.label !== timing.thisMonth.label ? [slotBlock('조심할 달', timing.hardMonth)] : []),
  ];

  const monthSlots = timing.months.map((m) => ({
    label: m.label,
    month: m.month ?? 0,
    band: BAND_WORD[m.band],
    outer: GOD_SCALE[m.tenGod].month,
    good: CONCERN_GOD[concernKey][m.tenGod].good,
    care: CONCERN_GOD[concernKey][m.branchGod].care,
  }));

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
    score,
    scoreLine: scoreVerdictLine(score, concernKey),
    shape,
    today,
    decision,
    now,
    headline: HEADLINE[concernKey][verdict],
    sub: `${CONCERN_GOD[concernKey][timing.thisMonth.tenGod].line} ${VERDICT_SUB[verdict]}`,
    slots,
    monthSlots,
    yearLines,
    refresh: REFRESH_NOTE,
    situationLine: option?.line ?? '',
    when,
    why,
    actions: actions.slice(0, 3),
    caution: CAUTION[concernKey],
    daeunLine,
    decade,
    yearCompare,
    yearGap,
    basis: concern.basis,
  };
}
