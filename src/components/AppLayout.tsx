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
  /** 콘텐츠가 짧은 화면(선택지 하나 고르기 등)용 — 화면 아래에 큰 빈 공간이
   * 남지 않도록 body를 수직 중앙 정렬한다. */
  center?: boolean;
};

// PRD §6 — 상단 Navigation + body + 하단 고정 CTA. 375px 기준.
export function AppLayout({
  children,
  bottom,
  onBack,
  title,
  step,
  totalSteps,
  center,
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

      <div className={center ? 'app__body app__body--center' : 'app__body'}>
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
