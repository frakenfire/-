import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRewarded, isUnsupportedFreePass, type AdResult } from './adResult.ts';

// 보상 무결성: 광고를 완주(rewarded)했을 때만 기능이 열려야 한다.
test('rewarded 만 잠금 해제한다', () => {
  assert.equal(isRewarded({ status: 'rewarded' }), true);
});

test('dismissed(중간 닫기)는 절대 잠금 해제하지 않는다', () => {
  const r: AdResult = { status: 'dismissed' };
  assert.equal(isRewarded(r), false);
  assert.equal(isUnsupportedFreePass(r), false);
});

test('failed(로드/표시 실패)는 절대 잠금 해제하지 않는다', () => {
  const r: AdResult = { status: 'failed', code: 'timeout' };
  assert.equal(isRewarded(r), false);
  assert.equal(isUnsupportedFreePass(r), false);
});

test('unsupported 는 명시적 무료 정책으로만 통과(보상 위장 아님)', () => {
  const r: AdResult = { status: 'unsupported' };
  assert.equal(isRewarded(r), false); // 보상으로 위장하지 않음
  assert.equal(isUnsupportedFreePass(r), true); // 별도 정책으로만 통과
});

// ── 전체 삭제 무결성 — '내 데이터 전체 삭제'가 이 앱의 키를 하나도 안 남기는지 ──
import { clearAllData } from './storage.ts';

test('clearAllData 는 tomorrowNote 접두사 키를 전부 지운다', () => {
  const store = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      get length() { return store.size; },
      key: (i: number) => [...store.keys()][i] ?? null,
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    },
  };
  store.set('tomorrowNoteZodiac', 'dog');
  store.set('tomorrowNoteNotiAsked', 'agreed');
  store.set('tomorrowNoteLastVariant:pin:soso', '[1,2]');
  store.set('otherAppKey', 'keep'); // 남의 키는 건드리지 않는다
  assert.equal(clearAllData(), true);
  assert.deepEqual([...store.keys()], ['otherAppKey']);
});
