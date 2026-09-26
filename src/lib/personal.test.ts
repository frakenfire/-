// 사람이 달라지면 풀이도 달라지는가.
//
// '두루뭉술하다' 는 말을 또 들었다. 낱말이 어려운 게 아니라, 생년월일이
// 완전히 다른 사람들이 같은 문장을 받고 있었다. 처음 재보니 풀이 문장의
// 30%를 다섯 사람이 글자 하나까지 똑같이 받았다.
//
// 그 30%의 정체는 둘이었다.
//   - 맨 위 답: 고민 + 내가 고른 상황 + 점수 밴드만 보고 나온 표 조회.
//     여덟 글자를 한 번도 안 봤다. 내가 입력한 것을 되돌려주는 셈이다.
//   - 열두 달 표: 십신이 열인데 달이 열둘이라 누구나 열 문장을 다 받는다.
//     달 배치만 다르고 문장은 전원 같다.
//
// 이름표와 제목은 누구에게나 같아야 맞다. 그래서 해요체로 끝나는 풀이
// 문장만 센다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';

const BIRTHS = [
  { year: 1992, month: 3, day: 3, hour: 20 },
  { year: 1988, month: 11, day: 27, hour: 7 },
  { year: 2001, month: 6, day: 14, hour: 13 },
  { year: 1975, month: 9, day: 9, hour: 3 },
  { year: 2005, month: 12, day: 31, hour: 23 },
];

function sentencesOf(v: unknown, out: Set<string> = new Set()): Set<string> {
  if (typeof v === 'string') {
    for (const seg of v.split(/\n/)) {
      const t = seg.trim();
      if (t.length >= 8 && /[가-힣]/.test(t) && /(요|죠)[.!?]$/.test(t)) out.add(t);
    }
    return out;
  }
  if (Array.isArray(v)) { for (const x of v) sentencesOf(x, out); return out; }
  if (v && typeof v === 'object') { for (const x of Object.values(v)) sentencesOf(x, out); }
  return out;
}

// 고친 뒤 재보니 12~15% 다. 남은 것은 '이 답은 이렇게 나와요' 류 설명문과
// 점수 보는 법이라 누구에게나 같아야 맞다. 이 값이 올라가면 두루뭉술로
// 되돌아간 것이다.
const 겹침_한계 = 16;

test('생년월일이 다른 다섯 사람이 같은 풀이를 받지 않는다', () => {
  const at = new Date(Date.UTC(2026, 8, 26, 3));
  const worst: string[] = [];
  for (const c of CONCERNS) {
    const sets = BIRTHS.map((b) => {
      const p = computeFourPillars(b);
      const t = computeTiming(b, p, 'female', c.key as ConcernKey, at);
      return sentencesOf(buildDeepRead(p, t, c.key as ConcernKey, null, '2026-09-26'));
    });
    let common = new Set(sets[0]);
    for (const s of sets.slice(1)) common = new Set([...common].filter((x) => s.has(x)));
    const avg = sets.reduce((a, s) => a + s.size, 0) / sets.length;
    const share = Math.round((common.size / avg) * 100);
    if (share > 겹침_한계) worst.push(`${c.label} ${share}% (${common.size}/${Math.round(avg)})`);
  }
  assert.deepEqual(worst, [], `다섯 사람이 ${겹침_한계}% 넘게 같은 문장을 받아요: ${worst.join(' · ')}`);
});
