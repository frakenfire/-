import { AppLayout } from '../components/AppLayout.tsx';
import { ZodiacBadge } from '../components/ZodiacBadge.tsx';
import { Icon, type IconName } from '../components/Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { FORTUNE_LABEL } from '../data/fortuneTypes.ts';
import { findNote } from '../data/notes.ts';
import { GREETINGS } from '../data/copy.ts';
import { useMemo, useState } from 'react';
import { todayVibe } from '../lib/dayVibe.ts';
import { todayKey, hashSeed } from '../lib/dateSeed.ts';
import { sajuToday, iljinOf, dailyZodiacRanking } from '../lib/saju.ts';
import { shareMessage, buildRankingShareText } from '../lib/share.ts';
import { softBreak } from '../lib/softBreak.ts';
import { computeWeekAhead, buildWeekShareText, type WeekDay } from '../lib/weekAhead.ts';
import { findZodiac, ZODIACS, type Zodiac, type ZodiacId } from '../data/zodiac.ts';
import { DAY_ANSWERS } from '../data/sajuAnswers.ts';
import type { GodGroup } from '../lib/tenGods.ts';
import type { StoredResult, TodayReading, RarityCounts } from '../lib/storage.ts';

function todayLabel(): string {
  const d = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week})`;
}

// 시간대를 고르고, 그 안에서 날짜 seed 로 문구를 골라 매일 다른 인사를 건넨다.
function greeting(dateKey: string): string {
  const h = new Date().getHours();
  const slot =
    h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'afternoon' : h >= 17 && h < 22 ? 'evening' : 'night';
  const pool = GREETINGS[slot];
  return pool[hashSeed(`greet|${dateKey}|${slot}`) % pool.length];
}

type Props = {
  streak: number;
  rarityCounts: RarityCounts;
  yesterdayRecord: StoredResult | null;
  todayReading: TodayReading | null;
  zodiac: Zodiac | null;
  onZodiac: (id: ZodiacId) => void;
  onReopen: () => void;
  onCompat: () => void;
  /** 쪽지 뽑기 시작 — 주제 고르기(1단계)로 간다 */
  onStart: () => void;
  /** 손님이 사주 앱에서 자주 찾는 '이번 달 운세' 로 바로 */
  onStartMonth: () => void;
  onReset: () => void;
  /** 주간 캘린더 — 스트릭 3일 이상이면 무료, 아니면 광고로 연다 */
  weekUnlocked: boolean;
  /** 사주를 이미 세웠으면 일간 배지, 아니면 null */
  sajuBadge: { icon: IconName; name: string; hue: string; group: GodGroup } | null;
  onSaju: () => void;
  onUnlockWeek: () => void;
  onShareWeek: (text: string) => void;
};

// 홈 — '클릭해서 시작'하는 호기심 히어로(물음표)를 중심으로 정리.
export function HomeScreen({
  streak,
  weekUnlocked,
  sajuBadge,
  onSaju,
  onUnlockWeek,
  onShareWeek,
  rarityCounts,
  yesterdayRecord,
  todayReading,
  zodiac,
  onZodiac,
  onReopen,
  onCompat,
  onStart,
  onStartMonth,
  onReset,
}: Props) {
  const yNote = yesterdayRecord ? findNote(yesterdayRecord.noteId) : null;
  // 오늘 이미 뽑았으면 그 결과를 히어로 카드에도 반영한다(잠긴 ?  실제 값).
  const drawn = todayReading?.result ?? null;
  // 주간 캘린더는 띠가 있어야 계산된다. 잠금 상태에서도 미리 계산해두면
  // 해금 순간 바로 그려져 '열었는데 빈 화면' 이 없다.
  const week = useMemo(
    () => (zodiac ? computeWeekAhead(todayKey(), zodiac.id) : null),
    [zodiac],
  );
  const [pick, setPick] = useState<'zodiac' | 'star' | null>(null);
  const [rankOpen, setRankOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const vibe = todayVibe(todayKey());
  const drawnName = todayReading ? findNote(todayReading.noteId)?.name ?? null : null;
  const iljin = iljinOf(todayKey());
  const saju = zodiac ? sajuToday(todayKey(), zodiac.id) : null;
  const ranking = dailyZodiacRanking(todayKey());
  const myRank = zodiac ? ranking.find((r) => r.animal === zodiac.id) ?? null : null;

  async function shareRanking() {
    const z = (id: ZodiacId) => findZodiac(id);
    const row = (r: (typeof ranking)[number]) => ({
      label: z(r.animal)?.label ?? '',
      emoji: z(r.animal)?.emoji ?? '',
      toneWord: r.toneWord,
    });
    const text = buildRankingShareText({
      dateLabel: todayLabel(),
      top3: ranking.slice(0, 3).map(row),
      last: row(ranking[ranking.length - 1]),
      me:
        myRank && zodiac
          ? { label: zodiac.label, emoji: zodiac.emoji, rank: myRank.rank, gloss: myRank.relationGloss }
          : null,
    });
    const outcome = await shareMessage(text);
    if (outcome === 'copied') {
      setShared(true);
      window.setTimeout(() => setShared(false), 2600);
    }
  }

  return (
    <AppLayout>
      {/* 첫 블록 — 상단 네비에 앱 이름이 이미 있어서, 큰 제목 자리는 앱 이름을
          반복하지 않고 '나에게 건네는 인사'가 차지한다. (예전엔 같은 글자가 두 번) */}
      <div className="home-hero">
        <h1 className="h1">{softBreak(greeting(todayKey()))}</h1>
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
          {drawn ? '다른 기분으로 하나 더 뽑기' : '쪽지 뽑기 시작하기'}
        </button>
      </div>

      {/* 내 사주 — 이 앱에서 가장 개인적인 값이라 홈 상단에 둔다.
          아직 안 만든 사람에겐 '띠로는 12분의 1'이라는 이유를 대고 부른다. */}
      {sajuBadge ? (
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
      ) : (
        <button type="button" className="saju-entry" onClick={onSaju}>
          <span className="saju-entry__icon" aria-hidden>
            <Mascot size={32} mood="calm" bare />
          </span>
          <span className="saju-entry__text">
            <strong className="saju-entry__v">생년월일 입력하기</strong>
            <span className="saju-entry__sub">태어난 날짜와 시각</span>
          </span>
          <span className="saju-entry__chev" aria-hidden>›</span>
        </button>
      )}

      {/* 오늘 나에게 — 사주 있는 사람이 홈에서 바로 보고 싶은 것: 오늘 돈·사랑·일 */}
      {sajuBadge ? (
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
      ) : null}

      {/* 이번 주 운세 캘린더 — 스트릭에 줄 보상이자, 좋은 날을 미리 알려
          그날 다시 오게 만드는 리텐션 장치. 잠금 해제는 스트릭(무료) 또는 광고. */}
      {zodiac ? (
        <section className="sec">
          <div className="sec__head">
            <h2 className="sec__title">이번 주 내 운세</h2>
            {weekUnlocked ? (
              <button
                type="button"
                className="sec__action"
                onClick={() => onShareWeek(buildWeekShareText(week!, zodiac.label, zodiac.emoji))}
              >
                공유
              </button>
            ) : null}
          </div>
          <div className="week-card">
          {weekUnlocked && week ? (
            <>
              <p className="week-card__headline">{week.headline}</p>
              <ol className="week-list">
                {week.days.map((d: WeekDay) => (
                  <li
                    key={d.dateKey}
                    className={`week-row week-row--${d.tone}${d.isToday ? ' week-row--today' : ''}${
                      d.dateKey === week.best.dateKey ? ' week-row--best' : ''
                    }`}
                  >
                    <span className="week-row__day">
                      {d.weekday}
                      {d.isToday ? <i>오늘</i> : null}
                    </span>
                    <span className="week-row__date">{d.short}</span>
                    <span className="week-row__rel">{d.relationGloss}</span>
                    <span className="week-row__tone">{d.toneWord}</span>
                  </li>
                ))}
              </ol>
              {week.caution ? (
                <p className="week-card__foot">
                   {week.caution.isToday ?'오늘' : `${week.caution.weekday}요일`}은 한 박자 천천히 가면 좋아요
                </p>
              ) : null}
            </>
          ) : (
            <button type="button" className="week-lock" onClick={onUnlockWeek}>
              <span className="week-lock__icon" aria-hidden><Icon name="calendar" size={20} /></span>
              <span className="week-lock__text">
                <span className="week-lock__title">앞으로 7일, 언제가 좋은 날일까요?</span>
                <span className="week-lock__desc">
                  {streak >= 3
                    ? `${streak}일 연속 달성, 이번 주 캘린더가 무료로 열려요`
                    : `${3 - streak}일만 더 연속 뽑으면 무료로 열려요 · 지금 보려면 광고`}
                </span>
              </span>
              <span className="week-lock__cta">{streak >= 3 ? '무료로 열기' : '미리보기'}</span>
            </button>
          )}
          </div>
        </section>
      ) : null}

      {/* 오늘의 12띠 서열 — 사주(일진) 기반 매일 갈리는 랭킹. 단톡방 도발 공유의 핵 */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">오늘의 띠 서열</h2>
          <button type="button" className="sec__action sec__action--go" onClick={shareRanking}>
            {shared ?'복사됨' : '단톡방에 던지기'}
          </button>
        </div>
        <div className="rank-card">
        {shared ? (
          <p className="rank-card__copied">서열표 복사 완료! 단톡방에 붙여넣기만 하면 돼요</p>
        ) : null}

        {/* 순위는 목록이다. 타일 세 장을 나란히 세우면 '카드 더미' 로 읽히고,
            4위부터는 어차피 목록이라 위아래 모양이 달라진다. 처음부터 한 목록으로. */}
        <ol className="rank-list rank-list--top">
          {ranking.slice(0, 3).map((r) => {
            const z = findZodiac(r.animal);
            const me = zodiac?.id === r.animal;
            return (
              <li key={r.animal} className={me ? 'rank-row rank-row--me' : 'rank-row'}>
                <span className={`rank-row__no num${r.rank === 1 ? ' rank-row__no--first' : ''}`}>{r.rank}</span>
                {z ? <ZodiacBadge zodiac={z} size={32} /> : null}
                <span className="rank-row__name">
                  {z?.label}
                  {me ? ' (나)' : ''}
                </span>
                <span className={`rank-row__tone rank-row__tone--${r.tone}`}>{r.toneWord}</span>
              </li>
            );
          })}
        </ol>

        {myRank && zodiac ? (
          /* 누른 직후 '내 것'이 한눈에 보여야 한다 — 이모지 + 큰 순위 숫자 카드.
             예전엔 회색 한 줄 텍스트라 방금 고른 결과가 어디 있는지 안 보였다. */
          <div className={`me-rank${myRank.rank <= 3 ? ' me-rank--top' : ''}`}>
            <ZodiacBadge zodiac={zodiac} size={44} tone="brand" />
            <span className="me-rank__body">
              <span className="me-rank__title">내 {zodiac.label}, 오늘</span>
              <span className="me-rank__sub">
                {myRank.rank === 1
                  ?'1위! 단톡방 자랑각이에요'
                  : myRank.rank <= 3
                    ? '포디움에 올랐어요 · 기분 좋게 시작해요'
                    : `${myRank.relationGloss} · 기운 ${myRank.toneWord}`}
              </span>
            </span>
            <span className="me-rank__rank">
              <b className="num">{myRank.rank}</b>위<i>/12</i>
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="lucky-today__set"
            onClick={() => setPick((v) => (v === 'zodiac' ? null : 'zodiac'))}
          >
            내 띠 고르면 오늘 몇 위인지 바로 나와요 {pick === 'zodiac' ?'' : ''}
          </button>
        )}
        {!zodiac && pick === 'zodiac' ? (
          <div className="zodiac-grid zodiac-grid--full me-grid">
            {ZODIACS.map((z) => (
              <button
                key={z.id}
                type="button"
                className="zodiac-chip"
                onClick={() => {
                  onZodiac(z.id);
                  // 포디움(1~3위) 밖이면 전체 목록을 자동으로 펼쳐,
                  // 방금 고른 내 띠가 어디 있는지 바로 보이게 한다.
                  const mine = ranking.find((row) => row.animal === z.id);
                  if (mine && mine.rank > 3) setRankOpen(true);
                }}
              >
{z.label}
              </button>
            ))}
          </div>
        ) : null}

        <button type="button" className="rank-card__more" onClick={() => setRankOpen((v) => !v)}>
          {rankOpen ?'접기' : '4위부터 꼴찌까지 보기'}
        </button>
        {rankOpen ? (
          <ol className="rank-list">
            {ranking.slice(3).map((r) => {
              const z = findZodiac(r.animal);
              const me = zodiac?.id === r.animal;
              return (
                <li key={r.animal} className={me ? 'rank-row rank-row--me' : 'rank-row'}>
                  <span className="rank-row__no num">{r.rank}</span>
                  {z ? <ZodiacBadge zodiac={z} size={32} /> : null}
                  <span className="rank-row__name">
                    {z?.label}
                    {me ? ' (나)' : ''}
                  </span>
                  <span className={`rank-row__tone rank-row__tone--${r.tone}`}>{r.toneWord}</span>
                </li>
              );
            })}
          </ol>
        ) : null}
        </div>
      </section>

      {/* 더 해보기 — 성격이 같은 '이동' 줄들은 한 덩어리로 묶는다.
          따로 떨어진 카드 두 장은 '더미'로, 묶인 목록은 '메뉴'로 읽힌다. */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">더 해보기</h2>
        </div>
        <div className="rowlist">
      <button type="button" className="compat-banner" onClick={onStartMonth}>
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

      {/* 오늘 받은 편지 다시 읽기 */}
      {todayReading ? (
        <button type="button" className="reopen-card" onClick={onReopen}>
          <span className="reopen-card__icon" aria-hidden>
            <Icon name="feather" size={22} />
          </span>
          <span className="reopen-card__body">
            <span className="reopen-card__label">오늘 받은 편지</span>
            <span className="reopen-card__text">
              {todayReading.result.title} · 총운 {todayReading.result.luck.total}점
            </span>
          </span>
          <span className="reopen-card__cta">다시 읽기 ›</span>
        </button>
      ) : null}
        </div>
      </section>

      {rarityCounts.legendary + rarityCounts.epic + rarityCounts.rare > 0 || (yesterdayRecord && yNote) ? (
        <section className="sec">
          <div className="sec__head">
            <h2 className="sec__title">내 기록</h2>
          </div>
      {rarityCounts.legendary + rarityCounts.epic + rarityCounts.rare > 0 ? (
        <div className="collection">
          <span className="collection__title">이번 달 뽑은 쪽지</span>
          <div className="collection__items">
            {rarityCounts.legendary > 0 ? (
              <span className="collection__item collection__item--leg">전설 {rarityCounts.legendary}</span>
            ) : null}
            {rarityCounts.epic > 0 ? (
              <span className="collection__item collection__item--epic">에픽 {rarityCounts.epic}</span>
            ) : null}
            {rarityCounts.rare > 0 ? (
              <span className="collection__item">레어 {rarityCounts.rare}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {yesterdayRecord && yNote ? (
        <div className="recap-card">
          <span className="recap-card__icon" aria-hidden>
            <Icon name={yNote.icon} size={22} />
          </span>
          <span className="recap-card__body">
            <span className="recap-card__label">어제 뽑은 쪽지</span>
            <span className="recap-card__text">
              {FORTUNE_LABEL[yesterdayRecord.fortuneType]} · {yNote.name}
            </span>
          </span>
        </div>
      ) : null}
        </section>
      ) : null}

      {/* 삭제 확인 — window.confirm 은 웹뷰·샌드박스 iframe 에서 조용히 false 를
          돌려주는 경우가 있어(그러면 눌러도 아무 일도 안 일어남) 앱 안에서 두 번
          눌러 확인받는다. 어떤 환경에서도 동작하고, 실수로 지우는 것도 막는다. */}
      {confirmReset ? (
        <div className="reset-confirm">
          <p className="reset-confirm__q">
            내 띠·별자리·저장한 사람·출석 기록을 모두 지울까요?
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
