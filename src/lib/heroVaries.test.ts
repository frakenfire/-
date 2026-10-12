import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';
import { todayAskOf } from '../data/todayVerdict.ts';

// 제일 큰 카드가 사람을 보고 있는가.
//
// 생일이 전부 다른 마흔 명에게 같은 날 같은 고민으로 결과를 뽑아, 칸마다
// 몇 가지 값이 나오는지 셌다. 맨 위 카드의 두 줄(headline, sub)이 마흔 명
// 통틀어 두 가지였다. 고민·상황·점수 밴드만 보고 나온 표 조회라 여덟
// 글자를 한 번도 안 본 것이다. 매일 뽑는 앱에서 제일 큰 글자가 그랬다.
//
// 세 번째 줄을 오늘 들어온 글자에서 뽑도록 고쳤다. 십신이 열이니 마흔 명을
// 넣으면 한 자리 수로 떨어지지 않아야 한다. 이 수가 다시 낮아지면 맨 위
// 카드가 또 표 조회로 돌아간 것이다.
const 최소_가짓수 = 6;

const 생일마흔개 = (() => {
  const out: { year: number; month: number; day: number; hour: number }[] = [];
  let seed = 7;
  const rnd = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % n;
  };
  for (let i = 0; i < 40; i += 1) {
    out.push({ year: 1960 + rnd(50), month: 1 + rnd(12), day: 1 + rnd(28), hour: rnd(24) });
  }
  return out;
})();

test('맨 위 카드가 생일마다 다른 말을 한다', () => {
  const at = new Date(Date.UTC(2026, 8, 27, 3));
  const 모자란곳: string[] = [];
  for (const c of CONCERNS) {
    const seen = new Set<string>();
    for (const b of 생일마흔개) {
      const p = computeFourPillars(b);
      const t = computeTiming(b, p, 'female', c.key as ConcernKey, at);
      const r = buildDeepRead(p, t, c.key as ConcernKey, null, '2026-09-27');
      // 전체 종합은 상황과 밴드에서, 할 것과 하지 말 것은 오늘 들어온 글자에서
      // 나온다. 사주가 다르면 적어도 아래 두 칸은 달라야 한다.
      const d = r.todayDecision;
      seen.add(`${d.overall.headline}|${d.overall.summary}|${d.do.action}|${d.dont.action}`);
    }
    if (seen.size < 최소_가짓수) 모자란곳.push(`${c.label} ${seen.size}가지`);
  }
  assert.deepEqual(모자란곳, [], `마흔 명이 ${최소_가짓수}가지도 안 되는 말을 받아요`);
});

// 위 검사가 헛돌지 않는지. 옛날처럼 고민, 상황, 점수 밴드만 보고 표를 조회하면
// (그날 십신을 안 보면) 마흔 명이 밴드 가짓수 이하로 떨어진다. 그 상태를 직접 만들어
// 기준 수가 그보다 높은지 확인한다. 2026-10-12부터 오늘 풀이는 그날 십신 무리로도
// 갈리므로, 조회를 밴드만으로 흉내 낸다.
test('밴드만 보고 고르면 가짓수가 무너진다', () => {
  const at = new Date(Date.UTC(2026, 8, 27, 3));
  const p0 = CONCERNS[0].key as ConcernKey;
  const 밴드만 = new Set<string>();
  for (const b of 생일마흔개) {
    const p = computeFourPillars(b);
    const t = computeTiming(b, p, 'female', p0, at);
    const r = buildDeepRead(p, t, p0, null, '2026-09-27');
    밴드만.add(todayAskOf(p0, null, r.todayAsk.band, 0).head);
  }
  assert.ok(밴드만.size < 최소_가짓수,
    `밴드만으로도 ${밴드만.size}가지면 이 검사는 아무것도 안 잡아요`);
});
