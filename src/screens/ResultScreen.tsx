import { useEffect, useState } from 'react';
import { Mascot } from '../components/Mascot.tsx';
import { Icon } from '../components/Icon.tsx';
import { MoreConcerns } from '../components/MoreConcerns.tsx';
import { AppLayout } from '../components/AppLayout.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { GRADE_KO } from '../lib/luck.ts';
import { softBreak } from '../lib/softBreak.ts';
import { Sentences } from '../components/Sentences.tsx';
import { luckyWhen } from '../lib/luckyWhen.ts';
import type { FortuneResult, Note } from '../types/fortune.ts';
import { LUCKY_HEADS } from '../data/copy.ts';
import { CATEGORY_INTERP, band } from '../data/detailContent.ts';
import { ZodiacBadge } from '../components/ZodiacBadge.tsx';
import { DeepSections } from '../components/DeepSections.tsx';
import { WeekCard } from '../components/WeekCard.tsx';
import type { Zodiac } from '../data/zodiac.ts';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { ohaengWhy } from '../data/ohaeng.ts';
import type { Band } from '../lib/timing.ts';

// 고민 점수의 등급말 - 숫자 옆에 한 단어가 있어야 '이게 높은 건가' 가 안 생긴다
const BAND_LABEL: Record<Band, string> = { good: '열려 있어요', ok: '무난해요', hard: '지킬 때예요' };
import type { DeepRead } from '../lib/deepRead.ts';
import type { TimingRead } from '../lib/timing.ts';

type Props = {
  result: FortuneResult;
  note: Note;
  busy: boolean;
  onShare: () => void;
  userName: string | null;
  spin?: number;
  /** 고민을 고르고 들어왔으면 그 답을 결과 안에 같이 낸다 */
  deep?: { concernKey: ConcernKey; read: DeepRead; timing: TimingRead } | null;
  zodiac: Zodiac | null;
  onShareWeek: (text: string) => void;
  /** 명식에서 계산된 네 가지 운 점수. 생년월일이 없으면 null */
  chartScores?: Record<'love' | 'money' | 'work' | 'health', number> | null;
  /** 오늘 광고로 열어둔 고민들 */
  unlockedConcerns?: string[];
  /** 광고를 보여주고 그 고민을 연다 */
  onUnlockConcern?: (key: ConcernKey) => Promise<boolean>;
  /** 이미 열린 고민으로 간다 */
  onOpenConcern?: (key: ConcernKey) => void;
  /** 내일 알림을 받겠다고 하면 동의 UI 를 띄운다. 없으면 줄이 안 나온다 */
  onAskNoti?: () => void;
  onBack: () => void;
};

