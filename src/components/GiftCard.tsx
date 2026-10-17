import { useState } from 'react';
import { Icon } from './Icon.tsx';
import type { Gift } from '../data/gifts.ts';
import type { ShareOutcome } from '../lib/share.ts';

type Props = {
  choices: Gift[];
  onSend: (gift: Gift) => Promise<ShareOutcome>;
};

// 행운 반쪽 보내기 — 결과를 다 본 사람에게 한 줄 건넬 거리를 준다.
// '친구한테 보내기' 는 내 점수를 보내는 자랑이고, 이건 내 결과와 상관없는 선물이다.
// 점수가 낮은 날에도 보낼 수 있어야 해서 따로 둔다.
// 한 번 누르면 바로 공유창이 뜬다. 고르고 다시 '보내기' 를 누르는 두 단계는 안 만든다.
export function GiftCard({ choices, onSend }: Props) {
  const [sent, setSent] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  async function send(g: Gift) {
    if (sending) return;
    setSending(true);
    try {
      const r = await onSend(g);
      if (r === 'shared' || r === 'copied') setSent(g.id);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="giftcard sec-card">
      <div className="giftcard__head">
        <span className="giftcard__icon" aria-hidden><Icon name="gift" size={20} /></span>
        <div>
          <p className="giftcard__title">행운 반쪽 보내기</p>
          <p className="giftcard__hint">운세 점수는 보내지 않고, 고른 한마디만 봉투에 담아요.</p>
        </div>
      </div>
      <ul className="giftcard__list">
        {choices.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              className={`giftcard__row${sent === g.id ? ' giftcard__row--sent' : ''}`}
              disabled={sending}
              onClick={() => void send(g)}
            >
              <span className="giftcard__line">{g.line}</span>
              <span className="giftcard__go">{sent === g.id ? '보냈어요' : '보내기'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
