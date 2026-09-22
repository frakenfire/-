import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { CONCERNS, findConcern } from '../data/concerns.ts';

// 고른 상황과 부딪히는 말이 화면 어디에도 없어야 한다.
//
// 고민을 물은 다음 상황을 한 번 더 묻는데, 그 답이 화면에 안 닿으면 물어본
// 적이 없는 것과 같다. '지금은 쉬는 중이에요' 를 고른 사람에게 '올해 맡은
// 일과 성과를 한 문서로 모아두기' 가 나가던 때가 있었다.
//
// 표 하나씩 보면 놓친다. 층이 열 개가 넘고 표도 여덟 개다. 그래서 화면에
// 나가는 값을 통째로 펴서 훑는다. 생일 셋 x 열두 달 x 스물넷 상황.
const FORBIDDEN: Record<string, RegExp> = {
  'work/stay': /개업|사업자|손님|매출|첫 자리/,
  'work/rest': /맡은 범위|동료|같은 팀|사내|출근|승진|지금 회사|개업|사업자|손님|매출/,
  'work/start': /승진|경력을|재직|이직|지금 회사|개업|사업자|손님|매출/,
  'work/own': /지원(?!금)|채용|이력서|면접|입사|취업|합격|승진|이직|연봉/,
  'love/alone': /상대|사귀는|연인|우리 사이|만나면/,
  'love/some': /연인|우리 사이|헤어진/,
  'love/couple': /소개받|새 사람|헤어진/,
  'love/past': /사귀자|만나면|소개받/,
  'people/work': /가족/,
  'people/friend': /가족|동료/,
  'people/family': /동료|회사/,
  'people/new': /가족|오래 못 본|오래 안 본/,
};

/** 화면에 나가는 모든 문자열을 평평하게 편다 */
function flat(v: unknown, path = '', out: [string, string][] = []): [string, string][] {
  if (typeof v === 'string') { if (v.length > 3) out.push([path, v]); return out; }
  if (Array.isArray(v)) { v.forEach((x) => flat(x, `${path}[]`, out)); return out; }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) flat(x, path ? `${path}.${k}` : k, out);
  }
  return out;
}

// 남녀는 대운이 반대로 돌고 연애에서 보는 자리도 달라진다. 태어난 시각을
// 모르면 여섯 글자로만 센다. 한쪽만 재고 '다 봤다' 고 하면 안 된다.
const BIRTHS = [
  { year: 1992, month: 3, day: 3, hour: 20 },
  { year: 1988, month: 11, day: 27, hour: 7 },
  { year: 2001, month: 6, day: 14, hour: 13 },
  { year: 1979, month: 8, day: 8, hour: null },
];
const GENDERS = ['female', 'male'] as const;

test('고른 상황과 부딪히는 말이 화면 어디에도 없다', () => {
  const bad = new Set<string>();
  for (const input of BIRTHS) {
    const p = computeFourPillars(input);
    for (let m = 0; m < 12; m += 1) {
      const at = new Date(Date.UTC(2026, m, 15, 3));
      const dateKey = `2026-${String(m + 1).padStart(2, '0')}-15`;
      for (const gender of GENDERS) {
      for (const c of CONCERNS) {
        // 고민 이름 자체는 고른 사람이 읽고 온 말이라 뺀다.
        // '일과 이직은 75점이에요' 의 '이직' 은 전제가 아니라 제목이다.
        const label = findConcern(c.key).label;
        for (const o of c.options) {
          const re = FORBIDDEN[`${c.key}/${o.key}`];
          if (!re) continue;
          const t = computeTiming(input, p, gender, c.key, at);
          const r = buildDeepRead(p, t, c.key, o.key, dateKey, '김한별');
          for (const [path, s] of flat(r)) {
            const hit = s.split(label).join(' ').match(re);
            if (hit) bad.add(`${c.key}/${o.key} ${path} [${hit[0]}] ${s.slice(0, 60)}`);
          }
        }
      }
      }
    }
  }
  assert.deepEqual([...bad], [], `상황과 부딪히는 말이 남아 있습니다:\n  ${[...bad].join('\n  ')}`);
});
