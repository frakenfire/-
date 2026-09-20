import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBirth } from './birth.ts';
import { computeFourPillars } from './fourPillars.ts';
import { BIRTH_PLACES, findPlace, isKnownPlace, DEFAULT_PLACE_ID } from '../data/birthPlace.ts';

test('경도를 안 주면 입력에 안 붙는다 — 엔진이 기본값을 쓴다', () => {
  assert.equal(parseBirth('1992-03-03', '13:20')?.longitude, undefined);
  assert.equal(parseBirth('1992-03-03', null)?.longitude, undefined);
});

test('경도를 주면 시각을 몰라도 같이 실린다', () => {
  assert.equal(parseBirth('1992-03-03', '13:20', 129.075)?.longitude, 129.075);
  assert.equal(parseBirth('1992-03-03', null, 129.075)?.longitude, 129.075);
});

// 이 앱이 태어난 곳을 받는 이유가 이 테스트다. 안 받으면 아래 두 사람이
// 같은 시주를 받는다 — 한 사람은 틀린 시주를 받는 것이다.
test('같은 시각이라도 태어난 곳이 다르면 시주가 갈린다', () => {
  // 목포와 포항은 경도로 약 3도, 진태양시로 12분 차이다.
  // 시주 경계(진태양시 두 시간마다) 바로 앞뒤를 고른다.
  const mokpo = findPlace('mokpo').longitude;
  const pohang = findPlace('pohang').longitude;
  assert.ok(pohang - mokpo > 2.9, '두 곳의 경도 차이');

  let differed = false;
  // 하루를 5분 간격으로 훑어 경계에 걸리는 시각이 실제로 있는지 본다.
  for (let m = 0; m < 24 * 60; m += 5) {
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    const a = computeFourPillars({ year: 1992, month: 3, day: 3, hour, minute, longitude: mokpo });
    const b = computeFourPillars({ year: 1992, month: 3, day: 3, hour, minute, longitude: pohang });
    if (a.hour?.ganzhi !== b.hour?.ganzhi) {
      differed = true;
      break;
    }
  }
  assert.ok(differed, '경도가 시주를 바꾸는 시각이 하루 안에 있어야 한다');
});

test('서울로 고른 것과 아무것도 안 고른 것이 같다', () => {
  const seoul = findPlace('seoul').longitude;
  const picked = computeFourPillars(parseBirth('1992-03-03', '13:20', seoul)!);
  const none = computeFourPillars(parseBirth('1992-03-03', '13:20')!);
  assert.equal(picked.hour?.ganzhi, none.hour?.ganzhi);
  assert.equal(picked.day.ganzhi, none.day.ganzhi);
});

test('지역 목록이 한국 안에 있고 서로 다르다', () => {
  const ids = new Set(BIRTH_PLACES.map((p) => p.id));
  assert.equal(ids.size, BIRTH_PLACES.length, '아이디가 겹치지 않는다');
  const labels = new Set(BIRTH_PLACES.map((p) => p.label));
  assert.equal(labels.size, BIRTH_PLACES.length, '이름이 겹치지 않는다');
  for (const p of BIRTH_PLACES) {
    assert.ok(p.longitude > 124 && p.longitude < 132, `${p.label} 경도 ${p.longitude}`);
  }
  assert.equal(BIRTH_PLACES[0].id, DEFAULT_PLACE_ID, '첫 칸이 기본값');
});

test('모르는 지역은 기본값으로 떨어진다', () => {
  assert.equal(findPlace('atlantis').id, DEFAULT_PLACE_ID);
  assert.equal(findPlace(null).id, DEFAULT_PLACE_ID);
  assert.equal(findPlace(undefined).id, DEFAULT_PLACE_ID);
  assert.equal(isKnownPlace('atlantis'), false);
  assert.equal(isKnownPlace(42), false);
  assert.equal(isKnownPlace('busan'), true);
});
