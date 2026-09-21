import { DAY_MASTER_BY_INDEX } from '../data/dayMaster.ts';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { TEN_GOD_KO } from './tenGods.ts';
import { bandLabel, monthsAway, type Band, type TimingRead, type TimingSlot } from './timing.ts';
import { CONCERN_GOD, REFRESH_NOTE } from '../data/concernReadings.ts';
import { computeConcernScore, scoreVerdictLine, type ConcernScore } from './concernScore.ts';
import { withJosa } from './josa.ts';
import { NATAL_SHAPE, SHAPE_LABELS, type ShapeRow } from '../data/natalShape.ts';
import { CONCERN_DAY } from '../data/concernDay.ts';
import { CONCERN_NOW, NOW_HEAD } from '../data/concernNow.ts';
import { DECADE_AREAS, GOD_KEYWORD, type DecadeAreas } from '../data/decadeAreas.ts';
import { DECISION, STANCE_WORD, WHEN_ACT, type Stance } from '../data/decision.ts';
import { GOD_GROUP_OF, analyzeSaju, tenGodOf, mainHiddenStem, type GodGroup, type TenGod } from './tenGods.ts';
import { ELEMENT_KO, STEMS, BRANCHES, type Element } from './saju.ts';
import {
  unseongOf, UNSEONG_KO, branchRelations, RELATION_KO, sinsalOf, SINSAL_KO, gongmangOf,
} from './sinsal.ts';
import { readNameSound, FLOW_KO } from './nameSound.ts';
import { computeFourPillars, type FourPillars } from './fourPillars.ts';

// 이 주제를 볼 때 무엇을 보는지 - 명리 이름 대신 뜻으로 말한다
const FAVOR_WORD: Record<GodGroup, string> = {
  self: '나를 세우는 자리',
  output: '꺼내 보이는 자리',
  wealth: '거두는 자리',
  authority: '자리와 규칙',
  support: '받쳐주고 배우는 자리',
};

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
  /** 이번 달 기운으로 읽은 한 줄. 행동 바로 위에 붙는다 */
  monthWhy: string;
  situationLine: string;
  /** 시기 표 */
  when: { k: string; v: string; band?: string; bandKey?: Band; act?: string }[];
  /** 왜 그렇게 봤는지 */
  why: { k: string; v: string }[];
  /** 내 명식 여덟 글자 — 근거를 그대로 펼쳐 보인다 */
  chart: {
    pillars: { k: string; stem: string; branch: string; god: string; step: string; me: boolean }[];
    dayMaster: string;
    elements: { el: string; pct: number; mine: boolean }[];
    strength: string;
    season: string;
    useful: string;
    /** 이 주제에서 실제로 본 자리 */
    focus: string;
    /** 오늘 일진 한 줄 — 여기가 날마다 바뀐다 */
    today: string;
    /** 타고난 별 — 조견표로 대조한 것만 */
    sinsal: { k: string; at: string; v: string }[];
    /** 비어 있는 두 글자 */
    gongmang: string;
  };
  /** 이름이 실어 나르는 기운. 이름을 안 넣었으면 null */
  name: {
    letters: { ch: string; el: string }[];
    flow: string;
    /** 이름의 기운이 내 명식에 어떻게 닿는가 */
    verdict: string;
    fills: boolean;
  } | null;
  /** 오늘 글자가 내 글자와 어떻게 만나는가 — 날마다 바뀌는 자리 */
  todayMeet: {
    pillar: string;
    step: string;
    stepLine: string;
    /** 원국 각 자리와의 관계 */
    rows: { k: string; rel: string; v: string }[];
    /** 아무 관계도 없을 때 쓸 한 줄 */
    quiet: string | null;
    /** 내일은 무엇이 달라지는가. 실제로 내일 일진을 계산해서 적는다 */
    nextDay: string;
  };
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
  slots: { k: string; label: string; band: string; bandKey: Band; outer: string; good: string; care: string }[];
  /** 열두 달 전부. 막대를 눌렀을 때 그 달의 풀이를 바로 펴 준다 */
  monthSlots: { label: string; month: number; band: string; bandKey: Band; outer: string; good: string; care: string }[];
  /** 올해와 내년 */
  yearLines: { k: string; label: string; band: string; bandKey: Band; v: string }[];
  /** 이 답이 언제 다시 계산되는지 */
  refresh: string;
};

