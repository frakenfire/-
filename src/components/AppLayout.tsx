import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  bottom?: ReactNode;
  onBack?: () => void;
  title?: string;
  /** 0~1 진행률. 지정 시 상단 진행바 표시 */
  step?: number;
  totalSteps?: number;
};

// PRD §6 — 상단 Navigation + body + 하단 고정 CTA. 375px 기준.
// onBack·title 은 받기만 하고 그리지 않는다. 뒤로가기와 화면 이름은 토스 내비게이션
// 바가 이미 보여준다 — 자체 헤더를 같이 두면 뒤로가기가 둘이 돼 검토에서 반려됐다
// (2026-10-01). 토스 뒤로가기는 App 의 handleHardwareBack 이 같은 길로 처리한다.
export function AppLayout({ children, bottom, step, totalSteps }: Props) {
  return (
    <div className="app">
      {/* 위 여백(Safe Area)만 남긴다 */}
      <div className="app__nav app__nav--empty" aria-hidden />

      <div className="app__body">
        {typeof step === 'number' && totalSteps ? (
          <div className="progress" aria-hidden>
            <div className="progress__fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        ) : null}
        {children}
      </div>

      {bottom ? <div className="app__bottom">{bottom}</div> : null}
    </div>
  );
}
