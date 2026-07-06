import { AppLayout } from '../components/AppLayout';
import { Disclaimer } from '../components/Disclaimer';
import type { FortuneResult } from '../types/fortune';

type Props = {
  result: FortuneResult;
  busy: boolean;
  onShare: () => void;
  onCopyLine: () => void;
  onSave: () => void;
  onBack: () => void;
};

// PRD §5.5 — 상세 운세: 전체 흐름 / 기대해도 되는 것 / 조심할 것 / 행운 포인트 / 오늘의 한 문장
export function DetailResultScreen({
  result,
  busy,
  onShare,
  onCopyLine,
  onSave,
  onBack,
}: Props) {
  return (
    <AppLayout onBack={onBack} title="상세 운세">
      <span className="eyebrow">{result.subtitle}</span>

      <div className="result-note fade-in" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="section">
          <p className="section__label">전체 흐름</p>
          <p className="section__text">{result.detailFlow}</p>
        </div>
        <div className="section">
          <p className="section__label">기대해도 되는 것</p>
          <p className="section__text">{result.goodPoint}</p>
        </div>
        <div className="section">
          <p className="section__label">조심할 것</p>
          <p className="section__text">{result.caution}</p>
        </div>
        <div className="section">
          <p className="section__label">행운 포인트</p>
          <p className="section__text">
            <span className="lucky">⭐ {result.luckyPoint}</span>
          </p>
        </div>
      </div>

      {/* 오늘의 한 문장 — 공유·저장용 */}
      <div className="share-line">
        <p className="share-line__label">오늘의 한 문장</p>
        <p className="share-line__text">{result.shareLine}</p>
      </div>

      <div className="btn-stack">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={onShare}
        >
          친구도 뽑아주기
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onCopyLine}
        >
          한 문장 복사하기
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={onSave}
        >
          결과 카드 저장하기
        </button>
      </div>

      <Disclaimer />
    </AppLayout>
  );
}
