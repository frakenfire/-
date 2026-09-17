import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { DECISION, STANCE_WORD } from '../data/decision.ts';
import { CONCERNS } from '../data/concerns.ts';

const INPUT = { year: 1992, month: 3, day: 3, hour: 20 };
const P = computeFourPillars(INPUT);
const AT = new Date('2026-09-17T12:00:00+09:00');

// '그래서 뭘 하라는 거지' 가 남으면 진 것이다. 행동이 추상 명사로 끝나면 안 된다.
const VAGUE = /^(준비|도움|정리|변화|기회|지키기|움직이기|사람|조건|인정|기록|협력)(하기|받기|잡기)?\.?$/;

test('모든 주제와 상태에서 결정 카드가 비지 않는다', () => {
  for (const c of CONCERNS) {
    for (const stance of ['run', 'prep', 'hold', 'keep'] as const) {
      const cell = DECISION[c.key][stance];
      assert.ok(cell.verdict.length > 40, `${c.key}/${stance} 결론이 너무 짧음`);
      assert.equal(cell.dos.length, 3);
      assert.equal(cell.donts.length, 3);
      for (const d of [...cell.dos, ...cell.donts]) {
        assert.ok(d.length > 8, `${c.key}/${stance} 행동이 너무 짧음: ${d}`);
        assert.ok(!VAGUE.test(d.trim()), `${c.key}/${stance} 추상어로 끝남: ${d}`);
      }
      // 할 것과 하지 말 것이 같은 문장이면 아무 말도 안 한 것이다
      const overlap = cell.dos.filter((d) => cell.donts.includes(d));
      assert.equal(overlap.length, 0, `${c.key}/${stance} 겹침: ${overlap.join(', ')}`);
    }
  }
});

test('결론에 지금 어느 상태인지가 한 단어로 박힌다', () => {
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, AT);
    const r = buildDeepRead(P, t, c.key, null, '2026-09-17');
    assert.ok(Object.values(STANCE_WORD).includes(r.decision.stanceWord), `${c.key} 상태말 없음`);
    assert.equal(r.decision.dos.length, 3);
    assert.equal(r.decision.donts.length, 3);
  }
});

test('실행하기는 이번 달이 열려 있고 점수도 받쳐줄 때만 나온다', () => {
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, AT);
    const r = buildDeepRead(P, t, c.key, null, '2026-09-17');
    if (r.decision.stance === 'run') {
      assert.equal(t.thisMonth.band, 'good', `${c.key} 이번 달이 안 열렸는데 실행하기`);
      assert.ok(r.score.total >= 74, `${c.key} ${r.score.total}점인데 실행하기`);
    }
    if (r.decision.stance === 'hold') {
      assert.equal(t.thisMonth.band, 'hard', `${c.key} 이번 달이 버겁지 않은데 결정하지 않기`);
    }
  }
});

test('좋은 달과 조심할 달에 그때 뭘 할지가 붙는다', () => {
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, AT);
    const r = buildDeepRead(P, t, c.key, null, '2026-09-17');
    const best = r.when.find((w) => w.k === '가장 좋은 때');
    const hard = r.when.find((w) => w.k === '피할 때');
    assert.ok(best?.act && best.act.length > 10, `${c.key} 좋은 달에 행동이 없음`);
    assert.ok(hard?.act && hard.act.length > 10, `${c.key} 조심할 달에 행동이 없음`);
  }
});
