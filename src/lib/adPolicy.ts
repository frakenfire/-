// 광고를 언제 띄울지 정하는 규칙. 여기에 SDK 를 들이지 않는다 —
// ads.ts 는 import.meta.env 를 읽어서 노드 테스트에서 못 불러온다.
// 규칙이 테스트 밖에 있으면, 규칙이 뒤집혀도 아무도 모른다.
/**
 * 오늘 몇 번째 쪽지인가로 note 광고를 켤지 정한다.
 *
 * 이 앱이 글로 적어둔 약속은 세 군데에 있다 —
 *   App.tsx        "무료 첫 결과에는 광고를 넣지 않는다"
 *   AD_GROUPS.note "쪽지를 누른 뒤 결과 전에 한 번"
 *   release/LAUNCH.md 검수 항목  "무료 결과 광고 없이 제공 ✓"
 * 그런데 코드는 뽑을 때마다 광고를 물리고 있었다. 브라우저에서는 광고가
 * 'unsupported' 로 그냥 지나가므로 점검 셋 중 무엇도 이걸 못 봤다.
 *
 * 오늘의 첫 장은 그냥 연다. 두 번째부터가 '한 번 더' 이고, 거기가 광고 자리다.
 */
export function shouldShowNoteAd(drawsToday: number): boolean {
  return drawsToday > 1;
}
