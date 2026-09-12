import { useEffect, useState } from 'react';
import { Mascot } from '../components/Mascot.tsx';
import { Icon } from '../components/Icon.tsx';
import { AppLayout } from '../components/AppLayout.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { GRADE_KO } from '../lib/luck.ts';
import { softBreak } from '../lib/softBreak.ts';
import type { FortuneResult, Note } from '../types/fortune.ts';
import type { LuckySong } from '../data/luckySongs.ts';

type Props = {
  result: FortuneResult;
  note: Note;
  busy: boolean;
  onShare: () => void;
  onCopy: () => void;
  userName: string | null;
  song: LuckySong;
  onBack: () => void;
};

// 마지막 장 — 한눈 요약, 오늘의 행운 네 칸, 공유, 오늘 이렇게 보내요. 그게 전부다.
// 리포트·편지·광고 배너·내일 예고는 전부 뺐다. 보고 나서 할 일은 친구에게 보내는 것 하나.
export function ResultScreen({ result, note, busy, onShare, onCopy, userName, song, onBack }: Props) {
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

      {/* 2. 오늘의 행운 네 칸 */}
      <div className="lucky4">
        <p className="lucky4__head">{isMonth ? '이번 달의 행운' : '오늘의 행운'}</p>
        <div className="lucky4__grid">
          <div className="lucky4__tile">
            <span className="lucky4__swatch" style={{ background: luck.color.hex }} aria-hidden />
            <span className="lucky4__k">색깔</span>
            <strong className="lucky4__v">{luck.color.name}</strong>
            <span className="lucky4__why">{luck.time}에 곁에 두면 좋아요</span>
          </div>
          <div className="lucky4__tile lucky4__tile--blue">
            <span className="lucky4__icon" aria-hidden><Icon name="headphone" size={26} /></span>
            <span className="lucky4__k">노래</span>
            <strong className="lucky4__v">{song.title}</strong>
            <span className="lucky4__why">{song.artist} · {song.why}</span>
          </div>
          <div className="lucky4__tile lucky4__tile--yellow">
            <span className="lucky4__icon" aria-hidden><Icon name="target" size={26} /></span>
            <span className="lucky4__k">행동</span>
            <strong className="lucky4__v">{action}</strong>
            <span className="lucky4__why">{luck.direction}으로 가면 더 좋아요</span>
          </div>
          <div className="lucky4__tile lucky4__tile--orange">
            <span className="lucky4__icon" aria-hidden><Icon name="bowl" size={26} /></span>
            <span className="lucky4__k">음식</span>
            <strong className="lucky4__v">{luck.food.name}</strong>
            <span className="lucky4__why">{luck.food.why}</span>
          </div>
        </div>
        {/* 3. 공유 */}
        <div className="share-row">
          <button type="button" className="btn btn--primary share-row__btn" disabled={busy} onClick={onShare}>
            카톡·메시지로 보내기
          </button>
          <button type="button" className="btn btn--secondary share-row__btn" disabled={busy} onClick={onCopy}>
            복사하기
          </button>
        </div>
      </div>

      {/* 4. 오늘 이렇게 보내요 */}
      <div className="plan">
        <p className="plan__title">{isMonth ? '이번 달, 이렇게 보내요' : '오늘, 이렇게 보내요'}</p>
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
