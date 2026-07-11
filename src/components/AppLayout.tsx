import type { ReactNode } from 'react';
import { APP_NAME } from '../data/copy';

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
      <nav className="app__nav">
        {onBack ? (
          <button
            type="button"
            className="app__nav-back"
            aria-label="뒤로"
            onClick={onBack}
          >
            ‹
          </button>
        ) : (
          <span className="app__nav-back" aria-hidden />
        )}
        <span className="app__nav-title">{title ?? APP_NAME}</span>
      </nav>

      <div className="app__body">
        {typeof step === 'number' && totalSteps ? (
          <div className="progress" aria-hidden>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={
                  i < step ? 'progress__dot progress__dot--active' : 'progress__dot'
                }
              />
            ))}
          </div>
        ) : null}
        {children}
      </div>

      {bottom ? <div className="app__bottom">{bottom}</div> : null}
    </div>
  );
}
