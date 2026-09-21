// 광고 어댑터 — 보상 무결성(reward integrity)이 핵심.
// 앱인토스 공식 SDK(showFullScreenAd)는 'userEarnedReward' 이벤트가 왔을 때만
// 보상을 지급해야 한다. dismissed/failed/미지원은 절대 rewarded 로 위장하지 않는다.
//
// 환경 분기:
//  - 토스 웹뷰(실기기/샌드박스): 실제 SDK 호출 (isSupported() === true)
//  - 그 외(로컬 개발·웹 프리뷰): mock (개발 편의). 단, mock 은 운영 번들에서
//    빌드 가드(CI: scripts/check-no-mock, .github/workflows/ci.yml)로 차단한다.
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import type { AdResult } from './adResult.ts';

export { isRewarded, isUnsupportedFreePass, adResultMessage } from './adResult.ts';
export type { AdResult } from './adResult.ts';

// 광고 지점별 adGroupId.
//  TODO(콘솔): 앱인토스 콘솔에서 발급받은 실제 adGroupId 로 교체해야 운영 노출됨.
//
// 'REPLACE_' 가 남아 있으면 showRewardAd 가 호출 자체를 막고 'unsupported' 를
// 돌려준다 (아래 참고). 제출 전 점검은 scripts/check-release.mjs 가 한다 —
// 기본 실행에서는 남은 값을 목록으로 보여주고, --release 로 돌리면 실패시킨다.
// npm run check:release / npm run check:release -- --release
// 여기 적힌 것은 전부 제출 전에 앱인토스 콘솔에서 발급받아 채워야 하는 값이다.
// 그러니 실제로 부르는 자리만 적어야 한다. 전에는 여섯 개가 적혀 있었는데
// 부르는 곳은 셋뿐이라(detail·saveImage·retry 는 '예비'로 남아 있었다),
// 쓰지도 않을 광고 자리 셋을 콘솔에서 더 만들라고 시키고 있었다.
// 카드 저장은 무료로 둔다 - 저장하고 공유해서 들어오는 길에 마찰을 안 넣는다.
export const AD_GROUPS = {
  // 쪽지를 누른 뒤 결과 전에 한 번. 단 오늘 첫 장은 건너뛴다 — 규칙은
  // adPolicy.ts 의 shouldShowNoteAd 에 있고 테스트가 못 박는다.
  note: 'REPLACE_REWARD_NOTE',
  compat: 'REPLACE_REWARD_COMPAT',
  // 결과를 다 본 뒤 '다른 고민도' 를 여는 자리. 본문은 전부 무료이고
  // 여기만 광고를 낀다 — 이미 값을 받은 사람에게만 더 받겠다고 묻는다.
  concern: 'REPLACE_REWARD_CONCERN',
} as const;

export type AdPlacement = keyof typeof AD_GROUPS;


// 개발용 테스트 광고 ID. 문서에 적힌 값 그대로다.
//
// 콘솔에서 받은 adGroupId 를 아직 안 넣었으면 이걸 쓴다. 전에는 그냥
// 'no-ad-group' 으로 돌려보냈는데, 그러면 실기기에 올려도 광고 흐름을
// 한 번도 못 밟아본 채로 제출하게 된다. 반대로 실제 ID 로 개발 중에
// 테스트하는 건 정책 위반이라, 둘 다 피하려면 테스트 ID 가 맞다.
//
// 제출을 막는 건 scripts/check-release.mjs 다 - REPLACE_ 가 남아 있으면
// npm run check:release -- --release 가 실패한다.
const AD_TEST_GROUP = 'ait-ad-test-rewarded-id';

const AD_TIMEOUT_MS = 20_000;
// 미리 불러오는 데 쓰는 시간. show 를 누른 뒤 이만큼은 기다려 준다.
const AD_LOAD_TIMEOUT_MS = 8_000;

