import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGift, giftChoices, readGiftId, buildGiftShareText, type Gift } from './gifts.ts';

// 목록은 밖으로 안 낸다. 번호로 찾을 수 있는 것만 모은다.
const GIFTS: Gift[] = [];
for (let i = 1; i <= 200; i++) { const g = findGift(i); if (g) GIFTS.push(g); }

const loc = (pathname: string, search = '', hash = '') => ({ pathname, search, hash });

// 봉투에는 번호만 실린다. 번호가 비거나 한마디가 겹치면 이미 보낸 봉투가 엉뚱한 말을 한다.
test('봉투 번호는 1부터 빈틈없이 이어지고 한마디는 겹치지 않는다', () => {
  assert.ok(GIFTS.length >= 3);
  GIFTS.forEach((g, i) => assert.equal(g.id, i + 1));
  assert.equal(new Set(GIFTS.map((g) => g.line)).size, GIFTS.length);
});

test('오늘 고를 세 장은 서로 다르고, 같은 날엔 같다', () => {
  for (const d of ['2026-10-17', '2026-10-18', '2027-01-01']) {
    const a = giftChoices(d);
    assert.equal(a.length, 3);
    assert.equal(new Set(a.map((g) => g.id)).size, 3);
    assert.deepEqual(giftChoices(d), a);
  }
});

// 토스 링크가 웹뷰를 어떤 모양으로 여는지 확인되지 않아서 세 모양을 다 받는다.
test('경로·해시·쿼리 어느 모양으로 와도 번호를 읽는다', () => {
  assert.equal(readGiftId(loc('/gift', '?m=3')), 3);
  assert.equal(readGiftId(loc('/app/gift/', '?m=7')), 7);
  assert.equal(readGiftId(loc('/', '', '#/gift?m=5')), 5);
  assert.equal(readGiftId(loc('/', '?gift=12')), 12);
});

test('봉투가 아니거나 모르는 번호면 아무것도 안 연다', () => {
  assert.equal(readGiftId(loc('/', '', '#/compat')), null);
  assert.equal(readGiftId(loc('/gift', '?m=999')), null);
  assert.equal(readGiftId(loc('/gift', '?m=abc')), null);
  assert.equal(readGiftId(loc('/gift')), null);
  assert.equal(findGift(0), null);
});

// 한마디가 공유 글에 미리 나오면 봉투를 열 이유가 없다.
test('공유 글에는 봉투 안의 한마디가 안 들어간다', () => {
  const text = buildGiftShareText();
  for (const g of GIFTS) assert.ok(!text.includes(g.line), g.line);
});
