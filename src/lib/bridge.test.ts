import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  saveBase64Data, getServerTime, eventLog, requestReview, requestNotificationAgreement,
} from '@apps-in-toss/web-framework';

// 설치된 SDK 가 어떤 함수에 isSupported 를 붙여주는지 런타임으로 확인한다.
//
// 왜: toss.ts 의 supported() 가 'isSupported 가 없으면 못 쓴다' 로 읽고 있었다.
// 그런데 SDK 는 getServerTime 과 requestReview 에만 붙여준다. 그래서
// saveBase64Data 는 토스 웹뷰 안에서도 영영 안 불렸다 - 궁합 카드 저장이
// 네이티브 경로를 한 번도 안 탔다는 뜻이다.
//
// SDK 가 나중에 isSupported 를 붙이거나 떼면 이 테스트가 먼저 깨진다.
// 그때 supported() 의 전제를 다시 봐야 한다.
const HAS_IS_SUPPORTED = { getServerTime, requestReview };
const NO_IS_SUPPORTED = { saveBase64Data, eventLog, requestNotificationAgreement };

test('SDK 가 isSupported 를 주는 함수가 그대로다', () => {
  for (const [name, fn] of Object.entries(HAS_IS_SUPPORTED)) {
    assert.equal(typeof fn, 'function', `${name} 이 SDK 에서 없어졌어요`);
    assert.equal(typeof (fn as { isSupported?: unknown }).isSupported, 'function',
      `${name} 의 isSupported 가 없어졌어요 - supported() 전제를 다시 보세요`);
  }
});

test('SDK 가 isSupported 를 안 주는 함수도 그대로다', () => {
  for (const [name, fn] of Object.entries(NO_IS_SUPPORTED)) {
    assert.equal(typeof fn, 'function', `${name} 이 SDK 에서 없어졌어요`);
    assert.equal(typeof (fn as { isSupported?: unknown }).isSupported, 'undefined',
      `${name} 에 isSupported 가 생겼어요 - supported() 로 게이팅할 수 있습니다`);
  }
});

test('isSupported 가 없는 함수를 못 쓴다고 판정하지 않는다', () => {
  const src = readFileSync(new URL('./toss.ts', import.meta.url), 'utf8');
  // supported() 가 '없으면 false' 로 돌아가면 위 셋이 통째로 죽는다
  assert.doesNotMatch(src, /typeof s === 'function' \? s\(\) : false/,
    "isSupported 가 없는 함수를 '못 쓴다' 로 판정하고 있습니다");
  assert.match(src, /return typeof fn === 'function';/, 'isSupported 가 없으면 존재로 판정해야 합니다');
});

test('토스 밖에서는 네이티브 저장을 부르지 않는다', () => {
  const src = readFileSync(new URL('./toss.ts', import.meta.url), 'utf8');
  // 브라우저에서 부르면 브릿지가 던지고, 그때 웹 폴백으로 못 내려가면
  // 개발/프리뷰에서 저장이 통째로 실패한다
  assert.match(src, /inTossWebView\(\) && supported\(tossSaveBase64Data\)/);
  assert.match(src, /ReactNativeWebView/, 'SDK 브릿지와 같은 신호를 봐야 합니다');
});
