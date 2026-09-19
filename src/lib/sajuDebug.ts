import { computeFourPillars, boundaryNotice, type BirthInput } from './fourPillars.ts';
import { analyzeSaju } from './tenGods.ts';
import { computeDaeun, type Gender } from './daeun.ts';
import { computeTiming } from './timing.ts';
import { computeConcernScore } from './concernScore.ts';
import { buildDeepRead } from './deepRead.ts';
import { unseongOf, sinsalOf, gongmangOf } from './sinsal.ts';
import { readNameSound } from './nameSound.ts';
import { RULESET, rulesetLabel } from './sajuRuleset.ts';
import { ELEMENT_KO, BRANCHES } from './saju.ts';
import type { ConcernKey } from '../data/concerns.ts';

// 한 사람의 계산을 처음부터 끝까지 단계별로 펼친다.
//
// 결과가 이상할 때 'AI 가 이상했다' 로 끝나면 고칠 수 없다. 입력에서 문구까지
// 어느 칸에서 어긋났는지 짚을 수 있어야 한다.
//
// 화면에는 절대 안 나간다. 개발자가 콘솔이나 테스트에서 부르는 용도다.

export type DebugInput = {
  birth: BirthInput;
  gender: Gender;
  name?: string | null;
  concern: ConcernKey;
  option?: string | null;
  dateKey: string;
  now?: Date;
};

/** 단계마다 한 덩이. 어느 칸이 틀렸는지 눈으로 짚을 수 있게 한다. */
export type DebugStage = { step: string; lines: string[] };

export function debugSaju(d: DebugInput): DebugStage[] {
  const now = d.now ?? new Date(`${d.dateKey}T12:00:00+09:00`);
  const out: DebugStage[] = [];

  out.push({
    step: '0. RULESET',
    lines: [rulesetLabel(), `lunarInput=${RULESET.lunarInput}`],
  });

  out.push({
    step: '1. INPUT',
    lines: [
      `${d.birth.year}-${d.birth.month}-${d.birth.day} ${d.birth.hour ?? '시각미상'}:${d.birth.minute ?? 0}`,
      `성별=${d.gender} 이름=${d.name ?? '(없음)'} 고민=${d.concern}/${d.option ?? '-'}`,
      `경도=${d.birth.longitude ?? RULESET.defaultLongitude} 진태양시=${d.birth.trueSolar ?? RULESET.trueSolar}`,
    ],
  });

  const p = computeFourPillars(d.birth);
  out.push({
    step: '2. CALENDAR',
    lines: [
      `표준시 보정 ${p.corrections.offsetMin}분${p.corrections.isDst ? ' (서머타임)' : ''}`,
      `진태양시 보정 ${p.corrections.trueSolarMin.toFixed(1)}분`,
      `절기 ${p.solarTerm.name} (황경 ${p.solarTerm.startLongitude}도)`,
      `경계 안내: ${boundaryNotice(d.birth) ?? '없음'}`,
    ],
  });

  out.push({
    step: '3. FOUR PILLARS',
    lines: [
      `년 ${p.year.kor}  월 ${p.month.kor}  일 ${p.day.kor}  시 ${p.hour?.kor ?? '(없음)'}`,
      `일간=${p.dayMaster.kor}(${ELEMENT_KO[p.dayMaster.el]}) 띠=${p.zodiac}`,
      `달력 해와 띠가 다름=${p.zodiacDiffersFromCalendarYear}`,
      `규칙 버전 ${p.rulesetVersion}`,
    ],
  });

  const prof = analyzeSaju(p);
  const [g1, g2] = gongmangOf(p.day.ganzhi);
  out.push({
    step: '4. DERIVED',
    lines: [
      `오행 ${(Object.keys(prof.balance) as (keyof typeof prof.balance)[])
        .map((e) => `${ELEMENT_KO[e]} ${Math.round(prof.balance[e] * 100)}%`).join(' / ')}`,
      `강약=${prof.strength} 득령=${prof.hasSeasonalSupport} 용신=${ELEMENT_KO[prof.usefulElement]}`,
      `십신 ${prof.gods.map((x) => `${x.position}:${x.god}`).join(' ')}`,
      `십이운성(일지) ${unseongOf(p.dayStem, p.day.branch)}`,
      `신살 ${sinsalOf(p).map((x) => `${x.key}@${x.at}`).join(' ') || '(없음)'}`,
      `공망 ${BRANCHES[g1].kor}${BRANCHES[g2].kor}`,
      d.name ? `이름 ${readNameSound(d.name)?.elements.map((e) => ELEMENT_KO[e]).join('-') ?? '(2글자 미만)'}` : '이름 (없음)',
    ],
  });

  const daeun = computeDaeun(d.birth, p, d.gender, now);
  const timing = computeTiming(d.birth, p, d.gender, d.concern, now);
  out.push({
    step: '5. TIME CYCLES',
    lines: [
      `대운 ${daeun.forward ? '순행' : '역행'} 시작 ${daeun.startAge}세 현재 ${daeun.current?.kor ?? '(전)'} (${daeun.current?.startAge}~${daeun.current?.endAge}세)`,
      `세운 ${timing.years.map((y) => `${y.label}:${y.tenGod}/${y.score}`).join(' ')}`,
      `월운 ${timing.months.slice(0, 4).map((m) => `${m.label}:${m.score}`).join(' ')} ...`,
      `가장 좋은 달 ${timing.bestMonth.label} / 피할 달 ${timing.hardMonth.label}`,
    ],
  });

  const score = computeConcernScore(p, timing, d.dateKey);
  out.push({
    step: '6. SCORE',
    lines: [
      ...score.parts.map((x) => `${x.k.padEnd(12)} ${String(x.score).padStart(3)} × ${x.weight}% (${x.godWord})`),
      `합계 ${score.total} (${score.band})`,
    ],
  });

  const read = buildDeepRead(p, timing, d.concern, d.option ?? null, d.dateKey, d.name);
  out.push({
    step: '7. INTERPRETATION',
    lines: [
      `결론 ${read.verdict} / 결정 ${read.decision.stance}`,
      `오늘 일진 ${read.todayMeet.pillar} 단계=${read.todayMeet.step} 관계=${read.todayMeet.rows.map((r) => `${r.k}${r.rel}`).join(',') || '없음'}`,
    ],
  });

  out.push({
    step: '8. COPY',
    lines: [
      read.headline,
      read.scoreLine,
      read.decision.verdict,
      `할 것: ${read.decision.dos[0]}`,
    ],
  });

  return out;
}

/** 콘솔에 바로 찍는 형태로. 테스트나 개발 중에 부른다. */
export function formatDebug(stages: DebugStage[]): string {
  return stages
    .map((s) => `${s.step}\n${s.lines.map((l) => `   ${l}`).join('\n')}`)
    .join('\n');
}
