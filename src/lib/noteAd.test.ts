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

// ── 앱인토스 인앱광고 문서와 코드를 맞대본다 ──────────────────────────
// 문서의 규칙은 브라우저에서 한 번도 안 밟힌다. isSupported() 가 false 라
// 실제 SDK 길이 통째로 지나가기 때문이다. 그래서 소스를 직접 읽는다.
const ADS = readFileSync(new URL('./ads.ts', import.meta.url), 'utf8');
const APP = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

test('보여주기 전에 반드시 불러온다', () => {
  // 문서: '광고는 반드시 load -> show -> (다음 load) 순서로 호출해 주세요.'
  assert.ok(/loadFullScreenAd\(/.test(ADS), 'loadFullScreenAd 를 아예 안 불러요');
  // showRewardAd 본문 안에서만 순서를 본다. 파일 전체로 보면 함수 선언이
  // 먼저 나와서 늘 통과한다 - 처음 쓸 때 실제로 그렇게 헛돌았다.
  const body = ADS.slice(ADS.indexOf('export async function showRewardAd'));
  const awaitLoad = body.indexOf('await awaitLoaded(placement)');
  const show = body.indexOf('realRewardAd(placement');
  assert.ok(awaitLoad > 0, '불러오기를 기다리지 않아요');
  assert.ok(show > awaitLoad, '불러오기를 기다리기 전에 보여주고 있어요');
});

test('보여준 뒤에 다음 것을 미리 불러둔다', () => {
  const at = ADS.indexOf('const done = (r: AdResult)');
  const block = ADS.slice(at, ADS.indexOf('resolve(r);', at));
  assert.ok(/preloadAd\(placement\)/.test(block), '다음 광고를 안 불러둬요');
});

test('콜백 등록을 풀어준다', () => {
  assert.ok(/unregister\(\)/.test(ADS), 'unregister 를 안 불러요');
});

test("보상은 'userEarnedReward' 일 때만 준다", () => {
  assert.ok(/earned = true/.test(ADS));
  // dismissed 가지에서 earned 를 안 보고 rewarded 를 주면 안 된다
  const m = ADS.match(/event\.type === 'dismissed'\) \{\s*\n\s*done\(([^)]*)\)/);
  assert.ok(m, "dismissed 처리를 못 찾았어요");
  assert.ok(m[1].includes('earned ?'), `보상을 그냥 줘요: ${m[1]}`);
});

test('개발 중에는 테스트 광고 ID 를 쓴다', () => {
  // 문서: '실제 광고 ID로 테스트하면 정책 위반으로 간주해 불이익을 받을 수 있어요.'
  assert.ok(ADS.includes("'ait-ad-test-rewarded-id'"), '문서에 적힌 테스트 ID 가 없어요');
  assert.ok(/startsWith\('REPLACE_'\) \? AD_TEST_GROUP/.test(ADS),
    '콘솔 값이 비었을 때 테스트 ID 로 넘어가지 않아요');
});

test('화면에 들어설 때 미리 불러온다', () => {
  // 문서의 '나쁜 예': 버튼 클릭 시 load 하고 바로 show
  assert.ok(/preloadAd\('note'\)/.test(APP), '쪽지 화면에서 미리 안 불러요');
  assert.ok(/preloadAd\('concern'\)/.test(APP), '결과 화면에서 미리 안 불러요');
  assert.ok(/preloadAd\('compat'\)/.test(APP), '궁합 화면에서 미리 안 불러요');
});

test('한 흐름에 광고를 두 번 붙이지 않는다', () => {
  // 입구에서 광고를 보고 들어온 길이면 쪽지 광고는 안 붙인다
  assert.equal(shouldShowNoteAd(2, true), false);
  assert.equal(shouldShowNoteAd(9, true), false);
  assert.equal(shouldShowNoteAd(2, false), true);
  assert.ok(/shouldShowNoteAd\(drawsToday, paidAtEntry\.current\)/.test(APP),
    'App 이 입구에서 낸 값을 안 보고 있어요');
});

test('그룹 하나를 세 자리에 같이 써도 한 번만 불러온다', () => {
  // 문서: 'adGroupId가 같으면 한 번에 하나의 광고만 미리 로드할 수 있어요.'
  // 콘솔 그룹을 하나만 만들어 셋에 같이 넣는 것도 되는 길이라, 그때
  // 같은 그룹을 세 번 불러오면 안 된다.
  assert.ok(/const loaded = new Map<string, Pending>/.test(ADS),
    '미리 불러둔 것을 자리 이름으로 세고 있어요. adGroupId 로 세야 해요');
  assert.ok(/if \(loaded\.has\(adGroupId\)\) return;/.test(ADS),
    '같은 그룹을 또 불러오는 걸 안 막아요');
  assert.ok(/loaded\.get\(groupIdOf\(placement\)\)/.test(ADS),
    '기다릴 때도 그룹으로 찾아야 해요');
});

test('콘솔 광고 그룹이 없으면 운영에서는 광고를 안 부르고 그냥 열어준다', () => {
  // 광고 그룹은 '구글의 광고 시스템에 반영된 후' 에야 나온다. 그걸 기다리느라
  // 출시를 미루지 않는다. 대신 테스트 광고를 실사용자에게 띄우지도 않는다.
  assert.ok(/function adsConfigured\(\): boolean/.test(ADS), 'adsConfigured 가 없어요');
  assert.ok(/!adsConfigured\(\) && import\.meta\.env\.PROD\) return \{ status: 'unsupported' \}/.test(ADS),
    '광고 그룹이 없는 운영 빌드에서 광고를 부르려고 해요');
  // unsupported 는 '광고를 못 보는 사람에게는 그냥 열어준다' 는 뜻이라
  // 이 상태에서 기능이 잠기지 않는다
  assert.ok(/isUnsupportedFreePass/.test(APP), 'App 이 무료 통과를 안 보고 있어요');
});
