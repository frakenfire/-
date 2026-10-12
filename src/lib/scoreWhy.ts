import type { DeepRead } from './deepRead.ts';
import type { Band } from './timing.ts';
import type { IconName } from '../components/Icon.tsx';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { withJosa } from './josa.ts';
import { CONCERN_SUB, CONCERN_TODAY, ELEMENT_TODAY, LUCK_BAND, LUCK_NAME, NAME_TODAY, NATAL_TODAY } from '../data/scoreWhyCopy.ts';

/** 항목 아래 작은 칩. 이름 글자(김 · 나무)나 다섯 요소(불 38%) */
export type Chip = { t: string; v: string; mark?: string };

export type ScoreWhy = {
  /** '오늘의 금전운' 큰 점수 덩이 */
  luck?: { title: string; score: number; band: Band; label: string; head: string; act: string };
  head: string;
  /** 점수표 아래 풀이 */
  text: string;
  /** 점수를 이루는 다섯 자리. 막대로 그린다 */
  parts?: { k: string; sub: string; score: number; band: string }[];
  /** 타고난 사주, 다섯 요소, 이름, 고민에서 본 것 */
  rows?: { k: string; sub: string; icon: IconName; head: string; body: string; chips?: Chip[]; tag?: { k: string; v: string }; act?: string }[];
};

// 맨 위 점수가 왜 그 점수인지. 사장님이 붙여 준 본보기(2026-10-12)처럼 덩이마다
// 오늘 무슨 날인지 → 사주에서 본 사실 → 오늘 생기는 장면 → 해볼 행동 하나.
// 글만 많다는 말을 듣고(같은 날) 사실은 글 대신 큰 숫자, 막대, 칩으로 보여주고
// 글은 첫 줄과 장면 한두 줄만 남겼다. 해볼 행동은 따로 상자에 담는다.
export function scoreWhyOf(read: DeepRead, concernKey: ConcernKey, concernLabel: string): ScoreWhy {
  const total = read.score.total;
  const head = `${total}점은 이렇게 나왔어요`;
  const parts = read.score.parts.map((p) => ({ k: p.k === '타고난 성향' ? '타고난 사주' : p.k, sub: p.label, score: p.score, band: p.band }));
  const natal = parts.find((p) => p.k === '타고난 사주');
  const today = parts.find((p) => p.k === '오늘');
  if (!natal || !today) return { head, text: read.scoreLine.split(/(?<=[.])\s+/)[0] };
  const g = read.todayGroup;

  const band = read.todayAsk.band;
  const lb = LUCK_BAND[band];
  const luck = { title: `오늘의 ${LUCK_NAME[concernKey]}`, score: total, band, label: lb.label, head: lb.head, act: lb.act };

  const top = parts.reduce((a, b) => (b.score > a.score ? b : a));
  const low = parts.reduce((a, b) => (b.score < a.score ? b : a));
  const order = (k: string) => parts.findIndex((p) => p.k === k);
  const text = [
    `${top.k} 점수가 ${top.score}점으로 가장 높고, ${low.k} 점수가 ${low.score}점으로 가장 낮아요.`,
    top.k === '오늘'
      ? '오늘 하루가 가장 든든해서, 다른 날보다 오늘 움직이는 편이 나아요.'
      : order(top.k) > order(low.k)
        ? `${top.k}의 좋은 점수가 ${low.k}의 낮은 점수를 받쳐주고 있어요.`
        : `바탕이 되는 ${top.k} 점수가 높아서, ${low.k} 점수가 낮아도 크게 흔들리지는 않아요.`,
  ].join(' ');

  const rows: NonNullable<ScoreWhy['rows']> = [];
  const dp = read.chart.dayPillar;
  const nt = NATAL_TODAY[g];
  rows.push({
    k: '타고난 사주',
    sub: '오늘 드러나는 내 성향',
    icon: 'star',
    head: nt.head,
    tag: dp ? { k: '원래 나는', v: dp.nick } : undefined,
    body: [read.chart.strength.split(/(?<=[.])\s+/)[0], nt.turn].join(' '),
    act: nt.act,
  });
  const el = elementRow(read, concernKey);
  if (el) rows.push(el);
  const nm = nameRow(read);
  if (nm) rows.push(nm);
  const ct = CONCERN_TODAY[concernKey][g];
  rows.push({ k: `${concernLabel}에서 본 것`, sub: CONCERN_SUB[concernKey], icon: findConcern(concernKey).icon, head: ct.head, body: ct.scene, act: ct.act });
  return { luck, head, text, parts, rows };
}

