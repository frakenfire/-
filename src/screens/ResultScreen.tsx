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
import { CATEGORY_INTERP, band } from '../data/detailContent.ts';
import { ZodiacBadge } from '../components/ZodiacBadge.tsx';
import { DeepSections } from '../components/DeepSections.tsx';
import { WeekCard } from '../components/WeekCard.tsx';
import type { GodGroup } from '../lib/tenGods.ts';
import type { IconName } from '../components/Icon.tsx';
import type { Zodiac } from '../data/zodiac.ts';
import type { ConcernKey } from '../data/concerns.ts';
import type { DeepRead } from '../lib/deepRead.ts';
import type { TimingRead } from '../lib/timing.ts';

type Props = {
  result: FortuneResult;
  note: Note;
  busy: boolean;
  onShare: () => void;
  onCopy: () => void;
  userName: string | null;
  spin?: number;
  /** 고민을 고르고 들어왔으면 그 답을 결과 안에 같이 낸다 */
  deep?: { concernKey: ConcernKey; read: DeepRead; timing: TimingRead } | null;
  /** 생년월일을 넣은 사람에게만 보이는 것들. 홈에 두면 '내 것' 이 아니다 */
  sajuBadge: { icon: IconName; name: string; hue: string; group: GodGroup } | null;
  onSaju: () => void;
  zodiac: Zodiac | null;
  streak: number;
  weekUnlocked: boolean;
  onUnlockWeek: () => void;
  onShareWeek: (text: string) => void;
  /** 결과를 본 다음에만 권하는 것들. 홈은 쪽지 뽑기 하나로 비워뒀다 */
  onCompat: () => void;
  onMonth: () => void;
  onBack: () => void;
};

