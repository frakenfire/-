import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOTES } from '../notes.ts';
import { CONCERNS } from '../concerns.ts';
import { NOTE_TODAY } from './index.ts';
import { computeFourPillars } from '../../lib/fourPillars.ts';
import { computeTiming } from '../../lib/timing.ts';
import { buildDeepRead } from '../../lib/deepRead.ts';

// 뽑은 쪽지가 결과를 바꾼다. 쪽지 서른여섯 장 x 일곱 칸이 다 차 있어야 한다.
const KEYS = [...CONCERNS.map((c) => c.key), 'none'] as const;

test('쪽지 서른여섯 장마다 일곱 칸이 다 차 있다', () => {
  const miss: string[] = [];
  for (const n of NOTES) {
    for (const k of KEYS) {
      const t = NOTE_TODAY[n.id]?.[k];
      if (!t || t.length < 30) miss.push(`${n.id}.${k}`);
    }
  }
  assert.deepEqual(miss, []);
});

test('쪽지 문장이 서로 겹치지 않는다', () => {
  const seen = new Map<string, string>();
  for (const n of NOTES) {
    for (const k of KEYS) {
      const t = NOTE_TODAY[n.id]?.[k] ?? '';
      const prev = seen.get(t);
      assert.ok(!prev, `${n.id}.${k} 가 ${prev} 와 같아요`);
      seen.set(t, `${n.id}.${k}`);
    }
  }
});

// 매일 뽑는 앱이다. 한 사람이 한 달 동안 같은 고민으로 들어와도 맨 위 결론
// 카드(전체 종합, 할 것, 하지 말 것)가 날마다 달라야 한다. 전에는 전체 종합이
// 점수 구간 셋으로만 갈려 같은 구간 날마다 글자 하나까지 같았고, 할 것과
// 하지 말 것은 열흘마다 그대로 돌아왔다.
test('한 달 동안 맨 위 결론 카드가 날마다 다르다', () => {
  const birth = { year: 1995, month: 1, day: 1, hour: 9 };
  const p = computeFourPillars(birth);
  for (const c of CONCERNS) {
    const opt = c.options[0].key;
    const cards = new Set<string>();
    const dos = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      const dt = new Date(Date.UTC(2026, 9, 1 + i, 3));
      const key = dt.toISOString().slice(0, 10);
      const t = computeTiming(birth, p, 'female', c.key, dt);
      const d = buildDeepRead(p, t, c.key, opt, key).todayDecision;
      cards.add(`${d.overall.headline}|${d.do.action}|${d.dont.action}`);
      dos.add(d.do.action);
    }
    assert.equal(cards.size, 30, `${c.key}: 30일 중 ${cards.size}일만 다른 카드`);
    assert.ok(dos.size >= 10, `${c.key}: 할 것이 ${dos.size}가지뿐`);
  }
});
