import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const toss = readFileSync(new URL('./toss.ts', import.meta.url), 'utf8');
const result = readFileSync(new URL('../screens/ResultScreen.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

// 알림 코드가 있는데 부르는 자리가 없었다. 편지와 같은 패턴이다.
// 반쯤 만든 기능은 있는 것보다 나쁘다 - 있다고 믿고 안 만들게 된다.
test('알림 동의를 부르는 자리가 실제로 있다', () => {
  assert.match(app, /askNotificationAgreement\(\)/, 'App 이 동의를 안 부름');
  assert.match(result, /onAskNoti/, '결과 화면에 누를 자리가 없음');
});

test('콘솔 템플릿이 비어 있으면 줄이 안 나온다', () => {
  // canAskNotification 이 false 면 onAskNoti 가 undefined 로 내려가 줄이 사라진다
  assert.match(app, /canAskNotification\(\) && !notiAsked \? handleAskNoti : undefined/);
  assert.match(toss, /return !NOTI_TEMPLATE_CODE\.startsWith\('REPLACE_'\)/);
});

test('한 번만 묻는다', () => {
  assert.match(app, /markNotiAsked\(\)/, '물어본 사실을 안 남김');
  assert.match(app, /hasAskedNoti\(\)/, '물어봤는지 안 읽음');
});

test('먼저 띄우지 않는다 - 누를 때만 뜬다', () => {
  // 화면에 들어오자마자 동의 UI 를 띄우면 그 자리에서 나간다.
  // useEffect 안에서 부르고 있으면 실패시킨다.
  const inEffect = /useEffect\([\s\S]{0,600}?askNotificationAgreement/.test(app);
  assert.equal(inEffect, false, '화면 진입에 알림을 띄우고 있어요');
});

test('SDK 모양대로 감쌌다', () => {
  // requestNotificationAgreement 는 Promise 가 아니라 콜백과 해제 함수를 준다
  assert.match(toss, /onEvent:/);
  assert.match(toss, /onError:/);
  assert.match(toss, /templateCode: NOTI_TEMPLATE_CODE/);
});