// 결과 화면에서 제일 큰 글자. 여기가 제일 구체적이어야 하는데 '구간' 이라는
// 말로 열 번 넘게 도망가고 있었다. '곧 돈이 도는 구간이 와요' 는 돈이 언제
// 어떻게 도는지 아무것도 말하지 않는다.
//
// 이 줄은 '지금이 어떤 상태인가' 를 말한다. 무엇을 할지는 바로 밑 줄이 말한다.
const HEADLINE: Record<ConcernKey, Record<Verdict, string>> = {
  work: {
    now: '지금 이직 문이 열려 있어요',
    soon: '조금 더 준비하고 움직이는 게 나아요',
    wait: '올해는 옮기기보다 자리를 지키는 해예요',
  },
  money: {
    now: '지금은 들어오는 돈이 나가는 돈보다 커요',
    soon: '두어 달 뒤에 수입이 도는 달이 와요',
    wait: '지금은 늘리기보다 새는 돈을 막을 때예요',
  },
  love: {
    now: '지금 연락하면 닿는 때예요',
    soon: '두어 달 뒤에 사람이 들어오는 달이 와요',
    wait: '지금은 상대보다 나를 먼저 채울 때예요',
  },
  people: {
    now: '지금은 내 편이 늘어나는 때예요',
    soon: '두어 달 뒤에 틀어진 사이가 풀려요',
    wait: '지금은 사람을 넓히기보다 정리할 때예요',
  },
  health: {
    now: '지금은 쉬면 바로 회복되는 몸이에요',
    soon: '두어 달 뒤에 몸이 올라와요',
    wait: '지금은 무리하면 바로 표시 나는 몸이에요',
  },
  mind: {
    now: '지금은 마음이 가벼워지는 때예요',
    soon: '두어 달 뒤에 마음이 풀려요',
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
      '큰 지출은 이 달 안에 몰아서 끝내요',
    ],
    soon: [
      '지금은 고정비부터 줄여요. 늘리는 건 그다음이에요',
      '나가는 돈을 한 달만 전부 적어봐요. 새는 곳이 바로 보여요',
      '계약이나 서명은 흐름이 좋은 달로 미뤄요',
    ],
    wait: [
      '새로 벌이는 건 미뤄요. 지금은 지키는 게 버는 거예요',
      '빌려주는 돈은 만들지 말아요. 돌려받기 어려운 달이에요',
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
      '끝난 사이라면 이번 달엔 연락하지 말아요',
    ],
  },
  people: {
    now: [
      '먼저 연락해요. 지금은 내가 여는 쪽이 이득이에요',
      '도움을 청해도 되는 달이에요. 혼자 안고 가지 말아요',
      '고마운 사람한테 표시를 해둬요. 오래 가요',
    ],
    soon: [
      '오해가 있으면 지금 풀지 말고 사실만 정리해둬요',
      '자리에 나가되 말은 줄여요. 듣는 쪽이 유리해요',
      '중요한 대화는 흐름이 좋은 달로 옮겨요',
    ],
    wait: [
      '새로 넓히지 말아요. 이 달은 걸러내는 쪽이에요',
      '부탁을 거절해도 되는 때예요. 다 받으면 내가 무너져요',
      '단톡방이나 모임을 한 개만 줄여도 숨이 트여요',
    ],
  },
  health: {
    now: [
      '미뤄둔 검진을 이번 달에 잡아요',
      '운동을 시작하기 좋은 때예요. 작게 시작해서 붙여요',
      '자는 시간을 먼저 고정해요. 나머지는 따라와요',
    ],
    soon: [
      '지금은 늘리지 말고 회복부터 해요',
      '카페인을 한 잔 줄이고 물을 한 잔 늘려요',
      '무리한 일정은 흐름이 좋은 달로 미뤄요',
    ],
    wait: [
      '이 달엔 밤을 새우지 말아요. 바로 표시가 나요',
      '아픈 데가 있으면 참지 말고 병원에 가요. 사주는 병을 못 봐요',
      '약속을 하나 줄이고 그 시간에 누워요',
    ],
  },
  mind: {
    now: [
      '하고 싶었던 말을 한 번 꺼내봐요. 지금은 잘 나가요',
      '기록을 남겨요. 지나고 나면 이 달이 기준이 돼요',
      '미뤄둔 결정을 이번에 하나만 끝내요',
    ],
    soon: [
      '지금은 답을 정하지 말고 적어만 둬요',
      '몸을 먼저 움직여요. 마음은 뒤따라와요',
      '믿는 사람 한 명한테만 말해요',
    ],
    wait: [
      '큰 결정은 미뤄요. 지금 내린 답은 나중에 바뀌어요',
      '잘 자고 잘 먹는 것만 해도 이 달은 충분해요',
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

// 결정 카드 둘째 줄. '이 달은 미는 것보다 지키는 쪽이 남아요' 처럼 고민을
// 안 보고 쓰면, 돈을 물어도 연애를 물어도 같은 말이 맨 위에 박힌다.
// 무엇을 밀고 무엇을 지키는 건지 그 고민의 말로 적는다.
const VERDICT_SUB: Record<ConcernKey, Record<Verdict, string>> = {
  work: {
    now: '지금 지원하고 움직여도 되는 때예요.',
    soon: '지금 옮기기보다, 가까운 달에 면접을 몰아 잡는 게 나아요.',
    wait: '나가는 것보다 지금 자리에서 연봉이나 맡는 범위를 올리는 쪽이 남아요.',
  },
  money: {
    now: '지금 넣고 늘려도 되는 때예요.',
    soon: '큰 지출과 계약은 흐름이 열리는 달로 미루세요.',
    wait: '더 벌기 전에 매달 빠져나가는 고정비부터 줄이는 쪽이 남아요.',
  },
  love: {
    now: '지금 먼저 연락하고 만나도 되는 때예요.',
    soon: '고백과 결정은 가까운 달로 미루는 게 나아요.',
    wait: '고백이나 정리 같은 결정을 미루고, 지금 오가는 연락만 이어가는 쪽이 남아요.',
  },
  people: {
    now: '지금 먼저 연락하고 풀어도 되는 때예요.',
    soon: '껄끄러운 이야기는 가까운 달에 꺼내는 게 나아요.',
    wait: '따지지 말고, 꼭 필요한 얘기만 하고 자리를 뜨는 쪽이 남아요.',
  },
  health: {
    now: '지금 시작하고 예약해도 되는 때예요.',
    soon: '큰 결심은 가까운 달로 미루고 지금은 잠부터 챙기세요.',
    wait: '운동이나 식단을 새로 시작하기보다, 자는 시간부터 지키는 쪽이 남아요.',
  },
  mind: {
    now: '지금 꺼내놓고 말해도 되는 때예요.',
    soon: '큰 결정은 가까운 달로 미루는 게 나아요.',
    wait: '억지로 기분을 바꾸려 하지 말고, 오늘 할 일을 줄이는 쪽이 남아요.',
  },
};

export function buildDeepRead(
  pillars: FourPillars,
  timing: TimingRead,
  concernKey: ConcernKey,
  optionKey: string | null,
  dateKey: string,
  userName?: string | null,
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
  const when: { k: string; v: string; band?: string; bandKey?: Band; act?: string }[] = [
    {
      k: '이번 달',
      v: timing.thisMonth.label,
      band: bandLabel(timing.thisMonth),
      bandKey: timing.thisMonth.band,
    },
    {
      k: '가장 좋은 때',
      v: away === 0 ? `${timing.bestMonth.label}, 바로 이번 달이에요` : `${timing.bestMonth.label}, ${away}달 뒤`,
      band: bandLabel(timing.bestMonth),
      bandKey: timing.bestMonth.band,
      act: act.best,
    },
    {
      k: '피할 때',
      v: `${timing.hardMonth.label}`,
      band: bandLabel(timing.hardMonth),
      bandKey: timing.hardMonth.band,
      act: act.hard,
    },
    {
      k: '좋은 해',
      v: `${timing.bestYear.label}`,
      band: bandLabel(timing.bestYear),
      bandKey: timing.bestYear.band,
      act: act.year,
    },
  ];

  const [cy, cm, cd] = dateKey.split('-').map((n) => Number.parseInt(n, 10));
  const todayPillar = computeFourPillars({ year: cy, month: cm, day: cd, hour: 12 }).day;
  const todayGod = tenGodOf(pillars.dayStem, todayPillar.stem) as TenGod;

  // 근거 줄은 이름만 대면 아무 뜻이 없다. 이름 옆에 그게 무슨 뜻인지 한 문장을 붙인다.
  //
  // 시기가 달라도 십성이 같으면 읽는 말도 같다. 줄을 따로 세우면 같은 문장이 두 번
  // 나가므로, 같은 기운이 겹친 층은 한 줄로 묶는다. 겹쳤다는 것 자체가 정보다.
  const layers: { k: string; god: TenGod | null }[] = [
    { k: '십 년', god: timing.daeunSlot ? timing.daeunSlot.tenGod : null },
    { k: '올해', god: timing.years[0].tenGod },
    { k: '이번 달', god: timing.thisMonth.tenGod },
    // 오늘 층은 '오늘 글자와 내 글자' 카드가 통째로 맡는다. 여기 또 넣으면
    // 같은 pull 이 한 화면에 두 번 나온다.

  ];
  const grouped = new Map<TenGod, string[]>();
  for (const l of layers) {
    if (!l.god) continue;
    grouped.set(l.god, [...(grouped.get(l.god) ?? []), l.k]);
  }
  const why: { k: string; v: string }[] = [
    // tagline 은 명식 카드의 '나를 뜻하는 글자' 줄이 이미 쓴다. 여기서 또 쓰면
    // 같은 문장이 한 화면에 두 번 나온다. 이 줄은 '왜 이렇게 봤나' 자리이므로
    // 그 성격이 어디서 드러나는지(shines)를 적는다.
    { k: '내 글자', v: `${dm.name}이에요. ${dm.shines.replace(/\.?$/, '.')}` },
    ...[...grouped.entries()].map(([god, ks]) => ({
      k: ks.join(', '),
      v:
        ks.length > 1
          // 여기가 pull 의 집이다. 다른 자리에서 pull 을 또 쓰면 한 화면에
          // 같은 문장이 두 번 나온다. 층마다 말하는 자리는 하나씩만 둔다.
          //   십 년 → 십 년 카드 · 올해 → 올해내년 줄 · 이번 달 → 열두 달 차트
          //   오늘 → 오늘 글자 카드 · 왜 그렇게 읽었나 → 이 줄
          ? `${TEN_GOD_KO[god]}이 겹쳐요. ${CONCERN_GOD[concernKey][god].pull} 쪽으로 읽었어요. 층이 겹치면 그 방향이 더 또렷해져요.`
          : `${TEN_GOD_KO[god]}이 들어와요. ${CONCERN_GOD[concernKey][god].pull} 쪽으로 읽었어요.`,
    })),
    ...(timing.daeunSlot
      ? []
      : [{ k: '십 년', v: '아직 첫 십 년이 시작되기 전이라 태어난 자리를 그대로 봐요.' }]),
  ];

  // 명식을 그대로 펼친다. 용어가 나오면 바로 옆에 뜻을 붙인다.
  const prof = analyzeSaju(pillars);
  const chartPillars = [
    { k: '태어난 해', p: pillars.year, me: false },
    { k: '태어난 달', p: pillars.month, me: false },
    { k: '태어난 날', p: pillars.day, me: true },
    ...(pillars.hour ? [{ k: '태어난 시각', p: pillars.hour, me: false }] : []),
  ].map(({ k, p, me }) => ({
    k,
    stem: STEMS[p.stem].kor,
    branch: BRANCHES[p.branch].kor,
    god: TEN_GOD_KO[tenGodOf(pillars.dayStem, mainHiddenStem(p.branch)) as TenGod],
    step: UNSEONG_KO[unseongOf(pillars.dayStem, p.branch)].word,
    me,
  }));

  const myEl = pillars.dayMaster.el;
  const elements = (Object.keys(prof.balance) as Element[]).map((el) => ({
    el: ELEMENT_KO[el],
    pct: Math.round(prof.balance[el] * 100),
    mine: el === myEl,
  }));

  // 이 주제에서 실제로 본 자리 — 원국 여덟 글자 중 몇 개가 그 자리인지 센다
  const favorNames = timing.favor.good.map((g) => FAVOR_WORD[g]).join(', ');
  const focusCount = prof.gods.filter((g) => timing.favor.good.includes(GOD_GROUP_OF[g.god])).length;
  const focus =
    focusCount > 0
      ? `${withJosa(concern.label, '은는')} ${favorNames}로 봐요. 태어난 여덟 글자 중 ${focusCount}개가 거기 걸려 있어서 바탕은 ${focusCount >= 3 ? '두꺼운' : '얇은'} 편이에요.`
      : `${withJosa(concern.label, '은는')} ${favorNames}로 봐요. 태어난 글자에는 그 자리가 없어서, 해와 달이 들어올 때 열리는 구조예요.`;

  // pull 은 근거 줄의 집이다. 여기서 또 쓰면 오늘 기운과 같은 기운이 다른
  // 층에 있을 때 같은 문장이 두 번 나온다. line 은 이제 여기가 집이다.
  const chartToday = `내 글자에 대면 ${TEN_GOD_KO[todayGod]}이에요. ${CONCERN_GOD[concernKey][todayGod].line}`;

  // 조견표로 대조만 하는 것들. 해석을 고르지 않으니 누가 계산해도 같다.
  const stars = sinsalOf(pillars).map((x) => ({
    k: SINSAL_KO[x.key].word,
    at: x.at,
    v: SINSAL_KO[x.key].line,
  }));
  const [g1, g2] = gongmangOf(pillars.day.ganzhi);
  const gongmang = `${withJosa(BRANCHES[g1].kor, '과와')} ${withJosa(BRANCHES[g2].kor, '이가')} 비어 있어요. 이 두 글자가 들어오는 해와 달에는 손에 잡히는 결과가 덜 남아요.`;

  const chart = {
    pillars: chartPillars,
    dayMaster: `${pillars.dayMaster.kor}, 다섯 기운 중 ${ELEMENT_KO[myEl]}에 속해요. ${dm.tagline.replace(/\.?$/, '.')}`,
    elements,
    strength:
      prof.strength === 'strong'
        ? '내 힘이 많은 편이에요. 밀고 나가는 쪽이 맞고, 도움을 더 받으면 오히려 무거워져요.'
        : '내 힘을 받아 쓰는 편이에요. 혼자 밀기보다 배우고 기대는 쪽이 결과가 좋아요.',
    season: prof.hasSeasonalSupport
      ? '태어난 달이 나를 돕는 자리예요. 계절이 내 편이라 기본 체력이 있는 구조예요.'
      : '태어난 달이 나를 돕지는 않아요. 그래서 때를 고르는 게 더 중요해져요.',
    useful: `${ELEMENT_KO[prof.usefulElement]} 기운이 들어올 때 치우침이 풀려요.`,
    focus,
    today: chartToday,
    sinsal: stars,
    gongmang,
  };

  // 이름도 계산에 들어간다. 한글 소리를 다섯 기운으로 갈라, 그 기운이 명식에서
  // 모자란 자리를 채우는지 본다. 한자를 안 받으므로 획수는 세지 않는다.
  const sound = userName ? readNameSound(userName) : null;
  const nameRead = sound
    ? (() => {
        // 실린 기운과 배열을 따로 말하면 '되돌려줘요' 뒤에 '실어 나르지 않아요' 가
        // 붙는다. 한 문장으로 묶어야 앞뒤가 안 어긋난다.
        const fills = sound.elements.includes(prof.usefulElement);
        const smooth = sound.flow === 'smooth';
        const blocked = sound.flow === 'blocked';
        const need = ELEMENT_KO[prof.usefulElement];
        let verdict: string;
        if (fills && smooth) {
          verdict = `이름이 ${need} 기운을 싣고, 소리도 앞에서 뒤로 순하게 흘러요. 명식에서 치우친 자리를 이름이 제대로 되돌려주는 배열이에요.`;
        } else if (fills && blocked) {
          verdict = `이름에 ${need} 기운은 들어 있어요. 다만 글자끼리 부딪히는 배열이라, 기운이 닿기는 해도 세게 밀어주지는 않아요.`;
        } else if (fills) {
          verdict = `이름이 ${need} 기운을 싣고 있어요. 배열은 순한 자리와 부딪히는 자리가 섞여 있어 무난한 쪽이에요.`;
        } else if (smooth) {
          verdict = `이름 소리는 순하게 이어져요. 다만 명식이 아쉬워하는 ${need} 기운은 담겨 있지 않아, 이름이 채워주는 역할은 아니에요.`;
        } else {
          verdict = `이름은 ${ELEMENT_KO[sound.lead]} 기운을 가장 두껍게 실어요. 명식이 아쉬워하는 ${need} 쪽은 아니라, 이름으로 뭘 바꾸려 하기보다 때를 고르는 쪽이 빨라요.`;
        }
        return {
          letters: sound.letters.map((l) => ({ ch: l.ch, el: ELEMENT_KO[l.el] })),
          flow: FLOW_KO[sound.flow],
          verdict,
          fills,
        };
      })()
    : null;

  // 오늘 글자가 내 글자와 어떻게 만나는가. 매일 바뀌는 자리라 다시 볼 이유가 된다.
  const meetSpots: { k: string; b: number }[] = [
    { k: '태어난 해', b: pillars.year.branch },
    { k: '태어난 달', b: pillars.month.branch },
    { k: '태어난 날', b: pillars.day.branch },
    ...(pillars.hour ? [{ k: '태어난 시각', b: pillars.hour.branch }] : []),
  ];
  // 한 자리에 관계가 여럿 걸릴 수 있다. 인신(寅申)은 충이면서 형이라 같은 자리가
  // 두 번 잡힌다. 줄을 따로 세우면 '태어난 달과 부딪혀요' 밑에 '태어난 달과
  // 어긋나요' 가 또 붙어 화면에 같은 자리가 쌓인다. 한 자리는 한 줄로 묶는다.
  const meetRows: { k: string; rel: string; v: string }[] = [];
  for (const spot of meetSpots) {
    const rels = branchRelations(todayPillar.branch, spot.b);
    if (rels.length === 0) continue;
    meetRows.push({
      k: withJosa(spot.k, '과와'),
      rel: rels.map((r) => RELATION_KO[r].word).join(', '),
      v: rels.map((r) => RELATION_KO[r].line).join(' '),
    });
  }
  // 내일 한 줄.
  //
  // 왜 넣나: 이 앱의 답은 실제로 매일 바뀐다 (일진이 점수의 10% 고, 오늘 층이
  // 따로 읽힌다). 그런데 그 사실을 아무 데서도 말하지 않아서, 한 번 보고 끝내는
  // 화면이 됐다. 다시 올 이유를 만들어야 한다.
  //
  // 무엇을 넣지 않나: '내일 대박' 같은 미끼는 안 쓴다. 지어낸 기대를 걸면
  // 다음 날 한 번 속고 다시는 안 온다. 내일 일진을 실제로 계산해서, 오늘과
  // 무엇이 달라지는지만 적는다. 틀릴 수 없는 말이다.
  const tomorrow = new Date(Date.UTC(cy, cm - 1, cd) + 86400000);
  const tomorrowPillar = computeFourPillars({
    year: tomorrow.getUTCFullYear(),
    month: tomorrow.getUTCMonth() + 1,
    day: tomorrow.getUTCDate(),
    hour: 12,
  }).day;
  const tomorrowGod = tenGodOf(pillars.dayStem, tomorrowPillar.stem) as TenGod;
  const tomorrowRels = meetSpots.flatMap((spot) =>
    branchRelations(tomorrowPillar.branch, spot.b).length > 0 ? [spot.k] : [],
  );
  const nextDay =
    tomorrowGod === todayGod && tomorrowRels.length === meetRows.length
      ? '내일도 결이 비슷한 날이라, 오늘 잡아둔 것이 그대로 이어져요.'
      : tomorrowGod === todayGod
        ? `내일은 같은 기운이 오는데 내 글자와 닿는 자리가 달라져요. 오늘과 조금 다른 답이 나와요.`
        : `내일은 ${CONCERN_GOD[concernKey][tomorrowGod].pull} 쪽으로 기울어요. 오늘과 다른 답이 나와요.`;

  const todayStep = unseongOf(pillars.dayStem, todayPillar.branch);
  const todayMeet = {
    pillar: `${STEMS[todayPillar.stem].kor}${BRANCHES[todayPillar.branch].kor}`,
    step: UNSEONG_KO[todayStep].word,
    stepLine: UNSEONG_KO[todayStep].line,
    rows: meetRows,
    quiet:
      meetRows.length === 0
        ? '오늘 글자는 내 여덟 글자 중 어느 것과도 엮이지 않아요. 흔들림이 적은 날이라 하던 대로 가면 돼요.'
        : null,
    nextDay,
  };

  const cur = timing.daeun.current;
  const left = timing.daeun.yearsToNext;
  // 대운 이름(기묘 같은 것)을 그대로 쓰면 아무 뜻이 없다. 무슨 기운인지로 말한다.
  const daeunLine = cur
    ? `${cur.startAge}세부터 ${cur.endAge}세까지가 지금 지나는 십 년이에요.` +
      (timing.daeunSlot
        // 예전에는 고민을 안 보는 GOD_SCALE 문장에 고민별 line 을 덧붙여
        // 구체성을 벌충했다. daeun 이 고민을 보고 쓰였으니 line 은 뺀다.
        // 안 빼면 '빌려주는 돈은 못 돌아오기 쉬워요' 가 한 문단에 두 번 나온다.
        ? ` ${CONCERN_GOD[concernKey][timing.daeunSlot.tenGod].daeun}`
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
    // good/care 는 달 단위 문장이다. 여기에 그대로 쓰면 그 해와 같은 기운을 가진
    // 달이 아래 차트에 뜰 때 글자 하나까지 같은 문장이 두 번 나온다.
    {
      k: '유리하게 쓰는 법',
      thisYear: CONCERN_GOD[concernKey][y0.tenGod].yearGood,
      nextYear: CONCERN_GOD[concernKey][y1.tenGod].yearGood,
    },
    {
      k: '조심할 것',
      thisYear: CONCERN_GOD[concernKey][y0.branchGod].yearCare,
      nextYear: CONCERN_GOD[concernKey][y1.branchGod].yearCare,
    },
  ];
  const yearGap =
    y0.tenGod === y1.tenGod
      ? `올해와 내년의 결이 비슷해요. 흐름이 이어져서 올해 잡아둔 것이 내년에 그대로 굴러가요.`
      : `올해가 ${GOD_KEYWORD[y0.tenGod]}에 가까운 해라면, 내년은 ${GOD_KEYWORD[y1.tenGod]}에 가까운 해예요.`;

  // 달 한 덩이 — 겉(천간)과 속(지지)을 따로 대야 열두 달이 전부 다른 얼굴이 된다
  const slotBlock = (k: string, slot: TimingSlot) => ({
    k,
    label: slot.label,
    band: bandLabel(slot),
    bandKey: slot.band,
    // GOD_SCALE 은 고민을 안 본다. 돈을 물었는데 '안으로 파고드는 달'
    // 같은 문장이 나오던 자리다. 고민별로 쓴 문장을 쓴다.
    outer: CONCERN_GOD[concernKey][slot.tenGod].month,
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
    band: bandLabel(m),
    bandKey: m.band,
    outer: CONCERN_GOD[concernKey][m.tenGod].month,
    good: CONCERN_GOD[concernKey][m.tenGod].good,
    care: CONCERN_GOD[concernKey][m.branchGod].care,
  }));

  const yearLines = timing.years.slice(0, 2).map((y, i) => ({
    k: i === 0 ? '올해' : '내년',
    label: y.label,
    band: bandLabel(y),
    bandKey: y.band,
    // year 가 고민을 보고 쓰였으니 line 은 뺀다. 안 빼면 한 줄 안에서
    // '연봉과 조건을 따지기' 가 두 번 나온다. 십 년 줄과 같은 이유다.
    v: CONCERN_GOD[concernKey][y.tenGod].year,
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
    // month 를 쓰면 아래 '앞으로 열두 달'의 이번 달 칸과 글자 하나까지 같은
    // 문장이 된다. 결정 카드는 같은 기운을 '무엇을 정할 때인가'로 읽는다.
    // 큰 글씨와 이 줄은 둘 다 판정에서 나와야 한 목소리가 된다.
    //
    // 예전에는 이 줄 앞에 이번 달 기운(decide)을 붙였는데, 그건 다른 층에서
    // 나온 말이라 큰 글씨와 반대로 갈 수 있었다. 실제로 연애에서
    //   큰 글씨  지금은 상대보다 나를 먼저 채울 때예요
    //   이 줄    상대를 먼저 챙겨줄 때예요
    // 가 붙어 있었다. 정반대다. decide 는 아래 행동 칸으로 옮겼다.
    sub: VERDICT_SUB[concernKey][verdict],
    /** 이번 달 기운으로 읽은 한 줄. 행동 바로 위에 붙는다 */
    monthWhy: CONCERN_GOD[concernKey][timing.thisMonth.tenGod].decide,
    slots,
    monthSlots,
    yearLines,
    refresh: REFRESH_NOTE,
    situationLine: option?.line ?? '',
    when,
    why,
    actions: actions.slice(0, 3),
    caution: CAUTION[concernKey],
    chart,
    name: nameRead,
    todayMeet,
    daeunLine,
    decade,
    yearCompare,
    yearGap,
    basis: concern.basis,
  };
}
