// PRD §6.1 / §11.3 — 광고는 예상 가능한 지점에서만.
// 버튼에 "광고 보고 ~" 처럼 보상을 명확히 표시하기 위한 작은 배지/배너.

export function AdBadge({ label = '광고' }: { label?: string }) {
  return (
    <span className="ad-notice" aria-label={`${label} 안내`}>
      <span aria-hidden>▷</span>
      {label}
    </span>
  );
}

// 결과 하단 배너 (mock). 실제 SDK 연동 시 배너 컴포넌트로 교체.
export function AdBanner() {
  return (
    <div className="ad-banner" role="complementary" aria-label="배너 광고 영역">
      배너 광고 영역 (mock)
    </div>
  );
}
