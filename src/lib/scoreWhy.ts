import type { DeepRead } from './deepRead.ts';
import type { ConcernKey } from '../data/concerns.ts';
import { withJosa } from './josa.ts';
import { CONCERN_SUB, CONCERN_TODAY, ELEMENT_TODAY, LUCK_BAND, LUCK_NAME, NAME_TODAY, NATAL_TODAY } from '../data/scoreWhyCopy.ts';

export type ScoreWhy = {
  /** '오늘의 금전운 · 68점' 덩이 */
  luck?: { head: string; text: string };
  head: string;
  /** 점수표 아래 풀이 */
  text: string;
  /** 점수를 이루는 다섯 자리. 막대로 그린다 */
  parts?: { k: string; sub: string; score: number; band: string }[];
  /** 타고난 사주, 다섯 요소, 이름, 고민에서 본 것 */
  rows?: { k: string; sub: string; v: string }[];
};

// 맨 위 점수가 왜 그 점수인지. 사장님이 붙여 준 본보기(2026-10-12)처럼 덩이마다
// 오늘 무슨 날인지 → 사주에서 본 사실 → 오늘 이 고민에서 생기는 장면 → 해볼 행동 하나.
// 전에는 '다섯 자리를 정해진 비율로 더했고' 같은 계산 설명과 사실 나열뿐이라 한글이
// 어색하고 무슨 말인지 모르겠다는 말을 들었다.
export function scoreWhyOf(read: DeepRead, concernKey: ConcernKey, concernLabel: string): ScoreWhy {
  const total = read.score.total;
  const head = `${total}점은 이렇게 나왔어요`;
  const parts = read.score.parts.map((p) => ({ k: p.k === '타고난 성향' ? '타고난 사주' : p.k, sub: p.label, score: p.score, band: p.band }));
  const natal = parts.find((p) => p.k === '타고난 사주');
  const today = parts.find((p) => p.k === '오늘');
  if (!natal || !today) return { head, text: read.scoreLine.split(/(?<=[.])\s+/)[0] };
  const g = read.todayGroup;

  // 1. 오늘의 금전운 · 68점
  const lb = LUCK_BAND[read.todayAsk.band];
  const mid = parts.filter((p) => p.k === '올해' || p.k === '이번 달' || p.k === '지금 지나는 십 년');
  const lo = mid.reduce((a, b) => (b.score < a.score ? b : a));
  const hi = mid.reduce((a, b) => (b.score > a.score ? b : a));
  const gap = today.score - natal.score;
  const luckName = LUCK_NAME[concernKey];
  const luck = {
    head: `오늘의 ${luckName} · ${total}점`,
    text: [
      lb.head,
      `오늘의 ${withJosa(luckName, '은는')} ${total}점이에요.`,
      hi.score - lo.score >= 8
        ? `${lo.k} 점수는 ${lo.score}점으로 낮은 편이지만, ${withJosa(hi.k, '은는')} ${hi.score}점으로 더 높게 나와요.`
        : `${withJosa(lo.k, '과와')} ${hi.k} 점수가 ${lo.score}점, ${hi.score}점으로 비슷해요.`,
      gap >= 5
        ? `오늘 하루 점수는 ${today.score}점으로, 타고난 사주 점수보다 ${gap}점 높아요.`
        : gap <= -5
          ? `오늘 하루 점수는 ${today.score}점으로, 타고난 사주 점수보다 ${-gap}점 낮아요.`
          : `오늘 하루 점수는 ${today.score}점으로, 타고난 사주 점수와 비슷해요.`,
      lb.care,
      lb.act,
    ].join(' '),
  };

  // 2. 68점은 이렇게 나왔어요 - 표 아래 풀이
  const top = parts.reduce((a, b) => (b.score > a.score ? b : a));
  const low = parts.reduce((a, b) => (b.score < a.score ? b : a));
  const order = (k: string) => parts.findIndex((p) => p.k === k);
  const text = [
    `다섯 자리 가운데 ${top.k} 점수가 ${top.score}점으로 가장 높고, ${low.k} 점수가 ${low.score}점으로 가장 낮아요.`,
    top.k === '오늘'
      ? '오늘 하루가 가장 든든해서, 다른 날보다 오늘 움직이는 편이 나아요.'
      : order(top.k) > order(low.k)
        ? `${top.k}의 좋은 점수가 ${low.k}의 낮은 점수를 받쳐주는 모습이에요.`
        : `바탕이 되는 ${top.k} 점수가 높아서, ${low.k} 점수가 낮아도 크게 흔들리지는 않아요.`,
    `이 다섯 점수를 정해진 비율로 더해 ${total}점이 나왔어요.`,
  ].join(' ');

  // 3. 항목별 풀이
  const rows: { k: string; sub: string; v: string }[] = [];
  const dp = read.chart.dayPillar;
  const nt = NATAL_TODAY[g];
  rows.push({
    k: '타고난 사주',
    sub: '오늘 드러나는 내 성향',
    v: [nt.head, dp ? `원래 ${dp.nick}이에요.` : '', read.chart.strength, nt.turn, nt.act].filter(Boolean).join(' '),
  });
  const el = elementRow(read, concernKey);
  if (el) rows.push({ k: '다섯 요소', sub: '오늘 나와 만나는 요소', v: el });
  const nm = nameRow(read);
  if (nm) rows.push({ k: '이름', sub: '오늘 내 이름이 전하는 말', v: nm });
  const ct = CONCERN_TODAY[concernKey][g];
  rows.push({
    k: `${concernLabel}에서 본 것`,
    sub: CONCERN_SUB[concernKey],
    v: [ct.head, read.chart.focus, ct.scene, ct.act].join(' '),
  });
  return { luck, head, text, parts, rows };
}

