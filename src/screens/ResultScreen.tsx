import { AppLayout } from '../components/AppLayout';
import { ScoreRing } from '../components/ScoreRing';
import { Disclaimer } from '../components/Disclaimer';
import { AdBadge, AdBanner } from '../components/AdNotice';
import type { FortuneResult, Note } from '../types/fortune';

type Props = {
  result: FortuneResult;
  note: Note;
  busy: boolean;
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
  onDetail,
  onSave,
  onShare,
  onRetry,
  onBack,
}: Props) {
  const { luck } = result;
  return (
    <AppLayout onBack={onBack} title="쪽지 결과">
      <div className="card card__center fade-in">
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
        <p className="section-title">쪽지 한 줄 요약</p>
        <p className="result-note__summary">{result.summaryLines.join('\n')}</p>
      </div>

      <div className="btn-stack">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={onDetail}
        >
          항목별 운세 · 행운 세트 보기 <AdBadge label="광고" />
        </button>

        {/* 친구도 뽑아주기 — 광고 없음 */}
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={onShare}
        >
          친구도 뽑아주기
        </button>

        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={onSave}
        >
          결과 카드 저장하기 <AdBadge label="광고" />
        </button>

        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={onRetry}
        >
          다른 쪽지도 뽑기 <AdBadge label="광고" />
        </button>
      </div>

      <AdBanner />
      <Disclaimer />
    </AppLayout>
  );
}
