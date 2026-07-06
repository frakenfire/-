import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
};

// PRD §6.2 — CTA 는 누르면 어떤 일이 일어나는지 명확해야 한다.
export function BottomAction({
  children,
  onClick,
  variant = 'primary',
  disabled,
  loading,
  ariaLabel,
}: Props) {
  return (
    <button
      type="button"
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading ? '잠시만요…' : children}
    </button>
  );
}
