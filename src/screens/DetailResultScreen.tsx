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

// 오늘의 심층 리포트 — 광고를 눌러서라도 보고 싶은 보상 페이지.
// 운세 순위(원픽) · 행운 미션 · 오늘의 궁합 · 부적 문장.
export function DetailResultScreen({
  result,
  busy,
  onShare,
  onCopyLine,
  onSave,
  onBack,
}: Props) {
  const { luck, detail } = result;
  const { topPick, match } = detail;

  return (
    <AppLayout onBack={onBack} title="심층 리포트">
      <div className="report-hero">
        <span className="report-hero__eyebrow">오늘의 심층 리포트</span>
        <h2 className="report-hero__title">
          오늘 밀어야 할 운은 <b>{topPick.emoji} {topPick.label}</b>
        </h2>
        <p className="report-hero__summary">{detail.summary}</p>
      </div>

      <div className="card fade-in">
        <p className="section-title"><span className="section-title__no">01</span>항목별 운세 순위</p>
        <CategoryScores ranked={detail.ranked} />
      </div>

      <div className="card fade-in">
        <p className="section-title"><span className="section-title__no">02</span>행운 세트</p>
        <LuckySetGrid luck={luck} mission={detail.mission} numberUse={detail.numberUse} />
      </div>

      {/* 오늘 잘 맞는 띠 — 상세 리포트의 자동 궁합(친구 궁합과 구분) */}
      <div className="card fade-in">
        <p className="section-title"><span className="section-title__no">03</span>오늘 잘 맞는 띠</p>
        <div className="match">
          <div className="match__cell match__cell--good">
            <span className="match__badge">잘 맞아요</span>
            <span className="match__emoji" aria-hidden>{match.good.emoji}</span>
            <span className="match__label">{match.good.label}</span>
            <span className="match__hint">{match.goodReason}</span>
          </div>
          <div className="match__cell match__cell--bad">
            <span className="match__badge match__badge--bad">살짝 조심</span>
            <span className="match__emoji" aria-hidden>{match.caution.emoji}</span>
            <span className="match__label">{match.caution.label}</span>
            <span className="match__hint">{match.cautionReason}</span>
          </div>
        </div>
      </div>

      {/* 오늘의 부적 — 스크린샷하고 싶은 한 줄 */}
      <div className="charm">
        <span className="charm__label">🔖 오늘의 부적</span>
        <p className="charm__text">“{detail.charm}”</p>
        <span className="charm__sub">화면 캡처해서 오늘 하루 곁에 둬보세요</span>
      </div>

      <div className="btn-stack">
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onShare}>
          이 리포트, 친구한테 보내주기 💌
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCopyLine}>
          부적 문장만 복사할래요
        </button>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={onSave}>
          결과 카드로 저장하기
        </button>
      </div>

      <Disclaimer />
    </AppLayout>
  );
}
