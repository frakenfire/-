import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldShowNoteAd } from './adPolicy.ts';

// 오늘 첫 쪽지는 광고 없이 연다. 이건 취향이 아니라 이 앱이 검수 서류에
// 적어둔 약속이라(release/LAUNCH.md '무료 결과 광고 없이 제공'), 조용히
// 뒤집히면 심사에서 말이 달라진다.
test('오늘 첫 장은 광고 없이 연다', () => {
  assert.equal(shouldShowNoteAd(1), false);
});

test('두 번째부터가 광고 자리다', () => {
  assert.equal(shouldShowNoteAd(2), true);
  assert.equal(shouldShowNoteAd(3), true);
  assert.equal(shouldShowNoteAd(9), true);
});

// 세는 걸 잊고 부르면 첫 장에도 광고가 뜬다. 호출부가 실제로 횟수를 보고
// 있는지까지 못 박는다 - 전에 뽑을 때마다 부르던 코드가 바로 이 모양이었다.
test('App 은 횟수를 세고 나서 부른다', () => {
  const src = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const call = src.indexOf("showRewardAd('note')");
  assert.ok(call > 0, "App.tsx 에서 showRewardAd('note') 를 못 찾았어요");
  const guard = src.indexOf('shouldShowNoteAd(');
  assert.ok(guard > 0 && guard < call, '광고를 부르기 전에 shouldShowNoteAd 로 걸러야 해요');
  const count = src.indexOf('incrementDailyDrawCount(');
  assert.ok(count > 0 && count < guard, '횟수를 먼저 센 다음에 판단해야 해요');
});
