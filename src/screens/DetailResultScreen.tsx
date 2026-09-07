import { AppLayout } from '../components/AppLayout.tsx';
import { ZodiacBadge } from '../components/ZodiacBadge.tsx';
import { CategoryScores } from '../components/CategoryScores.tsx';
import { LuckySetGrid } from '../components/LuckySet.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import type { FortuneResult } from '../types/fortune.ts';

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
    <AppLayout
      onBack={onBack}
      title="심층 리포트"
      bottom={
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onShare}>
          이 리포트, 친구한테 보내주기 
        </button>
      }
    >
      <div className="report-hero">
        <span className="report-hero__eyebrow">오늘의 심층 리포트</span>
        <h2 className="report-hero__title">
          오늘 밀어야 할 운은 <b>{topPick.label}</b>
        </h2>
        <p className="report-hero__summary">{detail.summary}</p>
      </div>

      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">항목별 운세 순위</h2>
        </div>
        <div className="card fade-in">
        <CategoryScores ranked={detail.ranked} />
        </div>
      </section>

      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">행운 세트</h2>
        </div>
        <div className="card fade-in">
        <LuckySetGrid luck={luck} mission={detail.mission} numberUse={detail.numberUse} />
        </div>
      </section>

      {/* 오늘 잘 맞는 띠 — 상세 리포트의 자동 궁합(친구 궁합과 구분) */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">오늘 잘 맞는 띠</h2>
        </div>
        <div className="card fade-in">
        <div className="match">
          <div className="match__cell match__cell--good">
            <span className="match__badge">잘 맞아요</span>
            <ZodiacBadge zodiac={match.good} size={40} tone="brand" />
            <span className="match__label">{match.good.label}</span>
            <span className="match__hint">{match.goodReason}</span>
          </div>
          <div className="match__cell match__cell--bad">
            <span className="match__badge match__badge--bad">살짝 조심</span>
            <ZodiacBadge zodiac={match.caution} size={40} />
            <span className="match__label">{match.caution.label}</span>
            <span className="match__hint">{match.cautionReason}</span>
          </div>
        </div>
        </div>
      </section>

      {/* 오늘의 부적 — 스크린샷하고 싶은 한 줄 */}
      <div className="charm">
        <span className="charm__label">오늘의 부적</span>
        <p className="charm__text">“{detail.charm}”</p>
        <span className="charm__sub">화면 캡처해서 오늘 하루 곁에 둬보세요</span>
      </div>

      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">더 보기</h2>
        </div>
        <div className="rowlist">
          <button type="button" className="act-row" onClick={onCopyLine}>
            <span className="act-row__t">부적 문장만 복사할래요</span>
            <span className="act-row__c" aria-hidden>›</span>
          </button>
          <button type="button" className="act-row" disabled={busy} onClick={onSave}>
            <span className="act-row__t">결과 카드 저장하기</span>
            <span className="act-row__c" aria-hidden>›</span>
          </button>
        </div>
      </section>

      <Disclaimer />
    </AppLayout>
  );
}
