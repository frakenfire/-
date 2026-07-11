// 광고 결과 판정 — SDK 비의존 순수 로직(테스트 가능). ads.ts 가 이걸 재export 한다.

export type AdResult =
  | { status: 'rewarded'; unitType?: string; unitAmount?: number }
  | { status: 'dismissed' }
  | { status: 'failed'; code?: string }
  | { status: 'unsupported' };

/** 보상 지급 여부 — 'userEarnedReward'(rewarded)일 때만 true. */
export function isRewarded(result: AdResult): boolean {
  return result.status === 'rewarded';
}

/**
 * 광고 미지원(구버전 토스 등)일 때 기능을 무료로 열지 여부.
 * '보상 위장'이 아니라, 광고를 아예 못 보는 사용자를 위한 명시적 정책이다.
 * dismissed/failed 와는 분명히 구분한다(그쪽은 절대 열리면 안 됨).
 */
export function isUnsupportedFreePass(result: AdResult): boolean {
  return result.status === 'unsupported';
}

/** 결과 상태에 맞는 사용자 안내 문구. */
export function adResultMessage(result: AdResult): string {
  switch (result.status) {
    case 'dismissed':
      return '광고를 끝까지 봐야 열려요';
    case 'failed':
      return '앗, 광고를 불러오지 못했어요. 잠시 후 다시 시도해요';
    default:
      return '';
  }
}