// 마지막 장 — 한눈 요약, 오늘의 행운 네 칸, 공유, 오늘 이렇게 보내요. 그게 전부다.
// 리포트·편지·광고 배너·내일 예고는 전부 뺐다. 보고 나서 할 일은 친구에게 보내는 것 하나.
export function ResultScreen({ result, note, busy, onShare, userName, spin = 0, deep = null, zodiac, chartScores = null, unlockedConcerns = [], onUnlockConcern, onOpenConcern, onAskNoti, onShareWeek, onBack }: Props) {
  const { luck, dayPlan } = result;
  const isMonth = result.reading.scale === 'month';
  // 고민을 골라 들어왔으면 맨 위 점수는 그 고민의 점수다. 명식에서 계산된 값이라
  // 오늘 점수(날짜 seed 기반)보다 이 화면이 하는 말과 더 붙는다.
  const concernLabel = deep ? findConcern(deep.concernKey).label : null;
  // 여섯 칸을 푸는 문단. 고민을 골라 들어왔으면 그 고민의 말로 쓴다 - 돈을 물은
  // 사람에게 '중요한 건 늦은 오후에' 라고만 하면, 위에서는 촘촘히 돈 얘기를
  // 하다가 아래로 갈수록 아무 고민에나 붙는 말로 바뀐다.
  const luckyWhy = luck.boost
    ? ohaengWhy(luck.boost, luck.color.name, deep ? findConcern(deep.concernKey) : undefined)
    : null;
  const headScore = deep ? deep.read.score.total : luck.total;
  const headGrade = deep ? BAND_LABEL[deep.read.score.band] : (GRADE_KO[luck.grade] ?? luck.grade);

  // 점수 카운트업 — 0에서 차오르며 '뽑힌' 느낌
  const [shownTotal, setShownTotal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShownTotal(Math.round(eased * headScore));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [headScore]);

  const RING = 2 * Math.PI * 54;
  // 이미 지나간 때를 오늘의 행운이라고 띄우지 않는다
  const when = luckyWhen(luck.time);

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
              <Mascot size={60} score={headScore} bare />
            </span>
          </span>
          <div className="score-hero__num">
            <span className="score-hero__k">
              {userName ? `${userName}님의 ` : ''}
              {concernLabel ?? (isMonth ? '이번 달' : '오늘')} 점수
            </span>
            <span className="score-hero__v"><b className="num">{shownTotal}</b>점</span>
            <span className="score-hero__grade">{headGrade}</span>
          </div>
        </div>
        {/* 캡처해서 친구에게 보내도 뜻이 통해야 하는 자리. 결론과 지금 할 일까지
            여기서 끝낸다. 아래 상세를 안 읽어도 무엇을 할지는 알 수 있어야 한다. */}
        <div className="score-hero__note">
          {/* 뽑은 쪽지 이름은 한 줄로 끝낸다. 18px 굵은 글씨로 따로 세우면
              바로 밑 결론(20px)과 굵기가 같아져 무엇이 제목인지 안 읽힌다. */}
          <span className="drawn__k">
            내가 뽑은 쪽지 · <span className="drawn__kw">{note.name}</span>
          </span>
          {deep ? (
            <>
              <strong className="drawn__verdict">{softBreak(deep.read.headline, 16)}</strong>
              <Sentences className="drawn__lead" text={deep.read.sub} />
              {/* 배지와 문장을 한 줄에 흘리면 문장이 배지 뒤에서 접혀
                  줄바꿈이 사고처럼 보인다. 배지는 제 줄을 갖는다. */}
              <span className="drawn__now">
                <b className="drawn__stance">{deep.read.decision.stanceWord}</b>
                {/* 이번 달 기운은 행동의 이유다. 판정 줄 옆에 두면 두 층이
                    섞여서 서로 반대로 갈 수 있다. 행동 바로 위에 붙인다. */}
                <span className="drawn__why">{deep.read.monthWhy}</span>
                <span className="drawn__do">{deep.read.decision.dos[0]}</span>
              </span>
            </>
          ) : (
            <span className="drawn__lead">{result.summaryLines[0]}</span>
          )}
        </div>
      </div>

      {/* 오늘은 이렇게 — 주제를 골라 들어왔으면 그 주제 얘기만 한다.
          일과 이직을 물어본 사람에게 물 많이 마시라는 말을 하면 거기서 끝이다. */}
      {deep ? (
        <div className="sec-card">
          <p className="cat4__head">오늘은 이렇게</p>
          <ul className="today2">
            <li className="today2__row today2__row--do">
              <span className="today2__k">하면 좋은 것</span>
              <Sentences className="today2__v" text={deep.read.today.doIt} />
            </li>
            <li className="today2__row today2__row--dont">
              <span className="today2__k">피할 것</span>
              <Sentences className="today2__v" text={deep.read.today.avoid} />
            </li>
            {deep.read.today.hold ? (
              <li className="today2__row today2__row--hold">
                <span className="today2__k">오늘은 미뤄도 돼요</span>
                <Sentences className="today2__v" text={deep.read.today.hold} />
              </li>
            ) : null}
          </ul>
        </div>
      ) : (
        <div className="sec-card">
          <p className="cat4__head">{isMonth ? '이번 달은 이렇게' : '오늘은 이렇게'}</p>
          <p className="today2__line">{softBreak(dayPlan.headline, 18)}</p>
          <p className="today2__vibe">{dayPlan.vibe}</p>
          <ul className="today2">
            <li className="today2__row today2__row--do">
              <span className="today2__k">하면 좋은 것</span>
              <Sentences className="today2__v" text={result.daily?.reading.doThis ?? result.dos[0]} />
            </li>
            <li className="today2__row today2__row--dont">
              <span className="today2__k">피할 것</span>
              <Sentences className="today2__v" text={result.daily?.reading.avoid ?? result.dont} />
            </li>
            <li className="today2__row today2__row--hold">
              <span className="today2__k">{isMonth ? '이번 달은 접어둬요' : '오늘은 접어둬요'}</span>
              <Sentences className="today2__v" text={dayPlan.holdOff} />
            </li>
          </ul>
          <ol className="today3">
            {dayPlan.steps.map((st) => (
              <li className="today3__row" key={st.when}>
                <span className="today3__when">{st.when}</span>
                <Sentences className="today3__text" text={st.text} />
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 고민 답 — 뽑은 쪽지와 오늘 할 일 다음에 온다 */}
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

      {/* 고민 답이 들어온 흐름에서는 아래 네 구역이 그 답과 겹친다.
          같은 말을 두 번 하면 긴 화면만 남고 아무도 안 읽는다. */}
      {deep ? null : (
        <>
        {/* 4.5 오늘 내 사주 — 한 토막 */}
        {result.daily ? (
          <div className="cat4 sec-card">
            <p className="cat4__head">오늘 내 사주</p>
            <p className="qa"><b>{result.daily.reading.title}</b></p>
            <Sentences className="qa qa--sub" text={result.daily.reading.body} />
            <Sentences className="qa qa--sub" text={result.daily.fitLine} />
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
                <Sentences className="read6__v" text={String(v)} />
              </li>
            ))}
          </ul>
        </div>

        </>
      )}

      {/* 6. 공유 */}
      {/* 내 사주 · 오늘 나에게 · 이번 주 — 전부 생년월일을 넣어야 의미가 있는 것들.
          그래서 홈이 아니라 결과를 받은 이 자리에 둔다. */}
      {/* 재미로 하나 더 — 여기부터는 사주 계산이 아니다. 본 풀이 사이에 끼우면
          색깔과 음식이 분석 행세를 하게 되므로 아래로 내려 따로 묶는다. */}
      <p className="fun-head">재미로 하나 더</p>
      {/* 2. 네 가지 운 — 사랑·돈·일·건강 점수 */}
      <div className="cat4 sec-card">
        <p className="cat4__head">{isMonth ? '이번 달 네 가지 운' : '오늘 네 가지 운'}</p>
        <ul className="cat4__list">
          {luck.categories.map((c0) => {
            const c = chartScores ? { ...c0, score: chartScores[c0.key as keyof typeof chartScores] ?? c0.score } : c0;
            return (
            <li key={c.key} className="cat4__row cat4__row--rich">
              <span className="cat4__k">{c.label}</span>
              <span className="cat4__bar"><i style={{ width: `${c.score}%` }} /></span>
              <span className="cat4__v num">{c.score}</span>
              <span className="cat4__why"><Sentences text={CATEGORY_INTERP[c.key]?.[band(c.score)] ?? ''} /></span>
            </li>
            );
          })}
        </ul>
      </div>

      {/* 3. 오늘의 행운 여섯 칸 — 색깔·숫자·방향·시간·음식·물건.
          여섯 칸에 파랑·노랑·주황 세 가지 바탕색을 아무 규칙 없이 흩뿌려
          놨었다. 색이 뜻하는 게 없으면 색은 소음이다. 바탕은 하나로 두고
          유일하게 뜻이 있는 색(행운 색)만 동그라미로 보여준다.
          숫자 칸은 큰 숫자를 아이콘 자리에 놓고 값으로 또 한 번 써서
          '8 / 숫자 / 8' 로 읽혔다. 다른 다섯 칸과 같은 아이콘 자리로 맞춘다. */}
      <div className="lucky4 sec-card">
        <p className="lucky4__head">{isMonth ? '이번 달의 행운' : LUCKY_HEADS[spin % LUCKY_HEADS.length]}</p>
        <div className="lucky4__grid lucky4__grid--3">
          <div className="lucky4__tile">
            <span className="lucky4__swatch" style={{ background: luck.color.hex }} aria-hidden />
            <span className="lucky4__k">색깔</span>
            <strong className="lucky4__v">{luck.color.name}</strong>
          </div>
          <div className="lucky4__tile">
            <span className="lucky4__icon" aria-hidden><Icon name="hash" size={26} /></span>
            <span className="lucky4__k">숫자</span>
            <strong className="lucky4__v">{luck.number}</strong>
          </div>
          <div className="lucky4__tile">
            <span className="lucky4__icon" aria-hidden><Icon name="compass" size={26} /></span>
            <span className="lucky4__k">방향</span>
            <strong className="lucky4__v">{luck.direction}</strong>
          </div>
          <div className="lucky4__tile">
            <span className="lucky4__icon" aria-hidden><Icon name="clock" size={26} /></span>
            <span className="lucky4__k">시간</span>
            <strong className="lucky4__v">{when.label}</strong>
          </div>
          <div className="lucky4__tile">
            <span className="lucky4__icon" aria-hidden><Icon name="bowl" size={26} /></span>
            <span className="lucky4__k">음식</span>
            <strong className="lucky4__v">{luck.food.name}</strong>
          </div>
          <div className="lucky4__tile">
            <span className="lucky4__icon" aria-hidden><Icon name="gift" size={26} /></span>
            <span className="lucky4__k">물건</span>
            <strong className="lucky4__v">{luck.item}</strong>
          </div>
        </div>
        {/* 여섯 칸 밑에 '왜 이렇게 나왔나' 한 문단.
            전에는 여기가 '오늘의 기운 | 정리' 한 줄이었다. 이름표와 낱말 하나.
            그 낱말은 날짜 해시로 열 개 중 하나를 뽑은 제비였고, 왜 그 낱말인지는
            화면 어디에도 없었다. 칸 여섯 개 중 다섯도 같은 방식이었다.
            지금은 방향도 숫자도 시각도 음식도 물건도 '오늘 나한테 힘이 되는
            기운' 하나에서 계산으로 떨어진다. 그 계산을 그대로 풀어 적는다.
            칸마다 한 줄씩 붙이면 여섯 줄이 각자 떠들어서 답이 안 읽힌다.
            생년월일이 없어 근거가 없을 때는 이 문단을 아예 안 그린다 -
            없는 근거를 있는 척 적는 게 제일 나쁘다. */}
        {luckyWhy ? <p className="lucky4__why">{luckyWhy}</p> : null}
      </div>

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

      <WeekCard zodiac={zodiac} onShare={onShareWeek} />

      {/* 광고는 여기 한 자리뿐이다. 결과를 끝까지 본 사람에게만, 더 볼 것을
          열겠냐고 묻는다. 본문 중간이나 결과 앞에는 두지 않는다. */}
      {deep && onUnlockConcern && onOpenConcern ? (
        <MoreConcerns
          current={deep.concernKey}
          unlocked={unlockedConcerns}
          onUnlock={onUnlockConcern}
          onOpen={onOpenConcern}
        />
      ) : null}

      {/* 마지막에 읽는 한 줄. 다시 올 이유를 만드는 자리다.
          '내일 대박' 같은 미끼는 안 쓴다 — 지어낸 기대를 걸면 다음 날 한 번
          속고 다시는 안 온다. 내일 일진을 실제로 계산해서 무엇이 달라지는지만
          적는다. 접힌 묶음 안에 넣지 않는다. 안 펴면 아무도 못 본다. */}
      {deep ? (
        <p className="nextday">
          <span className="nextday__k" aria-hidden>
            <Icon name="clock" size={16} />
          </span>
          <Sentences className="nextday__v" text={deep.read.todayMeet.nextDay} />
        </p>
      ) : null}

      {/* 알림은 먼저 띄우지 않는다. 결과를 다 본 사람이 '내일도 본다' 고
          누를 때만 동의 UI 가 뜬다. 시스템 팝업이 불쑥 뜨는 앱이 되면
          그 자리에서 나간다. 콘솔 템플릿이 없으면 줄 자체가 안 나온다. */}
      {deep && onAskNoti ? (
        <button type="button" className="notiask" onClick={onAskNoti}>
          <span className="notiask__k">내일 쪽지가 바뀌면 알려드릴까요</span>
          <span className="notiask__c" aria-hidden>›</span>
        </button>
      ) : null}

      <Disclaimer />

    </AppLayout>
  );
}