function realAdSupported(): boolean {
  try {
    return typeof showFullScreenAd?.isSupported === 'function' && showFullScreenAd.isSupported()
      && typeof loadFullScreenAd?.isSupported === 'function' && loadFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

/** 이 자리에 실제로 넘길 adGroupId. 콘솔 값이 없으면 테스트 ID. */
function groupIdOf(placement: AdPlacement): string {
  const id = AD_GROUPS[placement];
  return id.startsWith('REPLACE_') ? AD_TEST_GROUP : id;
}

// 자리마다 미리 불러둔 광고 하나. 문서 규칙 그대로다 -
// 같은 adGroupId 는 한 번에 하나만 미리 불러둘 수 있다.
type Pending = { ready: Promise<boolean>; unregister: () => void };
// 열쇠는 자리 이름이 아니라 adGroupId 다.
//
// 문서: 'adGroupId가 같으면 한 번에 하나의 광고만 미리 로드할 수 있어요.'
// 세 자리에 콘솔 그룹 하나를 같이 쓰면(그래도 된다) 자리 이름으로 세는 순간
// 같은 그룹을 세 번 불러오게 된다. 그룹으로 세면 한 번만 부른다.
const loaded = new Map<string, Pending>();

/**
 * 광고를 미리 불러둔다. 화면에 들어설 때 부른다.
 *
 * 문서: '광고는 반드시 load -> show -> (다음 load) 순서로 호출해 주세요.'
 * 전에는 show 만 부르고 load 를 아예 안 불렀다. 그러면 실기기에서 광고가
 * 안 뜬다. 브라우저에서는 isSupported() 가 false 라 이 길을 한 번도 안
 * 밟아서, 검사 셋 중 무엇도 이걸 못 봤다.
 */
export function preloadAd(placement: AdPlacement): void {
  if (USE_MOCK || !realAdSupported()) return;
  const adGroupId = groupIdOf(placement);
  if (loaded.has(adGroupId)) return;
  let settle: (ok: boolean) => void = () => {};
  const ready = new Promise<boolean>((resolve) => { settle = resolve; });
  let unregister: () => void = () => {};
  try {
    unregister = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => { if (event.type === 'loaded') settle(true); },
      onError: () => { settle(false); loaded.delete(adGroupId); },
    });
  } catch {
    settle(false);
    return;
  }
  loaded.set(adGroupId, { ready, unregister });
}

// 로컬 개발 서버(npm run dev)에서만 mock. 운영/프리뷰 빌드는 실 SDK 경로를 타고,
// 토스 밖(프리뷰)·구버전 토스에서는 isSupported()===false  'unsupported'.
// (import.meta.env.DEV 는 운영 빌드에서 정적으로 false 라 mock 코드가 트리셰이킹됨)
const USE_MOCK = import.meta.env.DEV;

function mockRewardAd(): Promise<AdResult> {
  // 개발 편의용: 항상 보상 성공으로 간주. (운영 번들엔 CI 가드로 포함 차단)
  return new Promise((resolve) => setTimeout(() => resolve({ status: 'rewarded' }), 400));
}

function withTimeout(p: Promise<AdResult>, ms: number): Promise<AdResult> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve({ status: 'failed', code: 'timeout' }), ms);
    p.then((r) => {
      clearTimeout(t);
      resolve(r);
    }).catch(() => {
      clearTimeout(t);
      resolve({ status: 'failed', code: 'exception' });
    });
  });
}

function realRewardAd(placement: AdPlacement, adGroupId: string): Promise<AdResult> {
  return new Promise((resolve) => {
    let earned = false;
    let settled = false;
    let unregister: () => void = () => {};
    const done = (r: AdResult) => {
      if (settled) return;
      settled = true;
      // 콜백 등록을 풀어준다. 안 풀면 화면을 오갈수록 쌓인다.
      try { unregister(); } catch { /* 이미 풀린 경우 */ }
      // 문서 권장: 하나 보여준 뒤에는 다음 것을 미리 불러둔다.
      loaded.delete(adGroupId);
      preloadAd(placement);
      resolve(r);
    };
    try {
      unregister = showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          // 보상은 'userEarnedReward' 가 왔을 때만이다. 'dismissed' 만으로
          // 주면 안 된다 - 문서에 못 박혀 있고, 이 앱의 첫 번째 원칙이다.
          if (event.type === 'userEarnedReward') {
            earned = true;
          } else if (event.type === 'dismissed') {
            done(earned ? { status: 'rewarded' } : { status: 'dismissed' });
          } else if (event.type === 'failedToShow') {
            done({ status: 'failed', code: 'failedToShow' });
          }
        },
        onError: () => done({ status: 'failed', code: 'error' }),
      });
    } catch {
      done({ status: 'failed', code: 'throw' });
    }
  });
}

/** 미리 불러둔 게 없으면 지금 불러서 기다린다. 오래 걸리면 포기한다. */
async function awaitLoaded(placement: AdPlacement): Promise<boolean> {
  preloadAd(placement);
  const pending = loaded.get(groupIdOf(placement));
  if (!pending) return false;
  return await Promise.race([
    pending.ready,
    new Promise<boolean>((r) => setTimeout(() => r(false), AD_LOAD_TIMEOUT_MS)),
  ]);
}

/** 지정한 지점의 보상형 광고를 노출하고, 구조화된 결과를 돌려준다. 절대 throw 하지 않는다. */
export async function showRewardAd(placement: AdPlacement): Promise<AdResult> {
  if (USE_MOCK) return withTimeout(mockRewardAd(), AD_TIMEOUT_MS);
  if (!realAdSupported()) return { status: 'unsupported' };
  // load -> show 순서를 지킨다. 못 불러왔으면 보여주지 않는다.
  if (!(await awaitLoaded(placement))) return { status: 'failed', code: 'not-loaded' };
  return withTimeout(realRewardAd(placement, groupIdOf(placement)), AD_TIMEOUT_MS);
}

