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

// 매일 뽑는 앱이다. 한 사람이 같은 고민으로 날마다 들어와도 맨 위 결론
// 카드(오늘 풀이, 할 것, 미룰 것)가 날마다 달라야 한다.
// 2026-10-12부터 카드는 그날 십신 하나에서 나온다(한 화면이 그날 사주 주제 하나를
// 말하게). 십신은 날마다 바뀌어 열흘에 한 바퀴 돈다. 그래서 열흘 연속은 전부
// 다르고, 열하루째부터는 십신과 점수 밴드가 같을 때만 같은 카드가 돌아온다.
// 쪽지 한마디는 뽑은 쪽지마다 따로 바뀐다.
test('열흘 연속 맨 위 결론 카드가 날마다 다르다', () => {
  const birth = { year: 1995, month: 1, day: 1, hour: 9 };
  const p = computeFourPillars(birth);
  for (const c of CONCERNS) {
    const opt = c.options[0].key;
    const cards: string[] = [];
    const dos = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      const dt = new Date(Date.UTC(2026, 9, 1 + i, 3));
      const key = dt.toISOString().slice(0, 10);
      const t = computeTiming(birth, p, 'female', c.key, dt);
      const d = buildDeepRead(p, t, c.key, opt, key).todayDecision;
      cards.push(`${d.overall.headline}|${d.do.action}|${d.dont.action}`);
      dos.add(d.do.action);
    }
    for (let i = 0; i + 10 <= cards.length; i += 1) {
      const win = new Set(cards.slice(i, i + 10));
      assert.equal(win.size, 10, `${c.key}: ${i + 1}일부터 열흘 중 ${win.size}일만 다른 카드`);
    }
    assert.ok(dos.size >= 10, `${c.key}: 할 것이 ${dos.size}가지뿐`);
  }
});
