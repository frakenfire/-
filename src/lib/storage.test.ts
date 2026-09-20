import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// storage.ts 는 window.localStorage 를 직접 만진다. 노드에는 없으니 최소한만 세운다.
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

const { loadBirth, saveBirth, clearBirth } = await import('./storage.ts');

beforeEach(() => store.clear());

// 성별은 대운이 앞으로 가는지 뒤로 가는지를 가른다. 예전엔 loadBirth 가
// 이 값을 버려서, 새로고침 한 번에 열 해 흐름이 통째로 반대로 섰다.
test('성별이 저장되고 그대로 돌아온다', () => {
  for (const g of ['male', 'female'] as const) {
    saveBirth({ date: '1992-03-03', time: '13:20', name: '김한별', gender: g });
    assert.equal(loadBirth()?.gender, g);
  }
});

test('이름과 성별을 같이 돌려준다', () => {
  saveBirth({ date: '1992-03-03', time: null, name: '김한별', gender: 'female' });
  const b = loadBirth()!;
  assert.equal(b.name, '김한별');
  assert.equal(b.gender, 'female');
  assert.equal(b.time, null);
});

test('넣을 때 쓴 달력이 그대로 돌아온다', () => {
  saveBirth({ date: '1975-06-11', time: '09:00', name: '김한별', gender: 'male', calendar: 'lunar' });
  assert.equal(loadBirth()?.calendar, 'lunar');
  saveBirth({ date: '1975-06-11', time: '09:00', name: '김한별', gender: 'male', calendar: 'solar' });
  assert.equal(loadBirth()?.calendar, 'solar');
});

test('윤달은 음력으로 넣었을 때만 남는다', () => {
  saveBirth({ date: '2023-04-20', time: null, calendar: 'lunar', leap: true });
  assert.equal(loadBirth()?.leap, true);
  // 양력으로 넣었는데 윤달이 붙어 있으면 앞뒤가 안 맞는 값이다. 흘려보낸다.
  saveBirth({ date: '2023-04-20', time: null, calendar: 'solar', leap: true });
  assert.equal(loadBirth()?.leap, undefined);
});

test('이상한 값은 통째로 버린다', () => {
  store.set('tomorrowNoteBirth', JSON.stringify({ date: '1992-03-03', time: '25:00' }));
  assert.equal(loadBirth(), null);
  store.set('tomorrowNoteBirth', JSON.stringify({ date: 42 }));
  assert.equal(loadBirth(), null);
  store.set('tomorrowNoteBirth', '{{{');
  assert.equal(loadBirth(), null);
});

test('모르는 성별 값은 안 받는다', () => {
  store.set('tomorrowNoteBirth', JSON.stringify({ date: '1992-03-03', time: null, gender: 'x' }));
  assert.equal(loadBirth()?.gender, undefined);
});

test('지우면 아무것도 안 남는다', () => {
  saveBirth({ date: '1992-03-03', time: null, name: '김한별', gender: 'male' });
  clearBirth();
  assert.equal(loadBirth(), null);
});

test('태어난 곳이 저장되고 아는 값만 돌아온다', () => {
  saveBirth({ date: '1992-03-03', time: '13:20', place: 'busan' });
  assert.equal(loadBirth()?.place, 'busan');
  // 모르는 값이 남아 있으면 경도가 없는 채로 계산이 서울로 조용히 돌아간다
  store.set('tomorrowNoteBirth', JSON.stringify({ date: '1992-03-03', time: null, place: 'atlantis' }));
  assert.equal(loadBirth()?.place, undefined);
});
