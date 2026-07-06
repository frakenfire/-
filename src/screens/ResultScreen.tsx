import { AppLayout } from '../components/AppLayout';
import { ResultNote } from '../components/ResultNote';
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

// PRD §5.4 — 무료 결과 3줄은 광고 없이. 나머지 CTA 는 보상형/공유.
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
  return (
    <AppLayout onBack={onBack} title="쪽지 결과">
      <ResultNote
        icon={note.icon}
        title={result.title}
        subtitle={result.subtitle}
        summaryLines={result.summaryLines}
      />

      <div className="btn-stack">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={onDetail}
        >
          상세 운세 보기 <AdBadge label="광고" />
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
