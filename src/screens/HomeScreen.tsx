import { AppLayout } from '../components/AppLayout.tsx';
import { ZodiacBadge } from '../components/ZodiacBadge.tsx';
import { Icon } from '../components/Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { Chapter } from '../components/Chapter.tsx';
import { GREETINGS } from '../data/copy.ts';
import { HOW_ROWS, HOW_HEAD, HOW_LEAD, HOW_FOOT } from '../data/howItWorks.ts';
import { todayVibe } from '../lib/dayVibe.ts';
import { todayKey, hashSeed } from '../lib/dateSeed.ts';
import { sajuToday, iljinOf, dailyZodiacRanking } from '../lib/saju.ts';
import type { BranchRelation } from '../lib/saju.ts';
import { softBreak } from '../lib/softBreak.ts';
import { buildRankingShareText } from '../lib/share.ts';
import { findZodiac, type Zodiac } from '../data/zodiac.ts';

// 글자를 세 갈래로 묶는다. 같은 글자는 언제나 같은 색이 되도록, 점수가 아니라
// 관계 자체로 가른다. 합(찰떡·짝꿍)은 파랑, 부딪히는 쪽은 진한 회색, 나머지는 회색.
function relTone(rel: BranchRelation): 'bond' | 'rough' | 'plain' {
  if (rel === 'trine' || rel === 'union') return 'bond';
  if (rel === 'clash' || rel === 'punish' || rel === 'selfPunish'
    || rel === 'harm' || rel === 'break') return 'rough';
  return 'plain';
}

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
  zodiac: Zodiac | null;
  /** 쪽지 뽑기 시작 — 주제 고르기(1단계)로 간다 */
  onStart: () => void;
  /** 회전 값 — 겉 문구가 열 때마다 돌아간다 */
  spin?: number;
  /** 띠 서열을 단톡방에 던진다. 주간 카드와 같은 자리, 같은 모양 */
  onShareRanking?: (text: string) => void;
};

// 홈 — '클릭해서 시작'하는 호기심 히어로(물음표)를 중심으로 정리.
export function HomeScreen({
  streak,
  zodiac,
  onStart,
  onShareRanking,
  spin = 0,
}: Props) {
  // 오늘 이미 뽑았으면 그 결과를 히어로 카드에도 반영한다(잠긴 ?  실제 값).
  // 주간 캘린더는 띠가 있어야 계산된다. 잠금 상태에서도 미리 계산해두면
  // 해금 순간 바로 그려져 '열었는데 빈 화면' 이 없다.
  const vibe = todayVibe(todayKey());
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
                {/* '지금은 안정 / 기운이 좋아요' 로 명사 가운데가 끊기면 안 읽힌다.
                    기운 이름과 서술을 한 덩이로 묶어 그 안에서는 안 끊기게 한다. */}
                <p className="today-hook__line">
                  지금은{' '}
                  <span className="nowrap">
                    <b>{vibe.word}</b> 기운
                  </span>
                  이 좋아요
                </p>
                <p className="today-hook__hint">{vibe.line}</p>
              </>
            )}
          </div>
          <span className="today-hook__art" aria-hidden>
            <Mascot size={96} score={streak >= 3 ? 90 : 80} bare />
          </span>
        </div>
        <button type="button" className="btn btn--primary today-hook__cta" onClick={onStart}>
          오늘 쪽지 열어보기
        </button>
      </div>

      {/* 오늘의 띠 서열 — 매일 갈리는 열두 띠 순위. 아직 아무것도 안 넣은 사람도
          볼 수 있는 유일한 콘텐츠라 '내 띠' 를 아는 척하지 않는다. 순위만 보여준다. */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">오늘의 띠 서열</h2>
          {/* 서열표를 만드는 코드는 있었는데 누르는 자리가 없었다.
              주간 카드와 같은 자리, 같은 모양으로 붙인다. */}
          {onShareRanking && ranking.length >= 12 ? (
            <button
              type="button"
              className="sec__action"
              onClick={() =>
                onShareRanking(
                  buildRankingShareText({
                    dateLabel: todayLabel(),
                    top3: ranking.slice(0, 3).map((r) => ({
                      label: findZodiac(r.animal)?.label ?? '',
                      emoji: '',
                      toneWord: r.relationGloss,
                    })),
                    last: {
                      label: findZodiac(ranking[11].animal)?.label ?? '',
                      emoji: '',
                      toneWord: ranking[11].relationGloss,
                    },
                    me: zodiac
                      ? (() => {
                          const mine = ranking.find((r) => r.animal === zodiac.id);
                          return mine
                            ? { label: zodiac.label, emoji: '', rank: mine.rank, gloss: mine.relationGloss }
                            : null;
                        })()
                      : null,
                  }),
                )
              }
            >
              공유
            </button>
          ) : null}
        </div>
        {/* 열둘을 다 보여준다. 다섯만 보여주면 6위 아래인 사람은 제 자리를
            영영 못 본다 - '서열' 이라고 이름을 붙여놓고 반도 안 보여주는 셈이고,
            공유 글은 이미 1~3위와 꼴찌를 같이 적고 있었다. 이 카드는 아무것도
            안 넣은 사람이 볼 수 있는 유일한 콘텐츠라, 제 띠를 찾는 재미가
            그대로 다시 올 이유가 된다. */}
        <div className="rank-card">
          <ol className="rank-list">
            {ranking.map((r) => {
              const z = findZodiac(r.animal);
              return (
                <li key={r.animal} className="rank-row">
                  <span className={`rank-row__no num${r.rank === 1 ? ' rank-row__no--first' : ''}`}>{r.rank}</span>
                  {z ? <ZodiacBadge zodiac={z} size={32} /> : null}
                  <span className="rank-row__name">{z?.label}</span>
                  {/* 등급 말을 붙이면 1~3위가 전부 '아주 좋아요' 로 뭉쳐서
                      서열이라는 말이 무색해진다. 순서는 왼쪽 숫자가 이미 말한다.
                      여기는 왜 그 자리인지를 적는다 — 주간 표가 쓰는 같은 어휘다.
                      색은 점수(tone)가 아니라 글자(relation)를 따라간다. 점수를
                      따라가면 4위와 9위가 똑같이 '무난한 사이' 인데 하나는 파랑,
                      하나는 회색이 된다 - 한 목록 안에서 같은 말이 두 색으로
                      보이는 것만큼 읽는 사람을 헷갈리게 하는 게 없다. */}
                  <span className={`rank-row__tone rank-row__tone--${relTone(r.relation)}`}>
                    {r.relationGloss}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 이 답은 이렇게 나와요 — 찍는 게 아니라 계산한다는 걸 밝히는 자리.
          적중률 같은 숫자는 쓰지 않는다. 증명할 수 없는 숫자 한 줄이 나머지 전부의 신뢰를 깎는다.
          전에는 접어뒀다. 매일 오는 사람에게는 지나갈 길이라서. 그런데 접는
          것을 화면에서 전부 걷어내기로 해서 여기도 폈다. 매일 오는 사람이
          여섯 문단을 지나쳐야 하는 건 그대로 남는 값이다. */}
      <section className="sec how">
        <Chapter title={HOW_HEAD} hint={HOW_LEAD}>
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
        </Chapter>
        <p className="how__foot">{HOW_FOOT}</p>
      </section>

    </AppLayout>
  );
}
