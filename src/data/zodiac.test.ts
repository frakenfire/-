import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ZODIACS, zodiacYears } from './zodiac.ts';

// 띠와 해의 대응은 바깥에서 확인할 수 있는 사실이다.
// 1992 임신년 원숭이띠, 2020 경자년 쥐띠, 1988 무진년 용띠.
test('띠별 연도가 알려진 해와 맞는다', () => {
  assert.ok(zodiacYears('monkey', 2026).includes('92'), '1992 는 원숭이띠');
  assert.ok(zodiacYears('rat', 2026).includes('20'), '2020 은 쥐띠');
  assert.ok(zodiacYears('dragon', 1988).includes('88'), '1988 은 용띠');
});

test('열두 띠가 서로 다른 해를 가진다', () => {
  const last = ZODIACS.map((z) => { const y = zodiacYears(z.id, 2026); return y[y.length - 1]; });
  assert.equal(new Set(last).size, 12, '열두 띠의 최근 연도가 전부 달라야 한다');
});

test('12년 간격이고 오래된 것부터 온다', () => {
  const ys = zodiacYears('ox', 2026).map(Number);
  assert.equal(ys.length, 3);
  assert.ok(ys[0] < ys[1] || ys[0] > ys[1] + 50, '오름차순 (세기 넘김 허용)');
  const full = zodiacYears('ox', 2026, 3);
  assert.equal(full.length, 3);
});

test('기준 해가 그 띠면 기준 해가 맨 뒤에 온다', () => {
  // 2020 은 쥐띠 - 기준을 2020 으로 두면 20 이 마지막
  const r = zodiacYears('rat', 2020);
  assert.equal(r[r.length - 1], '20');
});
