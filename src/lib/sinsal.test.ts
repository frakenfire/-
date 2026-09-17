import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unseongOf, branchRelations, sinsalOf, gongmangOf, UNSEONG } from './sinsal.ts';
import { computeFourPillars } from './fourPillars.ts';

// 지지 0=자 1=축 2=인 3=묘 4=진 5=사 6=오 7=미 8=신 9=유 10=술 11=해
// 천간 0=갑 1=을 2=병 3=정 4=무 5=기 6=경 7=신 8=임 9=계

test('십이운성 - 갑목은 해에서 나고 묘에서 가장 세고 미에 묻힌다', () => {
  assert.equal(unseongOf(0, 11), '장생');
  assert.equal(unseongOf(0, 3), '제왕');
  assert.equal(unseongOf(0, 7), '묘');
  assert.equal(unseongOf(0, 2), '건록');
});

test('십이운성 - 음간은 거꾸로 돈다', () => {
  // 을목 장생은 오, 제왕은 인
  assert.equal(unseongOf(1, 6), '장생');
  assert.equal(unseongOf(1, 2), '제왕');
});

test('십이운성 - 열두 지지가 열두 단계를 한 번씩 채운다', () => {
  for (let stem = 0; stem < 10; stem += 1) {
    const seen = new Set<string>();
    for (let b = 0; b < 12; b += 1) seen.add(unseongOf(stem, b));
    assert.equal(seen.size, 12, `천간 ${stem} 이 ${seen.size} 단계뿐`);
  }
  assert.equal(UNSEONG.length, 12);
});

test('지지 충 - 여섯 쌍이 맞은편끼리', () => {
  for (const [a, b] of [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]) {
    assert.ok(branchRelations(a, b).includes('충'), `${a}-${b} 충이 아님`);
  }
  assert.ok(!branchRelations(0, 1).includes('충'));
});

test('지지 육합과 삼합', () => {
  assert.ok(branchRelations(0, 1).includes('합')); // 자축
  assert.ok(branchRelations(2, 11).includes('합')); // 인해
  assert.ok(branchRelations(8, 0).includes('삼합')); // 신자
  assert.ok(branchRelations(2, 6).includes('삼합')); // 인오
  assert.ok(!branchRelations(0, 2).includes('삼합'));
});

test('지지 형 - 인사신 축술미 자묘, 그리고 자형', () => {
  assert.ok(branchRelations(2, 5).includes('형'));
  assert.ok(branchRelations(1, 10).includes('형'));
  assert.ok(branchRelations(0, 3).includes('형'));
  assert.ok(branchRelations(4, 4).includes('형')); // 진진 자형
  assert.ok(!branchRelations(0, 0).includes('형'));
});

test('공망 - 갑자순은 술해가 빈다', () => {
  assert.deepEqual(gongmangOf(0), [10, 11]);
  assert.deepEqual(gongmangOf(9), [10, 11]);
  assert.deepEqual(gongmangOf(10), [8, 9]); // 갑술순
  assert.deepEqual(gongmangOf(50), [0, 1]); // 갑인순
});

test('신살 - 같은 별이 두 번 나오지 않는다', () => {
  for (const input of [
    { year: 1992, month: 3, day: 3, hour: 20 },
    { year: 1988, month: 11, day: 21, hour: 7 },
    { year: 2001, month: 6, day: 15, hour: 3 },
  ]) {
    const p = computeFourPillars(input);
    const found = sinsalOf(p);
    const keys = found.map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length, `중복: ${keys.join(', ')}`);
    for (const f of found) assert.ok(f.at.length > 2);
  }
});
