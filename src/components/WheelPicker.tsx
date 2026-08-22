import { useEffect, useRef } from 'react';

export const WHEEL_ITEM_H = 44;

export type WheelItem = { value: number; label: string };

type Props = {
  items: WheelItem[];
  value: number;
  onChange: (v: number) => void;
  /** 스크린리더용 이름 (년/월/일…) */
  label: string;
  disabled?: boolean;
};

// 돌려서 고르는 피커.
//
// 왜 직접 만들었나: <input type="date"> 는 기기 로케일을 따라가서 한국 사용자에게
// '03/15/1994' 로 보이고, 네이티브 피커에서 고른 값이 앱으로 안 넘어오는 경우가 있다.
// 화면엔 값이 보이는데 버튼은 죽어 있는 상태가 실제로 나왔다.
//
// 그래서 스크롤 스냅으로 굴러가고, 보이는 항목을 눌러도 선택되게 했다.
// 돌려도 되고 눌러도 되는 게 손이 편하다.
export function WheelPicker({ items, value, onChange, label, disabled = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<number | undefined>(undefined);
  const idx = Math.max(0, items.findIndex((i) => i.value === value));

  // 값이 밖에서 바뀌면(예: 월이 바뀌어 일수가 줄면) 스크롤 위치를 맞춘다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = idx * WHEEL_ITEM_H;
    if (Math.abs(el.scrollTop - target) > 2) el.scrollTop = target;
  }, [idx]);

  function handleScroll() {
    if (disabled) return;
    window.clearTimeout(settle.current);
    // 멈춘 뒤에 확정한다. 굴러가는 도중마다 바꾸면 값이 요동친다.
    settle.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM_H)));
      if (items[i] && items[i].value !== value) onChange(items[i].value);
    }, 120);
  }

  function pick(v: number) {
    if (disabled) return;
    onChange(v);
  }

  return (
    <div className={disabled ? 'wheel wheel--off' : 'wheel'}>
      <span className="wheel__band" aria-hidden />
      <div
        ref={ref}
        className="wheel__scroll"
        onScroll={handleScroll}
        role="listbox"
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
      >
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            role="option"
            aria-selected={it.value === value}
            className={it.value === value ? 'wheel__item wheel__item--on' : 'wheel__item'}
            onClick={() => pick(it.value)}
            tabIndex={-1}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