// 나무는 불을, 불은 흙을, 흙은 쇠를, 쇠는 물을, 물은 나무를 살린다. 누르는 쪽은 CTRL.
const GEN: Record<string, string> = { 나무: '불', 불: '흙', 흙: '쇠', 쇠: '물', 물: '나무' };
const CTRL: Record<string, string> = { 나무: '흙', 흙: '물', 물: '불', 불: '쇠', 쇠: '나무' };

function elementRow(read: DeepRead, concernKey: ConcernKey): NonNullable<ScoreWhy['rows']>[number] | null {
  const els = read.chart.elements;
  if (!els.length) return null;
  const most = els.reduce((a, b) => (b.pct > a.pct ? b : a));
  const least = els.reduce((a, b) => (b.pct < a.pct ? b : a));
  const today = read.chart.todayEl;
  const need = read.chart.usefulEl;
  const lack = need === least.el ? '모자란' : '필요한';
  let head: string;
  let meet: string;
  let help = true;
  if (today === need) {
    head = `오늘은 내게 ${lack} 요소가 채워지는 날이에요.`;
    meet = `오늘 날이 바로 ${need}에 속해서, ${lack} 부분을 오늘 하루가 채워 줘요.`;
  } else if (GEN[today] === need) {
    head = `오늘은 내게 ${lack} 요소를 오늘 날이 도와주는 날이에요.`;
    meet = `오늘 날은 ${today}에 속하고, ${withJosa(today, '은는')} ${withJosa(need, '을를')} 살려주는 요소예요.`;
  } else if (CTRL[today] === need) {
    help = false;
    head = `오늘은 내게 ${lack} 요소가 눌리기 쉬운 날이에요.`;
    meet = `오늘 날은 ${today}에 속하고, ${withJosa(today, '은는')} ${withJosa(need, '을를')} 누르는 요소라 평소보다 쉽게 지칠 수 있어요.`;
  } else if (today === most.el) {
    help = false;
    head = '오늘은 이미 많은 요소가 한 번 더 더해지는 날이에요.';
    meet = `오늘 날도 ${today}에 속해서, 원래 강한 쪽으로 한 번 더 기울기 쉬워요.`;
  } else {
    head = '오늘은 내 사주와 크게 부딪히지 않는 날이에요.';
    meet = `오늘 날은 ${today}에 속하고, 내 사주의 많은 쪽과도 모자란 쪽과도 크게 부딪히지 않아요.`;
  }
  const t = ELEMENT_TODAY[concernKey][help ? 'help' : 'care'];
  const chips: Chip[] = [...els]
    .sort((a, b) => b.pct - a.pct)
    .map((e) => ({ t: e.el, v: `${e.pct}%`, mark: e.el === today ? '오늘' : e.el === need ? (lack === '모자란' ? '부족' : '필요') : undefined }));
  return { k: '다섯 요소', sub: '오늘 나와 만나는 요소', icon: 'leaf', head, chips, body: [meet, t.link].join(' '), act: t.act };
}

function nameRow(read: DeepRead): NonNullable<ScoreWhy['rows']>[number] | null {
  const nm = read.name;
  if (!nm || !nm.letters.length) return null;
  const need = read.chart.usefulEl;
  const needPct = read.chart.elements.find((e) => e.el === need)?.pct ?? 0;
  const count = new Map<string, number>();
  for (const l of nm.letters) count.set(l.el, (count.get(l.el) ?? 0) + 1);
  const lead = [...count.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const chips: Chip[] = nm.letters.map((l) => ({ t: l.ch, v: l.el, mark: l.el === need ? '채움' : undefined }));
  const head = nm.fills
    ? nm.flow.startsWith('소리가 앞에서 뒤로 순하게')
      ? '내 이름은 사주의 빈자리를 자연스럽게 채워 주는 이름이에요.'
      : '내 이름은 사주에 모자란 부분을 조금 채워 주는 이름이에요.'
    : '내 이름은 사주와 다른 쪽에 힘을 보태는 이름이에요.';
  const fact = nm.fills
    ? `타고난 사주에는 ${withJosa(need, '이가')} ${needPct === 0 ? '드러나지 않지만' : `${needPct}%로 적지만`}, 이름 소리에는 ${withJosa(need, '이가')} 들어 있어요.`
    : `이름 소리에는 ${withJosa(lead, '이가')} 가장 많고, 사주에 필요한 ${withJosa(need, '은는')} 없어요.`;
  return { k: '이름', sub: '오늘 내 이름이 전하는 말', icon: 'sparkle', head, chips, body: [fact, NAME_TODAY[read.todayGroup]].join(' ') };
}
