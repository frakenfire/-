import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { LetterCard } from '../components/LetterCard';
import { Disclaimer } from '../components/Disclaimer';
import { AdBadge, AdBanner } from '../components/AdNotice';
import type { FortuneResult, Note } from '../types/fortune';

type Props = {
  result: FortuneResult;
  note: Note;
  busy: boolean;
  subscribed: boolean;
  onSubscribe: () => void;
  onDetail: () => void;
  onSave: () => void;
  onShare: () => void;
  onRetry: () => void;
  onBack: () => void;
};

// 결과 = 오늘의 행동 처방 브리핑.
// ✅하면 좋은 것 / 🚫피할 것이 주인공, 요정의 편지는 원하는 사람만 펼쳐 읽는다.
// 공유는 "친구에게 도움 주기"로 첫 번째 액션.
export function ResultScreen({
  result,
  note,
  busy,
  subscribed,
  onSubscribe,
  onDetail,
  onSave,
  onShare,
  onRetry,
  onBack,
}: Props) {
  const { luck, rarity } = result;
  const [letterOpen, setLetterOpen] = useState(false);

  return (
    <AppLayout onBack={onBack} title="오늘의 쪽지">
      {/* 브리핑 카드 */}
      <div
        className={`briefing briefing--${rarity.tier} fade-in`}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {luck.total >= 88 || rarity.special ? (
          <div className="confetti" aria-hidden>
            {['🎉', '✨', '⭐', '💙', '✨', '🎊', '⭐', '✨'].map((e, i) => (
              <span
                key={i}
                className="confetti__bit"
                style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 0.12}s` }}
              >
                {e}
              </span>
            ))}
          </div>
        ) : null}

        <div className="briefing__chips">
          <span className="chip chip--type">
            {note.icon} {result.title}
          </span>
          <span className="chip chip--score">
            총운 <b>{luck.total}점</b> · {luck.grade}
          </span>
          <span className={`rarity-badge rarity-badge--${rarity.tier}`}>
            {rarity.emoji} {rarity.label}
          </span>
        </div>

        <p className="briefing__highlight">
          <mark>{result.pinpoint}</mark>
        </p>

        <div className="verdict verdict--do">
          <span className="verdict__label">✅ 오늘 하면 좋아요</span>
          <ul className="verdict__list">
            {result.dos.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>

        <div className="verdict verdict--dont">
          <span className="verdict__label">🚫 오늘은 피하세요</span>
          <ul className="verdict__list">
            <li>{result.dont}</li>
          </ul>
        </div>

        <p className="briefing__lucky">
          🍀 행운 포인트 <b>{result.luckyHint}</b>
        </p>
      </div>

      <div className="btn-stack">
        {/* 공유 = 친구에게 오늘의 처방 보내주기 (광고 없음, 첫 번째 액션) */}
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onShare}>
          이 처방, 친구한테 보내주기 💌
        </button>

        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setLetterOpen((v) => !v)}
        >
          {letterOpen ? '요정의 편지 접기' : '요정이 쓴 편지도 읽기 💌'}
        </button>
      </div>

      {letterOpen ? (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <LetterCard letter={result.letter} score={luck.total} rarity={rarity} />
        </div>
      ) : null}

      <div className="btn-stack" style={{ marginTop: 'var(--space-3)' }}>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={onDetail}>
          항목별 운세랑 행운 세트도 볼래요 <AdBadge label="광고" />
        </button>

        <button type="button" className="btn btn--ghost" disabled={busy} onClick={onSave}>
          결과 카드로 저장하기 <AdBadge label="광고" />
        </button>

        <button type="button" className="btn btn--ghost" disabled={busy} onClick={onRetry}>
          다른 쪽지도 뽑아볼래요 <AdBadge label="광고" />
        </button>
      </div>

      {!subscribed ? (
        <button type="button" className="subscribe-card" onClick={onSubscribe}>
          <span className="subscribe-card__icon" aria-hidden>
            🔔
          </span>
          <span className="subscribe-card__body">
            <span className="subscribe-card__title">내일 처방도 받아볼래요?</span>
            <span className="subscribe-card__desc">매일 아침, 쪽지 요정이 배달해드려요</span>
          </span>
          <span className="subscribe-card__cta">받을래요</span>
        </button>
      ) : (
        <p className="tomorrow-nudge">내일 아침, 새 쪽지로 찾아올게요 💌</p>
      )}

      <AdBanner />
      <Disclaimer />
    </AppLayout>
  );
}