// 나무는 불을, 불은 흙을, 흙은 쇠를, 쇠는 물을, 물은 나무를 살린다. 누르는 쪽은 CTRL.
const GEN: Record<string, string> = { 나무: '불', 불: '흙', 흙: '쇠', 쇠: '물', 물: '나무' };
const CTRL: Record<string, string> = { 나무: '흙', 흙: '물', 물: '불', 불: '쇠', 쇠: '나무' };

function elementRow(read: DeepRead, concernKey: ConcernKey): string {
  const els = read.chart.elements;
  if (!els.length) return '';
  const most = els.reduce((a, b) => (b.pct > a.pct ? b : a));
  const least = els.reduce((a, b) => (b.pct < a.pct ? b : a));
  const today = read.chart.todayEl;
  const need = read.chart.usefulEl;
  const lack = need === least.el ? '모자란' : '필요한';
  const facts = [
    `내 사주를 다섯 요소로 나눠 보면 ${withJosa(most.el, '이가')} ${most.pct}%로 가장 많고, ${withJosa(least.el, '은는')} ${least.pct}%로 가장 적어요.`,
    need === least.el ? '' : `그중 내게 가장 필요한 요소는 ${need}예요.`,
  ];
  let head: string;
  let meet: string;
  let help = true;
  if (today === need) {
    head = `오늘은 내게 ${lack} 요소가 채워지는 날이에요.`;
    meet = `오늘 날이 바로 ${need}에 속해서, ${lack} 부분을 오늘 하루가 채워 줘요.`;
  } else if (GEN[today] === need) {
    head = `오늘은 내게 ${lack} 요소를 오늘 날이 도와주는 날이에요.`;
    meet = `오늘 날은 ${today}에 속하는데, ${withJosa(today, '은는')} ${withJosa(need, '을를')} 살려주는 요소라서 ${lack} ${need} 쪽에 힘이 실리는 날로 봐요.`;
  } else if (CTRL[today] === need) {
    help = false;
    head = `오늘은 내게 ${lack} 요소가 눌리기 쉬운 날이에요.`;
    meet = `오늘 날은 ${today}에 속하는데, ${withJosa(today, '은는')} ${withJosa(need, '을를')} 누르는 요소라서 평소보다 쉽게 지칠 수 있어요.`;
  } else if (today === most.el) {
    help = false;
    head = '오늘은 이미 많은 요소가 한 번 더 더해지는 날이에요.';
    meet = `오늘 날도 ${today}에 속해서, 원래 강한 쪽으로 한 번 더 기울기 쉬워요.`;
  } else {
    head = '오늘은 내 사주와 크게 부딪히지 않는 날이에요.';
    meet = `오늘 날은 ${today}에 속하는데, 내 사주의 많은 쪽과도 모자란 쪽과도 크게 부딪히지 않아요.`;
  }
  const t = ELEMENT_TODAY[concernKey][help ? 'help' : 'care'];
  return [head, ...facts, meet, t.link, t.act].filter(Boolean).join(' ');
}

function nameRow(read: DeepRead): string {
  const nm = read.name;
  if (!nm || !nm.letters.length) return '';
  const need = read.chart.usefulEl;
  const needPct = read.chart.elements.find((e) => e.el === need)?.pct ?? 0;
  const sounds = nm.letters.map((l) => `'${l.ch}'${withJosa(l.ch, '은는').slice(l.ch.length)} ${l.el}`).join(', ');
  const count = new Map<string, number>();
  for (const l of nm.letters) count.set(l.el, (count.get(l.el) ?? 0) + 1);
  const lead = [...count.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const lines = nm.fills
    ? [
        nm.flow.startsWith('소리가 앞에서 뒤로 순하게')
          ? '내 이름은 사주의 빈자리를 자연스럽게 채워 주는 이름이에요.'
          : '내 이름은 사주에 모자란 부분을 조금 채워 주는 이름이에요.',
        `이름 소리를 다섯 요소로 나누면 ${sounds}예요.`,
        `타고난 사주에는 ${withJosa(need, '이가')} ${needPct === 0 ? '드러나지 않지만' : `${needPct}%로 적지만`}, 이름 소리에는 ${withJosa(need, '이가')} 들어 있어요.`,
        '사주에 모자란 부분을 이름이 메워 주는 모습이에요.',
      ]
    : [
        '내 이름은 사주와 다른 쪽에 힘을 보태는 이름이에요.',
        `이름 소리를 다섯 요소로 나누면 ${sounds}예요.`,
        `이름 소리에는 ${withJosa(lead, '이가')} 가장 많고, 사주에 필요한 ${withJosa(need, '은는')} 없어요.`,
        '그래서 이름보다 오늘 무엇을 하느냐가 더 중요해요.',
      ];
  return [...lines, NAME_TODAY[read.todayGroup]].join(' ');
}
