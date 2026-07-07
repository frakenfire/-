import type { FortuneTypeMeta } from '../data/fortuneTypes';

type Props = {
  meta: FortuneTypeMeta;
  selected?: boolean;
  onClick: () => void;
};

// PRD §5.1 — 홈 운세 메뉴 행. 선택 상태 = SIGNATURE GREEN.
export function FortuneTypeButton({ meta, selected, onClick }: Props) {
  return (
    <button
      type="button"
      className={selected ? 'menu-row menu-row--selected' : 'menu-row'}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="menu-row__icon" aria-hidden>
        {meta.icon}
      </span>
      <span className="menu-row__body">
        <span className="menu-row__title">{meta.label}</span>
        <span className="menu-row__desc">{meta.desc}</span>
      </span>
      <span className="menu-row__chevron" aria-hidden>
        ›
      </span>
    </button>
  );
}
