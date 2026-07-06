import { AppLayout } from '../components/AppLayout';
import { ScoreRing } from '../components/ScoreRing';
import { Mascot } from '../components/Mascot';
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

// PRD §5.4 + 리서치 반영 — 무료: 총운 점수 + 3줄. 상세(광고)는 항목별·행운세트로 확장.
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
  const { luck } = result;
  return (
    <AppLayout onBack={onBack} title="쪽지 결과">
      <div className="card card__center fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
        {luck.total >= 88 ? (
          <div className="confetti" aria-hidden>
            {['🎉', '✨', '⭐', '💚', '✨', '🎊', '⭐', '✨'].map((e, i) => (
              <span key={i} className="confetti__bit" style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 0.12}s` }}>
                {e}
              </span>
            ))}
          </div>
        ) : null}
        <div className="result-mascot">
          <Mascot size={72} score={luck.total} />
        </div>
        <p className="card__subtitle">
          {note.icon} {result.subtitle}
        </p>
        <p className="card__title">{result.title}</p>
        <ScoreRing score={luck.total} grade={luck.grade} caption="오늘의 총운" />
        <span className="tag-chip">#{luck.tag}</span>
      </div>

      <div className="pinpoint fade-in">
        <span className="pinpoint__badge">콕 집은 한마디</span>
        <p className="pinpoint__text">{result.pinpoint}</p>
      </div>

      <div className="card fade-in">
        <p className="section-title">쪽지가 콕 집어준 요약</p>
        <p className="result-note__summary">{result.summaryLines.join('\n')}</p>
      </div>

      <div className="btn-stack">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={onDetail}
        >
          항목별 운세랑 행운 세트도 볼래요 <AdBadge label="광고" />
        </button>

        {/* 친구도 뽑아주기 — 광고 없음 */}
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={onShare}
        >
          친구도 쪽지 뽑아주기 💌
        </button>

        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={onSave}
        >
          결과 카드로 저장하기 <AdBadge label="광고" />
        </button>

        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={onRetry}
        >
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
