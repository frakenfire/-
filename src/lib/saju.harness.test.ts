import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iljinOf, zodiacRelation, dailyZodiacRanking, type BranchRelation } from './saju.ts';

// 사주 엔진 전수 검증 하네스.
//
// 단위 테스트가 '앵커 몇 개'를 확인한다면, 여기서는 상태 공간을 통째로 훑어
// 구조적 불변식(invariant)을 검증한다. 명리 규칙은 비선형 조건문 덩어리라
// 예시 몇 개로는 구멍을 못 잡는다.
//   - 지지 관계 12×12 행렬: 대칭성 · 전수 정의 · 전통 정의와의 일치
//   - 60갑자: 100년(36,525일) 무결성 + 60일 주기성
//   - 12띠 서열: 1년 365일 전부 유효한 순열인지

const ORDER = [
  'rat', // 子
  'ox', // 丑
  'tiger', // 寅
  'rabbit', // 卯
  'dragon', // 辰
  'snake', // 巳
  'horse', // 午
  'sheep', // 未
  'monkey', // 申
  'rooster', // 酉
  'dog', // 戌
  'pig', // 亥
] as const;

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate(),
  ).padStart(2, '0')}`;
}

// ── 지지 관계 행렬 ──────────────────────────────────────────────

test('지지 관계 12×12 행렬이 대칭이고 모든 쌍에 정의돼 있다', () => {
  const valid: BranchRelation[] = [
    'self',
    'selfPunish',
    'trine',
    'union',
    'clash',
    'punish',
    'harm',
    'break',
    'none',
  ];
  for (const a of ORDER) {
    for (const b of ORDER) {
      const ab = zodiacRelation(a, b);
      const ba = zodiacRelation(b, a);
      assert.ok(valid.includes(ab), `${a}-${b} 관계가 정의되지 않음: ${ab}`);
      assert.equal(ab, ba, `${a}-${b} 관계가 비대칭 (${ab} vs ${ba})`);
    }
  }
});

test('삼합 4그룹이 각각 정확히 3쌍씩만 성립한다', () => {
  const groups = [
    ['monkey', 'rat', 'dragon'], // 申子辰
    ['snake', 'rooster', 'ox'], // 巳酉丑
    ['pig', 'rabbit', 'sheep'], // 亥卯未
    ['tiger', 'horse', 'dog'], // 寅午戌
  ] as const;
  let total = 0;
  for (const a of ORDER) {
    for (const b of ORDER) {
      if (a !== b && zodiacRelation(a, b) === 'trine') total += 1;
    }
  }
  assert.equal(total / 2, 12); // 그룹당 3쌍 × 4그룹
  for (const g of groups) {
    for (const a of g) {
      for (const b of g) {
        if (a !== b) assert.equal(zodiacRelation(a, b), 'trine', `${a}-${b} 는 삼합이어야 함`);
      }
    }
  }
});

test('상충은 정확히 6쌍이고 모두 정반대 위치다', () => {
  let count = 0;
  for (let i = 0; i < 12; i += 1) {
    for (let j = i + 1; j < 12; j += 1) {
      if (zodiacRelation(ORDER[i], ORDER[j]) === 'clash') {
        assert.equal(j - i, 6, `${ORDER[i]}-${ORDER[j]} 는 6칸 대칭이 아닌데 충으로 판정됨`);
        count += 1;
      }
    }
  }
  assert.equal(count, 6);
});

test('형(刑)·자형이 전통 정의와 일치하고 우선순위가 지켜진다', () => {
  // 자형(自刑) — 辰午酉亥 넷만
  const selfPunish = ORDER.filter((z) => zodiacRelation(z, z) === 'selfPunish');
  assert.deepEqual([...selfPunish].sort(), ['dragon', 'horse', 'pig', 'rooster']);
  // 나머지 여덟은 비화
  assert.equal(ORDER.filter((z) => zodiacRelation(z, z) === 'self').length, 8);

  // 순수 형으로 남는 쌍 (충·합에 흡수되지 않는 것)
  assert.equal(zodiacRelation('rat', 'rabbit'), 'punish'); // 子卯 무례지형
  assert.equal(zodiacRelation('tiger', 'snake'), 'punish'); // 寅巳
  assert.equal(zodiacRelation('ox', 'dog'), 'punish'); // 丑戌
  assert.equal(zodiacRelation('dog', 'sheep'), 'punish'); // 戌未

  // 우선순위: 충 > 합 > 형
  assert.equal(zodiacRelation('tiger', 'monkey'), 'clash'); // 寅申 = 삼형이자 충 → 충
  assert.equal(zodiacRelation('ox', 'sheep'), 'clash'); // 丑未 = 삼형이자 충 → 충
  assert.equal(zodiacRelation('snake', 'monkey'), 'union'); // 巳申 = 형이자 육합 → 합
});

test('파(破)는 합·형에 흡수되지 않은 쌍에만 남는다', () => {
  assert.equal(zodiacRelation('rat', 'rooster'), 'break'); // 子酉
  assert.equal(zodiacRelation('ox', 'dragon'), 'break'); // 丑辰
  assert.equal(zodiacRelation('rabbit', 'horse'), 'break'); // 卯午
  assert.equal(zodiacRelation('tiger', 'pig'), 'union'); // 寅亥 = 파이자 육합 → 합
});

test('관계 없는(평운) 쌍이 절반 미만이다', () => {
  let none = 0;
  let pairs = 0;
  for (let i = 0; i < 12; i += 1) {
    for (let j = i + 1; j < 12; j += 1) {
      pairs += 1;
      if (zodiacRelation(ORDER[i], ORDER[j]) === 'none') none += 1;
    }
  }
  // 형·파를 넣기 전에는 36/66 이 평운이었다. 이제 29/66.
  assert.equal(pairs, 66);
  assert.ok(none < pairs / 2, `평운 비율이 너무 높음: ${none}/${pairs}`);
  assert.equal(none, 29);
});

// ── 60갑자 무결성 ───────────────────────────────────────────────

test('60갑자가 100년(36,525일) 동안 끊김 없이 진행한다', () => {
  let key = '2000-01-01';
  let prev = iljinOf(key).hanja;
  for (let i = 1; i <= 36525; i += 1) {
    key = addDays(key, 1);
    const cur = iljinOf(key).hanja;
    const sPrev = STEMS.indexOf(prev[0]);
    const bPrev = BRANCHES.indexOf(prev[1]);
    assert.equal(STEMS.indexOf(cur[0]), (sPrev + 1) % 10, `${key} 천간이 1칸 진행하지 않음`);
    assert.equal(BRANCHES.indexOf(cur[1]), (bPrev + 1) % 12, `${key} 지지가 1칸 진행하지 않음`);
    prev = cur;
  }
});

test('60일 연속이면 60갑자가 중복 없이 모두 등장하고 61일째 되돌아온다', () => {
  const start = '2026-01-01';
  const seen = new Set<string>();
  for (let i = 0; i < 60; i += 1) seen.add(iljinOf(addDays(start, i)).hanja);
  assert.equal(seen.size, 60);
  assert.equal(iljinOf(addDays(start, 60)).hanja, iljinOf(start).hanja);
});

// ── 12띠 서열 ──────────────────────────────────────────────────

test('1년 365일 내내 띠 서열이 유효한 순열이다', () => {
  let key = '2026-01-01';
  for (let d = 0; d < 365; d += 1) {
    const r = dailyZodiacRanking(key);
    assert.equal(r.length, 12, `${key}: 12띠가 아님`);
    assert.equal(new Set(r.map((x) => x.animal)).size, 12, `${key}: 중복 띠 존재`);
    assert.deepEqual(
      r.map((x) => x.rank),
      Array.from({ length: 12 }, (_, i) => i + 1),
      `${key}: 순위가 1~12 연속이 아님`,
    );
    // 일진 지지와 삼합인 띠는 상충인 띠보다 항상 위
    const branch = BRANCHES.indexOf(iljinOf(key).hanja[1]);
    const clashAnimal = ORDER[(branch + 6) % 12];
    const trineAnimal = ORDER[(branch + 4) % 12];
    const rankOf = (a: string) => r.find((x) => x.animal === a)!.rank;
    assert.ok(
      rankOf(trineAnimal) < rankOf(clashAnimal),
      `${key}: 삼합(${trineAnimal})이 상충(${clashAnimal})보다 아래`,
    );
    key = addDays(key, 1);
  }
});
