import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  saveBase64Data, getServerTime, eventLog, requestReview, requestNotificationAgreement,
  share, getTossShareLink, showFullScreenAd, generateHapticFeedback,
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
// 앱이 실제로 쓰는 브릿지 함수 전부. 네 파일(toss.ts, share.ts, ads.ts,
// haptic.ts)이 SDK 를 import 하고, 그 안에서 부르는 게 아래 아홉이다.
const HAS_IS_SUPPORTED = { getServerTime, requestReview, showFullScreenAd };
const NO_IS_SUPPORTED = {
  saveBase64Data, eventLog, requestNotificationAgreement,
  share, getTossShareLink, generateHapticFeedback,
};

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


// 콜백으로 돌려주는 API 두 개. SDK 가 이걸 Promise 로 바꾸면 앱은 조용히
// 망가진다 - await 이 즉시 풀리고 onEvent 는 영영 안 온다. 타입으로 잡는다.
test('콜백 API 가 Promise 로 바뀌지 않았다', () => {
  // showFullScreenAd({onEvent,onError,options}) => 해제 함수
  const stopAd: () => void = showFullScreenAd({
    options: { adGroupId: 'x' },
    onEvent: () => {},
    onError: () => {},
  });
  assert.equal(typeof stopAd, 'function', 'showFullScreenAd 가 해제 함수를 안 돌려줍니다');
  stopAd();

  // requestNotificationAgreement({options,onEvent,onError}) => 해제 함수
  const stopNoti: () => void = requestNotificationAgreement({
    options: { templateCode: 'x' },
    onEvent: () => {},
    onError: () => {},
  });
  assert.equal(typeof stopNoti, 'function', 'requestNotificationAgreement 가 해제 함수를 안 돌려줍니다');
  stopNoti();
});

// 브릿지를 부르는 파일은 넷뿐이다. 다섯 번째가 생기면 여기서 알아채고
// 그 파일의 게이팅도 같이 봐야 한다.
test('SDK 를 import 하는 파일이 넷뿐이다', () => {
  const dir = new URL('../', import.meta.url).pathname;
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f)
        && readFileSync(p, 'utf8').includes("from '@apps-in-toss")) files.push(p.slice(dir.length));
    }
  };
  walk(dir);
  assert.deepEqual(files.sort(), ['lib/ads.ts', 'lib/haptic.ts', 'lib/share.ts', 'lib/toss.ts'],
    '브릿지를 부르는 파일이 바뀌었습니다. 새 파일의 게이팅도 확인하세요');
});
