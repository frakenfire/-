import { useEffect, useState } from 'react';
import { Mascot } from '../components/Mascot.tsx';
import { MoreConcerns } from '../components/MoreConcerns.tsx';
import { AppLayout } from '../components/AppLayout.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { GRADE_KO } from '../lib/luck.ts';
import { todayKey } from '../lib/dateSeed.ts';
import { TodayDecisionCard } from '../components/TodayDecisionCard.tsx';
import { scoreWhyOf } from '../lib/scoreWhy.ts';
import { todayVibe } from '../lib/dayVibe.ts';
import { Sentences } from '../components/Sentences.tsx';
import { luckyWhen } from '../lib/luckyWhen.ts';
import type { FortuneResult, Note } from '../types/fortune.ts';
import { CATEGORY_INTERP, band } from '../data/detailContent.ts';
import { ZodiacBadge } from '../components/ZodiacBadge.tsx';
import { DeepSections } from '../components/DeepSections.tsx';
import { WeekCard } from '../components/WeekCard.tsx';
import { Chapter } from '../components/Chapter.tsx';
import type { Zodiac } from '../data/zodiac.ts';
import { partPassed } from '../lib/dayPart.ts';
import { useDayPart } from '../lib/useDayPart.ts';
import { noteTodayOf } from '../data/noteToday/index.ts';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { withJosa } from '../lib/josa.ts';
import { OHAENG } from '../data/ohaeng.ts';
import { todayIntroOf } from '../data/todayIntro.ts';
import type { Element } from '../lib/saju.ts';

// 힘이 되는 요소를 누르는 요소(쇠는 나무를, 물은 불을, 나무는 흙을, 불은 쇠를, 흙은 물을 누른다)
const PRESS_OF: Record<Element, Element> = { wood: 'metal', fire: 'water', earth: 'wood', metal: 'fire', water: 'earth' };
import type { Band } from '../lib/timing.ts';

// 고민 점수의 등급말 - 숫자 옆에 한 단어가 있어야 '이게 높은 건가' 가 안 생긴다
const BAND_LABEL: Record<Band, string> = { good: '해볼 만해요', ok: '무난해요', hard: '조심할 때예요' };
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

