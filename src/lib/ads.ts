// 광고 어댑터 — 보상 무결성(reward integrity)이 핵심.
// 앱인토스 공식 SDK(showFullScreenAd)는 'userEarnedReward' 이벤트가 왔을 때만
// 보상을 지급해야 한다. dismissed/failed/미지원은 절대 rewarded 로 위장하지 않는다.
//
// 환경 분기:
//  - 토스 웹뷰(실기기/샌드박스): 실제 SDK 호출 (isSupported() === true)
//  - 그 외(로컬 개발·웹 프리뷰): mock (개발 편의). 단, mock 은 운영 번들에서
//    빌드 가드(CI: scripts/check-no-mock, .github/workflows/ci.yml)로 차단한다.
import { showFullScreenAd } from '@apps-in-toss/web-framework';
import type { AdResult } from './adResult';

export { isRewarded, isUnsupportedFreePass, adResultMessage } from './adResult';
export type { AdResult } from './adResult';

// 광고 지점별 adGroupId.
// ⚠️ TODO(콘솔): 앱인토스 콘솔에서 발급받은 실제 adGroupId 로 교체해야 운영 노출됨.
// 'REPLACE_' 접두사가 남아 있으면 CI 가드가 빌드를 실패시킨다.
export const AD_GROUPS = {
  detail: 'REPLACE_REWARD_DETAIL',
  saveImage: 'REPLACE_REWARD_SAVE',
  retry: 'REPLACE_REWARD_RETRY',
  compat: 'REPLACE_REWARD_COMPAT',
} as const;

export type AdPlacement = keyof typeof AD_GROUPS;

const AD_TIMEOUT_MS = 20_000;

function realAdSupported(): boolean {
  try {
    return typeof showFullScreenAd?.isSupported === 'function' && showFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

// 로컬 개발 서버(npm run dev)에서만 mock. 운영/프리뷰 빌드는 실 SDK 경로를 타고,
// 토스 밖(프리뷰)·구버전 토스에서는 isSupported()===false → 'unsupported'.
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

function realRewardAd(adGroupId: string): Promise<AdResult> {
  return new Promise((resolve) => {
    let earned = false;
    let settled = false;
    const done = (r: AdResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
    try {
      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event: { type: string; data?: { unitType?: string; unitAmount?: number } }) => {
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

/** 지정한 지점의 보상형 광고를 노출하고, 구조화된 결과를 돌려준다. 절대 throw 하지 않는다. */
export async function showRewardAd(placement: AdPlacement): Promise<AdResult> {
  if (USE_MOCK) return withTimeout(mockRewardAd(), AD_TIMEOUT_MS);
  if (!realAdSupported()) return { status: 'unsupported' };
  const adGroupId = AD_GROUPS[placement];
  if (adGroupId.startsWith('REPLACE_')) {
    // 콘솔 adGroupId 미설정 — 운영에서 광고를 못 여니 보상도 없음(위장 금지).
    return { status: 'failed', code: 'no-ad-group' };
  }
  return withTimeout(realRewardAd(adGroupId), AD_TIMEOUT_MS);
}

