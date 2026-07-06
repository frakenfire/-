import { AppLayout } from '../components/AppLayout';
import { CategoryScores } from '../components/CategoryScores';
import { LuckySetGrid } from '../components/LuckySet';
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

// PRD §5.5 + 리서치 반영 — 항목별 점수 · 전체 흐름/기대/조심 · 행운 세트 · 한 문장
export function DetailResultScreen({
  result,
  busy,
  onShare,
  onCopyLine,
  onSave,
  onBack,
}: Props) {
  const { luck } = result;
  return (
    <AppLayout onBack={onBack} title="상세 운세">
      <span className="eyebrow">{result.subtitle}</span>

      <div className="card fade-in">
        <p className="section-title">항목별 운세</p>
        <CategoryScores categories={luck.categories} />
      </div>

      <div className="card fade-in">
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
      </div>

      <div className="card fade-in">
        <p className="section-title">오늘의 행운 세트</p>
        <LuckySetGrid luck={luck} />
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
          친구도 쪽지 뽑아주기 💌
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCopyLine}>
          이 한 문장만 복사할래요
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={onSave}
        >
          결과 카드로 저장하기
        </button>
      </div>

      <Disclaimer />
    </AppLayout>
  );
}
