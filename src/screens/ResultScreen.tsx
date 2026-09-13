import { useEffect, useState } from 'react';
import { Mascot } from '../components/Mascot.tsx';
import { Icon } from '../components/Icon.tsx';
import { AppLayout } from '../components/AppLayout.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { GRADE_KO } from '../lib/luck.ts';
import { softBreak } from '../lib/softBreak.ts';
import type { FortuneResult, Note } from '../types/fortune.ts';
import { LUCKY_HEADS, PLAN_TITLES } from '../data/copy.ts';
import { DAY_ANSWERS } from '../data/sajuAnswers.ts';
import { ZodiacBadge } from '../components/ZodiacBadge.tsx';

type Props = {
  result: FortuneResult;
  note: Note;
  busy: boolean;
  onShare: () => void;
  onCopy: () => void;
  userName: string | null;
  spin?: number;
  onBack: () => void;
};

// 마지막 장 — 한눈 요약, 오늘의 행운 네 칸, 공유, 오늘 이렇게 보내요. 그게 전부다.
// 리포트·편지·광고 배너·내일 예고는 전부 뺐다. 보고 나서 할 일은 친구에게 보내는 것 하나.
export function ResultScreen({ result, note, busy, onShare, onCopy, userName, spin = 0, onBack }: Props) {
  const { luck, dayPlan } = result;
  const isMonth = result.reading.scale === 'month';

  // 점수 카운트업 — 0에서 차오르며 '뽑힌' 느낌
  const [shownTotal, setShownTotal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShownTotal(Math.round(eased * luck.total));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [luck.total]);

  const action = result.luckyPoint.split(' · ')[2] ?? result.luckyPoint;

  return (
    <AppLayout
      onBack={onBack}
      title={isMonth ? '이번 달 쪽지' : '오늘의 쪽지'}
      bottom={
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onShare}>
          친구한테 보내기
        </button>
      }
    >
      {/* 1. 한눈 요약 */}
      <div className={`drawn drawn--${note.color} score-hero`}>
        <div className="score-hero__top">
          <span className="score-hero__mascot" aria-hidden>
            <Mascot size={96} score={luck.total} bare />
          </span>
          <div className="score-hero__num">
            <span className="score-hero__k">{userName ? `${userName}님의 오늘 점수` : '오늘 점수'}</span>
            <span className="score-hero__v"><b className="num">{shownTotal}</b>점</span>
            <span className="score-hero__grade">{GRADE_KO[luck.grade] ?? luck.grade}</span>
          </div>
        </div>
        <div className="score-hero__note">
          <span className="drawn__k">내가 뽑은 쪽지 · <span className="drawn__kw">{note.keyword}</span></span>
          <strong className="drawn__name">{note.name}</strong>
          <span className="drawn__lead">{result.summaryLines[0]}</span>
        </div>
      </div>

      <p className="result__headline">{softBreak(dayPlan.headline, 18)}</p>
      <p className="result__vibe">{dayPlan.vibe}</p>

      {/* 2. 네 가지 운 — 사랑·돈·일·건강 점수 */}
      <div className="cat4">
        <p className="cat4__head">{isMonth ? '이번 달 네 가지 운' : '오늘 네 가지 운'}</p>
        <ul className="cat4__list">
          {luck.categories.map((c) => (
            <li key={c.key} className="cat4__row">
              <span className="cat4__k">{c.label}</span>
              <span className="cat4__bar"><i style={{ width: `${c.score}%` }} /></span>
              <span className="cat4__v num">{c.score}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. 오늘의 행운 여섯 칸 — 색깔·숫자·방향·시간·음식·행동 */}
      <div className="lucky4">
        <p className="lucky4__head">{isMonth ? '이번 달의 행운' : LUCKY_HEADS[spin % LUCKY_HEADS.length]}</p>
        <div className="lucky4__grid lucky4__grid--3">
          <div className="lucky4__tile">
            <span className="lucky4__swatch" style={{ background: luck.color.hex }} aria-hidden />
            <span className="lucky4__k">색깔</span>
            <strong className="lucky4__v">{luck.color.name}</strong>
          </div>
          <div className="lucky4__tile lucky4__tile--blue">
            <span className="lucky4__big num" aria-hidden>{luck.number}</span>
            <span className="lucky4__k">숫자</span>
            <strong className="lucky4__v">{luck.number}</strong>
          </div>
          <div className="lucky4__tile lucky4__tile--yellow">
            <span className="lucky4__icon" aria-hidden><Icon name="compass" size={26} /></span>
            <span className="lucky4__k">방향</span>
            <strong className="lucky4__v">{luck.direction}</strong>
          </div>
          <div className="lucky4__tile lucky4__tile--blue">
            <span className="lucky4__icon" aria-hidden><Icon name="clock" size={26} /></span>
            <span className="lucky4__k">시간</span>
            <strong className="lucky4__v">{luck.time}</strong>
          </div>
          <div className="lucky4__tile lucky4__tile--orange">
            <span className="lucky4__icon" aria-hidden><Icon name="bowl" size={26} /></span>
            <span className="lucky4__k">음식</span>
            <strong className="lucky4__v">{luck.food.name}</strong>
          </div>
          <div className="lucky4__tile lucky4__tile--yellow">
            <span className="lucky4__icon" aria-hidden><Icon name="target" size={26} /></span>
            <span className="lucky4__k">행동</span>
            <strong className="lucky4__v">{action}</strong>
          </div>
        </div>
      </div>

      {/* 4. 오늘 돈·사랑·일 — 사주를 넣은 사람 */}
      {result.daily ? (
        <div className="cat4">
          <p className="cat4__head">오늘 나에게</p>
          <ul className="mygod__qa">
            <li><span className="mygod__qa-k">돈</span>{DAY_ANSWERS[result.daily.dayGodGroup].money}</li>
            <li><span className="mygod__qa-k">사랑</span>{DAY_ANSWERS[result.daily.dayGodGroup].love}</li>
            <li><span className="mygod__qa-k">일</span>{DAY_ANSWERS[result.daily.dayGodGroup].work}</li>
          </ul>
        </div>
      ) : null}

      {/* 5. 오늘 잘 맞는 띠 */}
      <div className="cat4">
        <p className="cat4__head">오늘 잘 맞는 띠</p>
        <div className="match">
          <div className="match__cell">
            <span className="match__badge">잘 맞아요</span>
            <ZodiacBadge zodiac={result.detail.match.good} size={44} tone="brand" />
            <span className="match__label">{result.detail.match.good.label}</span>
            <span className="match__hint">{result.detail.match.goodReason}</span>
          </div>
          <div className="match__cell">
            <span className="match__badge match__badge--bad">살짝 조심</span>
            <ZodiacBadge zodiac={result.detail.match.caution} size={44} />
            <span className="match__label">{result.detail.match.caution.label}</span>
            <span className="match__hint">{result.detail.match.cautionReason}</span>
          </div>
        </div>
      </div>

      {/* 6. 공유 */}
      <div className="share-row">
        <button type="button" className="btn btn--primary share-row__btn" disabled={busy} onClick={onShare}>
          카톡·메시지로 보내기
        </button>
        <button type="button" className="btn btn--secondary share-row__btn" disabled={busy} onClick={onCopy}>
          복사하기
        </button>
      </div>

      {/* 7. 오늘 이렇게 보내요 */}
      <div className="plan">
        <p className="plan__title">{isMonth ? '이번 달, 이렇게 보내요' : PLAN_TITLES[(spin >> 1) % PLAN_TITLES.length]}</p>
        <ul className="plan__steps">
          {dayPlan.steps.map((s) => (
            <li className="plan__step" key={s.when}>
              <span className="plan__when">{s.when}</span>
              <span className="plan__text">{s.text}</span>
            </li>
          ))}
        </ul>
        <div className="plan__hold">
          <span className="plan__hold-k">{isMonth ? '이번 달은 접어둬요' : '오늘은 접어둬요'}</span>
          <span className="plan__hold-v">{dayPlan.holdOff}</span>
        </div>
      </div>

      <Disclaimer />
    </AppLayout>
  );
}
