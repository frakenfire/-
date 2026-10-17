import { useState } from 'react';
import { AppLayout } from '../components/AppLayout.tsx';
import { Mascot } from '../components/Mascot.tsx';
import type { Gift } from '../data/gifts.ts';

type Props = {
  gift: Gift;
  /** 봉투를 연 순간 한 번 */
  onOpened: () => void;
  /** 나도 오늘 쪽지 뽑기 */
  onStart: () => void;
  onClose: () => void;
};

// 받은 행운 봉투 — 친구가 보낸 링크로 들어온 사람이 처음 보는 화면.
// 이 사람은 앱을 처음 여는 사람일 수 있다. 그래서 할 일은 둘뿐이다.
// 봉투를 연다, 그리고 내 쪽지를 뽑으러 간다.
export function GiftScreen({ gift, onOpened, onStart, onClose }: Props) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    if (open) return;
    setOpen(true);
    onOpened();
  }

  return (
    <AppLayout
      onBack={onClose}
      bottom={
        open ? (
          <div className="btn-stack">
            <button type="button" className="btn btn--primary" onClick={onStart}>
              나도 오늘 쪽지 열어보기
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              다음에 할게요
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--primary" onClick={handleOpen}>
            봉투 열어보기
          </button>
        )
      }
    >
      <div className="gift">
        <p className="gift__k">행운 반쪽</p>
        <h1 className="h1 gift__title">
          {open ? '봉투 안에는 이런 말이 들어 있어요' : '누군가 작은 행운을 보냈어요'}
        </h1>

        {/* 봉투 — 누르면 뚜껑이 열리고 쪽지가 올라온다.
            투명도는 건드리지 않는다. 웹뷰가 애니메이션을 멈추면
            투명한 채로 갇혀 쪽지가 안 보인다. 위치만 움직인다. */}
        <button
          type="button"
          className={`envelope${open ? ' envelope--open' : ''}`}
          onClick={handleOpen}
          aria-label={open ? '열린 봉투' : '봉투 열기'}
          disabled={open}
        >
          <span className="envelope__back" aria-hidden />
          {/* 쪽지에는 얼굴만 그린다. 한마디는 봉투 밖 아래에 쓴다.
              애니메이션이 멈춘 웹뷰에서는 쪽지가 주머니 안에 그대로 남아서,
              한마디를 쪽지에 쓰면 열었는데도 안 보인다. */}
          <span className="envelope__letter" aria-hidden>
            <Mascot size={56} score={90} bare />
          </span>
          <span className="envelope__front" aria-hidden />
          <span className="envelope__flap" aria-hidden />
        </button>

        {open ? <p className="gift__msg">{gift.line}</p> : null}

        <p className="gift__note">
          {open
            ? '누가 보냈는지는 알 수 없어요. 좋은 하루를 바라는 마음만 담겨 있어요.'
            : '봉투를 누르면 짧은 한마디를 볼 수 있어요.'}
        </p>
      </div>
    </AppLayout>
  );
}
