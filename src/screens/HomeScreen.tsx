import { AppLayout } from '../components/AppLayout.tsx';
import { ZodiacBadge } from '../components/ZodiacBadge.tsx';
import { Icon } from '../components/Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { findNote } from '../data/notes.ts';
import { GREETINGS } from '../data/copy.ts';
import { HOW_ROWS, HOW_HEAD, HOW_LEAD, HOW_FOOT } from '../data/howItWorks.ts';
import { useState } from 'react';
import { todayVibe } from '../lib/dayVibe.ts';
import { todayKey, hashSeed } from '../lib/dateSeed.ts';
import { sajuToday, iljinOf, dailyZodiacRanking } from '../lib/saju.ts';
import { softBreak } from '../lib/softBreak.ts';
import { findZodiac, type Zodiac } from '../data/zodiac.ts';
import type { TodayReading } from '../lib/storage.ts';

function todayLabel(): string {
  const d = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week})`;
}

// 시간대를 고르고, 그 안에서 날짜 seed 로 문구를 골라 매일 다른 인사를 건넨다.
function greeting(dateKey: string, spin: number): string {
  const h = new Date().getHours();
  const slot =
    h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night';
  const pool = GREETINGS[slot];
  return pool[hashSeed(`greet|${dateKey}|${slot}` + '|' + spin) % pool.length];
}

type Props = {
  streak: number;
  todayReading: TodayReading | null;
  zodiac: Zodiac | null;
  onReopen: () => void;
  /** 쪽지 뽑기 시작 — 주제 고르기(1단계)로 간다 */
  onStart: () => void;
  /** 회전 값 — 겉 문구가 열 때마다 돌아간다 */
  spin?: number;
  onReset: () => void;
};

// 홈 — '클릭해서 시작'하는 호기심 히어로(물음표)를 중심으로 정리.
export function HomeScreen({
  streak,
  todayReading,
  zodiac,
  onReopen,
  onStart,
  spin = 0,
  onReset,
}: Props) {
  // 오늘 이미 뽑았으면 그 결과를 히어로 카드에도 반영한다(잠긴 ?  실제 값).
  const drawn = todayReading?.result ?? null;
  // 주간 캘린더는 띠가 있어야 계산된다. 잠금 상태에서도 미리 계산해두면
  // 해금 순간 바로 그려져 '열었는데 빈 화면' 이 없다.
  const [confirmReset, setConfirmReset] = useState(false);
  const vibe = todayVibe(todayKey());
  const drawnName = todayReading ? findNote(todayReading.noteId)?.name ?? null : null;
  const iljin = iljinOf(todayKey());
  const saju = zodiac ? sajuToday(todayKey(), zodiac.id) : null;
  const ranking = dailyZodiacRanking(todayKey());


  return (
    <AppLayout>
      {/* 첫 블록 — 상단 네비에 앱 이름이 이미 있어서, 큰 제목 자리는 앱 이름을
          반복하지 않고 '나에게 건네는 인사'가 차지한다. (예전엔 같은 글자가 두 번) */}
      <div className="home-hero">
        <h1 className="h1">{softBreak(greeting(todayKey(), spin))}</h1>
        {/* 날짜와 연속 기록은 제목 위 알약 두 개가 아니라 제목 밑 보조 한 줄이다.
            제목 위에 뭔가 있으면 헤더가 둘로 읽힌다. */}
        <p className="home-hero__sub">
          {todayLabel()}
          {' · '}
          {streak >= 7
            ? `${streak}일째!`
            : streak >= 2
              ? `${streak}일째 쪽지`
              : todayReading
                ? '1일째 쪽지'
                : '오늘의 첫 쪽지'}
        </p>
      </div>

      {/*  메인 focal — '오늘의 나'훅 카드
          사주 일진(日辰) 기반: 오늘 일진과 내 띠의 전통 관계(삼합·육합·상충 등)로
          '오늘 기운'을 결정적으로 계산해 개인화. 띠 미설정 시 일진+오늘 기운만 노출.
          잠긴 결과(?점·?)로 궁금증/FOMO 유발 뽑아야 전부 열림 */}
      {/* 메인 카드 — 글은 왼쪽, 마스코트는 오른쪽 크게, 버튼은 한 줄 꽉 채워서.
          물음표 세 칸으로 궁금하게 만들던 방식은 걷었다. 누를 게 하나여야 누르고 싶어진다. */}
      <div className="today-hook">
        <div className="today-hook__head">
          <div className="today-hook__txt">
            <span className="today-hook__kw">오늘은 {iljin.kor}일</span>
            {zodiac && saju ? (
              <>
                <p className="today-hook__line">{softBreak(saju.title, 14)}</p>
                <p className="today-hook__hint">{saju.headline}</p>
              </>
            ) : (
              <>
                <p className="today-hook__line">
                  지금은 <b>{vibe.word}</b> 기운이 좋아요
                </p>
                <p className="today-hook__hint">{vibe.line}</p>
              </>
            )}
          </div>
          <span className="today-hook__art" aria-hidden>
            <Mascot size={96} score={drawn ? drawn.luck.total : streak >= 3 ? 90 : 80} bare />
          </span>
        </div>
        {drawn ? (
          <div className="today-hook__score">
            <span className="today-hook__score-k">오늘 점수</span>
            <span className="today-hook__score-v"><b className="num">{drawn.luck.total}</b>점</span>
            {drawnName ? <span className="today-hook__score-note">{drawnName}</span> : null}
          </div>
        ) : null}
        <button type="button" className="btn btn--primary today-hook__cta" onClick={onStart}>
          {drawn ? '하나 더 열어보기' : '오늘 쪽지 열어보기'}
        </button>
      </div>

      {/* 오늘의 띠 서열 — 매일 갈리는 열두 띠 순위. 아직 아무것도 안 넣은 사람도
          볼 수 있는 유일한 콘텐츠라 '내 띠' 를 아는 척하지 않는다. 순위만 보여준다. */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">오늘의 띠 서열</h2>
        </div>
        <div className="rank-card">
          <ol className="rank-list rank-list--top">
            {ranking.slice(0, 5).map((r) => {
              const z = findZodiac(r.animal);
              return (
                <li key={r.animal} className="rank-row">
                  <span className={`rank-row__no num${r.rank === 1 ? ' rank-row__no--first' : ''}`}>{r.rank}</span>
                  {z ? <ZodiacBadge zodiac={z} size={32} /> : null}
                  <span className="rank-row__name">{z?.label}</span>
                  <span className={`rank-row__tone rank-row__tone--${r.tone}`}>{r.toneWord}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 이 답은 이렇게 나와요 — 찍는 게 아니라 계산한다는 걸 밝히는 자리.
          적중률 같은 숫자는 쓰지 않는다. 증명할 수 없는 숫자 한 줄이 나머지 전부의 신뢰를 깎는다. */}
      <section className="sec how">
        <div className="sec__head">
          <h2 className="sec__title">{HOW_HEAD}</h2>
        </div>
        <p className="how__lead">{HOW_LEAD}</p>
        <ol className="how__list">
          {HOW_ROWS.map((r, i) => (
            <li key={r.title} className="how__row">
              <span className="how__no num" aria-hidden>{i + 1}</span>
              <span className="how__icon" aria-hidden><Icon name={r.icon} size={18} /></span>
              <span className="how__body">
                <strong className="how__title">{r.title}</strong>
                <span className="how__text">{r.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="how__foot">{HOW_FOOT}</p>
      </section>

      {/* 오늘 받은 편지 다시 읽기 */}
      {todayReading ? (
        <button type="button" className="reopen-card" onClick={onReopen}>
          <span className="reopen-card__icon" aria-hidden>
            <Icon name="feather" size={22} />
          </span>
          <span className="reopen-card__body">
            <span className="reopen-card__label">오늘 받은 편지</span>
            <span className="reopen-card__text">
              {todayReading.result.title} · 오늘 점수 {todayReading.result.luck.total}점
            </span>
          </span>
          <span className="reopen-card__cta">다시 읽기 ›</span>
        </button>
      ) : null}

      {/* 삭제 확인 — window.confirm 은 웹뷰·샌드박스 iframe 에서 조용히 false 를
          돌려주는 경우가 있어(그러면 눌러도 아무 일도 안 일어남) 앱 안에서 두 번
          눌러 확인받는다. 어떤 환경에서도 동작하고, 실수로 지우는 것도 막는다. */}
      {confirmReset ? (
        <div className="reset-confirm">
          <p className="reset-confirm__q">
            내 띠·별자리·저장한 사람을 모두 지울까요?
          </p>
          <div className="reset-confirm__row">
            <button type="button" className="reset-confirm__no" onClick={() => setConfirmReset(false)}>
              아니요
            </button>
            <button
              type="button"
              className="reset-confirm__yes"
              onClick={() => {
                setConfirmReset(false);
                onReset();
              }}
            >
              네, 전부 지울게요
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="reset-link" onClick={() => setConfirmReset(true)}>
          내 데이터 전체 삭제
        </button>
      )}
    </AppLayout>
  );
}
