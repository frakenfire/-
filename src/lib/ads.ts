// PRD §14 — 광고 mock 함수. 모든 함수는 Promise<boolean> 반환, 성공 시 true.
// 광고 실패 시에도 사용자 불이익 없이 기본 화면을 유지한다. (PRD §7)

const MOCK_DELAY_MS = 500;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 결과 진입 전 전면형 광고 (PRD §7.1) */
export async function showInterstitialBeforeResult(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}

/** 상세 운세 보기 — 리워드 광고 */
export async function showRewardAdForDetail(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}

/** 결과 카드 저장 — 리워드 광고 */
export async function showRewardAdForSaveImage(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}

/** 다른 쪽지 추가 뽑기 — 리워드 광고 */
export async function showRewardAdForRetry(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}

/** 친구 궁합 결과 열기 — 리워드 광고 */
export async function showRewardAdForCompat(): Promise<boolean> {
  await wait(MOCK_DELAY_MS);
  return true;
}