// 마지막 장 — 한눈 요약, 오늘의 행운 네 칸, 공유, 오늘 이렇게 보내요. 그게 전부다.
// 리포트·편지·광고 배너·내일 예고는 전부 뺐다. 보고 나서 할 일은 친구에게 보내는 것 하나.
export function ResultScreen({ result, note, busy, onShare, onCopy, userName, spin = 0, deep = null, sajuBadge, onSaju, zodiac, streak, weekUnlocked, onUnlockWeek, onShareWeek, onCompat, onMonth, onBack }: Props) {
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
  const RING = 2 * Math.PI * 54;

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
          <span className="score-ring" aria-hidden>
            <svg className="score-ring__svg" viewBox="0 0 120 120">
              <circle className="score-ring__bg" cx="60" cy="60" r="54" />
              <circle
                className="score-ring__fg"
                cx="60"
                cy="60"
                r="54"
                style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - shownTotal / 100) }}
              />
            </svg>
            <span className="score-hero__mascot">
              <Mascot size={80} score={luck.total} bare />
            </span>
          </span>
          <div className="score-hero__num">
            <span className="score-hero__k">{userName ? `${userName}님의 ${isMonth ? '이번 달' : '오늘'} 점수` : `${isMonth ? '이번 달' : '오늘'} 점수`}</span>
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

      {/* 고민 답 — 이 흐름의 주인공. 뽑은 쪽지 바로 다음에 온다 */}
      {deep ? (
        <div className="deep-block">
          <DeepSections
            concernKey={deep.concernKey}
            read={deep.read}
            timing={deep.timing}
            userName={userName}
            compact
          />
        </div>
      ) : null}

      <p className="result__headline">{softBreak(dayPlan.headline, 18)}</p>
      <p className="result__vibe">{dayPlan.vibe}</p>

      {/* 2. 네 가지 운 — 사랑·돈·일·건강 점수 */}
      <div className="cat4 sec-card">
        <p className="cat4__head">{isMonth ? '이번 달 네 가지 운' : '오늘 네 가지 운'}</p>
        <ul className="cat4__list">
          {luck.categories.map((c) => (
            <li key={c.key} className="cat4__row cat4__row--rich">
              <span className="cat4__k">{c.label}</span>
              <span className="cat4__bar"><i style={{ width: `${c.score}%` }} /></span>
              <span className="cat4__v num">{c.score}</span>
              <span className="cat4__why">{CATEGORY_INTERP[c.key]?.[band(c.score)] ?? ''}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. 오늘의 행운 여섯 칸 — 색깔·숫자·방향·시간·음식·행동 */}
      <div className="lucky4 sec-card">
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
        <ul className="lucky-extra">
          <li className="lucky-extra__row">
            <span className="lucky-extra__k">챙길 물건</span>
            <strong className="lucky-extra__v">{luck.item}</strong>
          </li>
          <li className="lucky-extra__row">
            <span className="lucky-extra__k">{isMonth ? '이번 달 기운' : '오늘의 기운'}</span>
            <strong className="lucky-extra__v">{luck.tag}</strong>
          </li>
        </ul>
      </div>

      {/* 고민 답이 들어온 흐름에서는 아래 네 구역이 그 답과 겹친다.
          같은 말을 두 번 하면 긴 화면만 남고 아무도 안 읽는다. */}
      {deep ? null : (
        <>
        {/* 4. 오늘 이렇게 보내요 — 사주 앱의 개운법 자리 */}
        <div className="plan sec-card sec-card--plan">
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

        {/* 5. 오늘 돈·사랑·일 — 사주를 넣은 사람 */}
        {result.daily ? (
          <div className="cat4 sec-card">
            <p className="cat4__head">오늘 나에게</p>
            <ul className="mygod__qa">
              <li><span className="mygod__qa-k">돈</span>{DAY_ANSWERS[result.daily.dayGodGroup].money}</li>
              <li><span className="mygod__qa-k">사랑</span>{DAY_ANSWERS[result.daily.dayGodGroup].love}</li>
              <li><span className="mygod__qa-k">일</span>{DAY_ANSWERS[result.daily.dayGodGroup].work}</li>
            </ul>
          </div>
        ) : null}

        {/* 4.5 오늘 내 사주 — 한 토막 */}
        {result.daily ? (
          <div className="cat4 sec-card">
            <p className="cat4__head">오늘 내 사주</p>
            <p className="qa"><b>{result.daily.reading.title}</b></p>
            <p className="qa qa--sub">{result.daily.reading.body}</p>
            <p className="qa qa--sub">{result.daily.fitLine}</p>
          </div>
        ) : null}

        {/* 4.7 오늘의 풀이 — 전체·오전·오후·저녁·사람·마음 */}
        <div className="cat4 sec-card">
          <p className="cat4__head">{isMonth ? '이번 달 풀이' : '오늘의 풀이'}</p>
          <ul className="read6">
            {[
              ['전체', result.reading.overall],
              [isMonth ? '초반' : '오전', result.reading.morning],
              [isMonth ? '중순' : '오후', result.reading.afternoon],
              [isMonth ? '월말' : '저녁', result.reading.evening],
              ['사람', result.reading.people],
              ['마음', result.reading.mind],
            ].map(([k, v]) => (
              <li key={k} className="read6__row">
                <span className="read6__k">{k}</span>
                <span className="read6__v">{v}</span>
              </li>
            ))}
          </ul>
        </div>

        </>
      )}

      {/* 5. 오늘 잘 맞는 띠 */}
      <div className="cat4 sec-card">
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

      {/* 내 사주 · 오늘 나에게 · 이번 주 — 전부 생년월일을 넣어야 의미가 있는 것들.
          그래서 홈이 아니라 결과를 받은 이 자리에 둔다. */}
      {sajuBadge ? (
        <>
          <button
            type="button"
            className="saju-entry saju-entry--done"
            style={{ ['--saju-hue' as string]: sajuBadge.hue }}
            onClick={onSaju}
          >
            <span className="saju-entry__icon" aria-hidden>
              <Mascot size={44} accent={sajuBadge.hue} bare />
            </span>
            <span className="saju-entry__text">
              <span className="saju-entry__k">내 사주</span>
              <strong className="saju-entry__v">{sajuBadge.name}</strong>
            </span>
            <span className="saju-entry__chev" aria-hidden>›</span>
          </button>

          <section className="sec">
            <div className="sec__head">
              <h2 className="sec__title">오늘 나에게</h2>
            </div>
            <ul className="mygod__qa mygod__qa--home">
              <li><span className="mygod__qa-k">돈</span>{DAY_ANSWERS[sajuBadge.group].money}</li>
              <li><span className="mygod__qa-k">사랑</span>{DAY_ANSWERS[sajuBadge.group].love}</li>
              <li><span className="mygod__qa-k">일</span>{DAY_ANSWERS[sajuBadge.group].work}</li>
            </ul>
          </section>
        </>
      ) : null}

      <WeekCard
        zodiac={zodiac}
        streak={streak}
        unlocked={weekUnlocked}
        onUnlock={onUnlockWeek}
        onShare={onShareWeek}
      />

      {/* 더 보기 — 결과를 본 사람에게만 권한다. 처음 온 사람에겐 고를 게 많으면 안 된다 */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">더 보기</h2>
        </div>
        <div className="rowlist">
          <button type="button" className="compat-banner" onClick={onMonth}>
            <span className="compat-banner__icon compat-banner__icon--yellow" aria-hidden><Icon name="calendar" /></span>
            <span className="compat-banner__body">
              <span className="compat-banner__title">이번 달 내 운세는?</span>
              <span className="compat-banner__desc">1주차부터 4주차까지 흐름이 나와요</span>
            </span>
            <span className="compat-banner__cta">보러가기 ›</span>
          </button>
          <button type="button" className="compat-banner" onClick={onCompat}>
            <span className="compat-banner__icon compat-banner__icon--pink" aria-hidden><Icon name="heart" /></span>
            <span className="compat-banner__body">
              <span className="compat-banner__title">오늘 우리 궁합, 몇 점일까?</span>
              <span className="compat-banner__desc">띠 또는 별자리만 고르면 바로 나와요</span>
            </span>
            <span className="compat-banner__cta">보러가기 ›</span>
          </button>
        </div>
      </section>

      <Disclaimer />
    </AppLayout>
  );
}
