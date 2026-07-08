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
  const { luck, rarity, dayPlan } = result;
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

        <p className="briefing__headline">{dayPlan.headline}</p>
        <p className="briefing__vibe">{dayPlan.vibe}</p>

        {/* 기분에 맞춘 하루 설계 — 결과의 주인공 */}
        <div className="plan">
          <p className="plan__title">오늘, 이렇게 보내요</p>
          <ul className="plan__steps">
            {dayPlan.steps.map((s) => (
              <li className="plan__step" key={s.when}>
                <span className="plan__when">{s.when}</span>
                <span className="plan__text">{s.text}</span>
              </li>
            ))}
          </ul>
          <div className="plan__hold">
            <span className="plan__hold-k">오늘은 접어둬요</span>
            <span className="plan__hold-v">{dayPlan.holdOff}</span>
          </div>
        </div>

        {/* 오늘의 행운 보고서 — 하루를 설계하게 돕는 훅 (타이밍·색·음식) */}
        <div className="report">
          <p className="report__head">🍀 오늘의 행운 보고서</p>
          <div className="report__grid">
            <div className="report__cell">
              <span className="report__k">타이밍</span>
              <span className="report__v">{luck.time}</span>
            </div>
            <div className="report__cell">
              <span className="report__k">행운 색</span>
              <span className="report__v">
                <i className="report__dot" style={{ background: luck.color.hex }} aria-hidden />
                {luck.color.name}
              </span>
            </div>
            <div className="report__cell">
              <span className="report__k">행운 음식</span>
              <span className="report__v">
                {luck.food.emoji} {luck.food.name}
              </span>
            </div>
          </div>
          <p className="report__why">{luck.food.why}</p>
        </div>
      </div>

      {/* 하루 풀이 — 매일 볼 만한 해석 */}
      <div className="card fade-in">
        <div className="card-head">
          <p className="card-head__title">오늘의 풀이</p>
          <p className="card-head__desc">시간대별로 하루를 미리 그려봤어요</p>
        </div>
        <div className="section">
          <p className="section__label">🔎 전체 풀이</p>
          <p className="section__lead">{result.pinpoint}</p>
          <p className="section__text">{result.reading.overall}</p>
        </div>
        <div className="section">
          <p className="section__label">🌅 오전</p>
          <p className="section__text">{result.reading.morning}</p>
        </div>
        <div className="section">
          <p className="section__label">☀️ 오후</p>
          <p className="section__text">{result.reading.afternoon}</p>
        </div>
        <div className="section">
          <p className="section__label">🌙 저녁</p>
          <p className="section__text">{result.reading.evening}</p>
        </div>
        <div className="section">
          <p className="section__label">🤝 사람과의 사이</p>
          <p className="section__text">{result.reading.people}</p>
        </div>
        <div className="section">
          <p className="section__label">🫧 마음 관리</p>
          <p className="section__text">{result.reading.mind}</p>
        </div>
      </div>

      <div className="btn-stack">
        {/* 공유 = 친구에게 오늘의 처방 보내주기 (광고 없음, 첫 번째 액션) */}
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onShare}>
          이 쪽지, 친구한테 보내주기 💌
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
            <span className="subscribe-card__title">내일 쪽지도 받아볼래요?</span>
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