export function ResultScreen({ result, note, busy, onShare, userName, deep = null, zodiac, chartScores = null, unlockedConcerns = [], onUnlockConcern, onOpenConcern, onAskNoti, onShareWeek, onBack }: Props) {
  const { luck } = result;
  const isMonth = result.reading.scale === 'month';
  // 지금이 하루의 어느 토막인지. 지나간 토막은 오늘의 풀이에서 접는다.
  // 켜둔 채 시간이 흘러도 따라가도록 시계를 구독한다.
  const clock = useDayPart();
  const nowPart = clock.part;
  const allPartsPassed = (['morning', 'afternoon', 'evening'] as const).every((p) =>
    partPassed(p, clock.at));
  // 고민을 골라 들어왔으면 맨 위 점수는 그 고민의 점수다. 명식에서 계산된 값이라
  // 오늘 점수(날짜 seed 기반)보다 이 화면이 하는 말과 더 붙는다.
  const concernLabel = deep ? findConcern(deep.concernKey).label : null;
  // 할 것 아래 '오늘 곁에 두면 좋은 것', 미룰 것 아래 '오늘 멀리하면 좋은 것'. 바로 실천할 수 있게
  // 빛깔, 음식, 음악, 친구를 붙인다(사장님 2026-10-12). 오늘 나한테 힘이 되는 요소(boost)에 드는 것과,
  // 그 요소를 누르는 요소에 드는 것이다. 생년월일이 없어 근거가 없으면 안 그린다.
  const boost = luck.boost ? OHAENG[luck.boost] : null;
  const press = luck.boost ? OHAENG[PRESS_OF[luck.boost]] : null;
  const match = result.detail.match;
  const goods = boost
    ? {
        tiles: [
          { k: '빛깔', v: luck.color.name, swatch: luck.color.hex },
          { k: '음식', v: luck.food.name },
          { k: '음악', v: boost.music[luck.number % boost.music.length] },
          { k: '친구', v: `${match.good.label} 친구` },
          { k: '시간', v: luckyWhen(luck.time, clock.at).label },
          { k: '방향', v: luck.direction },
        ],
        why: `오늘 나한테 힘이 되는 요소는 ${boost.ko}예요. 그래서 ${boost.ko}에 해당하는 빛깔과 음식, 음악을 골랐어요. 친구는 오늘 나와 잘 맞는 띠로 골랐어요.`,
      }
    : undefined;
  const avoids = boost && press
    ? {
        tiles: [
          { k: '빛깔', v: press.colors[0] },
          { k: '음식', v: `${press.taste}이 강한 음식` },
          { k: '음악', v: press.music[0] },
          { k: '조심할 띠', v: match.caution.label },
        ],
        why: `${withJosa(press.ko, '은는')} 오늘 힘이 되는 ${withJosa(boost.ko, '을를')} 누르는 요소예요. 그래서 ${press.ko}에 해당하는 빛깔과 음식, 음악은 오늘 조금 멀리해 두면 좋아요. ${match.caution.label} 친구와는 말이 엇갈리기 쉬우니 중요한 얘기는 다음으로 미뤄도 괜찮아요.`,
      }
    : undefined;
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

  // 뽑은 쪽지가 오늘 하는 말. 고민을 골라 들어왔으면 그 고민의 말로.
  const noteMsg = noteTodayOf(note.id, deep ? deep.concernKey : null, deep ? deep.read.optionKey : null);

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
        {/* 뽑은 쪽지 이름은 한 줄로 끝낸다. 결론은 바로 아래 카드가 맡는다.
            예전엔 여기 결론 한 줄과 까닭 한 줄을 크게 두고, 할 일과 피할 일은
            한참 아래에 까닭 없이 따로 뒀다. '그래서 오늘 뭘 하라는 거지' 가
            남는다는 말을 들었다. 점수와 쪽지는 여기, 결론은 그 바로 밑이다. */}
        <div className="score-hero__note">
          <span className="drawn__k">
            오늘 나의 쪽지 · <span className="drawn__kw">{note.name}</span>
          </span>
          {noteMsg ? <Sentences className="score-hero__msg" text={noteMsg} /> : null}
        </div>
      </div>

      {/* 오늘 전체 종합 → 오늘 할 것과 까닭 → 오늘 하지 말아야 할 것과 까닭.
          고민을 골라 뽑았든 그냥 뽑았든 같은 카드로 그린다. */}
      <TodayDecisionCard
        decision={deep ? deep.read.todayDecision : todayVibe(todayKey()).decision}
        scoreWhy={deep ? scoreWhyOf(deep.read, deep.concernKey, findConcern(deep.concernKey).label) : undefined}
        date={dateLabel(todayKey())}
        intro={deep ? todayIntroOf(deep.concernKey, deep.read.todayGroup) : undefined}
        goods={goods}
        avoids={avoids}
      />

      {/* 내일 또 뽑을 이유. 오늘 쪽지를 다 본 자리에서 내일 무엇이 달라지는지 한 줄,
          그리고 내일 다시 오게 하는 버튼 하나. '내일 대박' 같은 미끼는 안 쓴다.
          알림은 먼저 띄우지 않는다. 결과를 다 본 사람이 누를 때만 동의 창이 뜬다. */}
      <div className="sec-card tmr">
        <p className="cat4__head">내일은 어떤 쪽지가 나올까요</p>
        <Sentences
          className="tmr__v"
          text={deep ? deep.read.todayMeet.nextDay : '쪽지는 날마다 새로 뽑아요. 내일은 오늘과 다른 쪽지가 기다리고 있어요.'}
        />
        {onAskNoti ? (
          <button type="button" className="btn btn--primary tmr__btn" onClick={onAskNoti}>
            매일 오전 10시, 새 쪽지 알림 받기
          </button>
        ) : (
          <button type="button" className="btn btn--weak tmr__btn" disabled={busy} onClick={onShare}>
            친구한테 알려주고 내일 같이 뽑기
          </button>
        )}
      </div>

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

        {/* 4.7 오늘의 풀이 — 전체·오전·오후·저녁·사람·마음
            시각을 안 보고 세 토막을 늘 함께 띄우고 있었다. 그래서 아침 아홉
            시에 열어도 '오후엔 미뤄둔 답장 하나를 보내봐요' 가 떴고, 밤 아홉
            시에 열어도 '오후 세 시쯤 좋은 소식이 올 수 있어요' 가 떴다.
            지나간 토막은 접고, 지금인 토막에는 표를 단다. 이번 달 풀이는
            초반·중순·월말이라 시각과 상관이 없으니 그대로 다 띄운다. */}
        <div className="cat4 sec-card">
          <p className="cat4__head">{isMonth ? '이번 달 풀이' : '오늘의 풀이'}</p>
          <ul className="read6">
            {[
              { k: '전체', v: result.reading.overall, part: null },
              { k: isMonth ? '초반' : '오전', v: result.reading.morning, part: 'morning' as const },
              { k: isMonth ? '중순' : '오후', v: result.reading.afternoon, part: 'afternoon' as const },
              { k: isMonth ? '월말' : '저녁', v: result.reading.evening, part: 'evening' as const },
              { k: '사람', v: result.reading.people, part: null },
              { k: '마음', v: result.reading.mind, part: null },
            ]
              .filter((r) => isMonth || !r.part || !partPassed(r.part, clock.at))
              .map(({ k, v, part }) => (
                <li key={k} className="read6__row">
                  <span className="read6__k">
                    {k}
                    {!isMonth && part && part === nowPart ? <i className="read6__now">지금</i> : null}
                  </span>
                  <Sentences className="read6__v" text={String(v)} />
                </li>
              ))}
          </ul>
          {!isMonth && allPartsPassed ? (
            <Sentences
              className="mflow__foot"
              text="오늘 시간대별 풀이는 모두 지나갔어요. 내일 아침에 새 쪽지를 뽑아보세요."
            />
          ) : null}
        </div>

        </>
      )}

      {/* 6. 공유 */}
      {/* 내 사주 · 오늘 나에게 · 이번 주 — 전부 생년월일을 넣어야 의미가 있는 것들.
          그래서 홈이 아니라 결과를 받은 이 자리에 둔다. */}
      {/* 재미로 하나 더 — 여기부터는 사주 계산이 아니다. 본 풀이 사이에 끼우면
          색깔과 음식이 분석 행세를 하게 되므로 아래로 내려 따로 묶는다. */}
      {/* 여기부터는 고민과 상관없는 것들이다. 행운 여섯 칸도, 잘 맞는 띠도,
          이번 주 흐름도 '돈을 물어본 사람' 한테 하는 말이 아니라 누구에게나
          같은 말이다. 돈 화면 348줄 중 돈을 말하는 줄이 52줄뿐이었고, 그중
          69줄짜리 한 덩이가 통째로 여기였다.
          버리지는 않는다 - 매일 보는 재미는 이쪽에 있다. 대신 접는다.
          답을 받으러 온 사람에게는 답까지만 보이고, 더 볼 사람만 연다. */}
      <Chapter title="재미로 하나 더" fold>
      {/* 2. 네 가지 운 — 사랑·돈·일·건강 점수.
          고민을 골라 들어왔으면 안 그린다. 돈을 물어본 사람에게 사랑운·일운·
          건강운을 같이 내밀면 화면이 물어본 것 말고 딴 얘기로 채워진다.
          게다가 돈운 점수는 화면 맨 위가 이미 '돈 76점' 이라고 말한 그 값이다.
          같은 숫자를 두 번 말하면서 안 물어본 것 셋을 끼워 넣는 카드였다. */}
      {deep ? null : (
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

      <WeekCard zodiac={zodiac} onShare={onShareWeek} />
      </Chapter>

      <Disclaimer />

    </AppLayout>
  );
}

// '2026-10-12' → '10월 12일 월요일'
function dateLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const day = ['일', '월', '화', '수', '목', '금', '토'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 ${day}요일`;
}
