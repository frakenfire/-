import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead, type DeepRead } from './deepRead.ts';
import { splitSentences } from './sentences.ts';
import { CONCERNS } from '../data/concerns.ts';

// 같은 말을 두 번 하면 화면만 길어지고 아무도 안 읽는다.
// 리포트 전체를 문장 단위로 펼쳐서 겹치는 게 있는지 본다.

// 사람과 날을 여럿 걸어둔다. 한 사람만 보면 글자 조합에 따라 겹치는 걸 놓친다.
const PEOPLE = [
  { input: { year: 1992, month: 3, day: 3, hour: 20 }, gender: 'female' as const, name: '김한별' },
  { input: { year: 1988, month: 11, day: 21, hour: 7 }, gender: 'male' as const, name: '이윤섭' },
  { input: { year: 2001, month: 6, day: 15, hour: 3 }, gender: 'female' as const, name: '박지훈' },
];
const DAYS = ['2026-09-17', '2027-02-11'];
const INPUT = PEOPLE[0].input;
const P = computeFourPillars(INPUT);
const AT = new Date('2026-09-17T12:00:00+09:00');

/** 리포트에 화면으로 나가는 문장을 전부 모은다 */
function allSentences(r: DeepRead): { where: string; s: string }[] {
  const out: { where: string; s: string }[] = [];
  const push = (where: string, text: string | null | undefined) => {
    if (!text) return;
    for (const s of splitSentences(text)) out.push({ where, s: s.trim() });
  };

  push('쪽지 결론', r.headline);
  push('쪽지 해석', r.sub);
  push('점수 설명', r.scoreLine);
  push('결정 결론', r.decision.verdict);
  r.decision.dos.forEach((d) => push('지금 할 것', d));
  r.decision.donts.forEach((d) => push('지금 하지 말 것', d));
  push('오늘 할 일', r.today.doIt);
  push('오늘 피할 것', r.today.avoid);
  push('오늘 미룰 것', r.today.hold);
  r.shape.rows.forEach((x) => push(`타고난 구조/${x.k}`, x.v));
  push('상황', r.now.situation);
  r.now.rows.forEach((x) => push(`지금 왜/${x.k}`, x.v));
  r.when.forEach((w) => push(`언제/${w.k}`, w.act));
  r.yearLines.forEach((y) => push(`올해내년/${y.k}`, y.v));
  r.decade?.rows.forEach((x) => push(`십 년/${x.k}`, x.v));
  r.why.forEach((w) => push(`근거/${w.k}`, w.v));
  push('명식 결론', r.chart.focus);
  push('이름', r.name?.verdict);
  push('오늘 단계', r.todayMeet.stepLine);
  push('갱신', r.refresh);
  return out;
}

/** 조사와 공백을 걷어낸 뼈대. '나가는 날보다' 와 '나올 곳보다' 는 다르게 남는다. */
function skeleton(s: string): string {
  return s.replace(/[\s.,·]/g, '');
}

test('리포트 안에서 같은 문장이 두 번 나오지 않는다', () => {
  const bad: string[] = [];
  for (const person of PEOPLE) {
   const pp = computeFourPillars(person.input);
   for (const day of DAYS) {
    const at = new Date(`${day}T12:00:00+09:00`);
    for (const c of CONCERNS) {
     for (const o of [null, ...c.options.map((x) => x.key)]) {
      const t = computeTiming(person.input, pp, person.gender, c.key, at);
      const r = buildDeepRead(pp, t, c.key, o, day, person.name);
      const seen = new Map<string, string>();
      for (const { where, s } of allSentences(r)) {
        if (s.length < 12) continue; // 너무 짧은 건 겹쳐도 문제 아님
        const k = skeleton(s);
        const first = seen.get(k);
        if (first && first !== where) bad.push(`${person.name}/${day}/${c.key}/${o ?? '-'}: [${first}] 와 [${where}] — ${s}`);
        else seen.set(k, where);
      }
     }
    }
   }
  }
  assert.deepEqual(bad, [], `\n겹침 ${bad.length}건\n${bad.slice(0, 12).join('\n')}`);
});

test('거의 같은 문장도 두 번 나오지 않는다', () => {
  // 앞 여덟 글자가 같고 뒤 여덟 글자도 같으면 사실상 같은 말이다
  const bad: string[] = [];
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, AT);
    const r = buildDeepRead(P, t, c.key, c.options[0].key, '2026-09-17', '김한별');
    const rows = allSentences(r).filter((x) => x.s.length >= 16);
    for (let i = 0; i < rows.length; i += 1) {
      for (let j = i + 1; j < rows.length; j += 1) {
        const a = skeleton(rows[i].s);
        const b = skeleton(rows[j].s);
        if (a.slice(-10) === b.slice(-10) && a.slice(0, 6) === b.slice(0, 6)) {
          bad.push(`${c.key}: [${rows[i].where}] / [${rows[j].where}] — ${rows[i].s} // ${rows[j].s}`);
        }
      }
    }
  }
  assert.deepEqual(bad, [], `\n${bad.slice(0, 12).join('\n')}`);
});
