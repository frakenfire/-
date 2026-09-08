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
export function AppLayout({
  children,
  bottom,
  onBack,
  title,
  step,
  totalSteps,
}: Props) {
  return (
    <div className="app">
      {/* 토스 화면의 네비는 뒤로가기와(필요할 때만) 화면 이름뿐이다. 앱 이름을 매 화면
          반복하면 본문의 큰 제목과 헤더가 둘이 된다. 홈은 아예 비운다. */}
      <nav className={onBack || title ? 'app__nav' : 'app__nav app__nav--empty'}>
        {onBack ? (
          <button
            type="button"
            className="app__nav-back"
            aria-label="뒤로"
            onClick={onBack}
          >
            ‹
          </button>
        ) : null}
        {title ? <span className="app__nav-title">{title}</span> : null}
      </nav>

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
