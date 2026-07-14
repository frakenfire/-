import { AppLayout } from '../components/AppLayout';
import { FortuneTypeButton } from '../components/FortuneTypeButton';
import { Mascot } from '../components/Mascot';
import { FORTUNE_TYPES, FORTUNE_LABEL } from '../data/fortuneTypes';
import { findNote } from '../data/notes';
import { HOME } from '../data/copy';
import { useState } from 'react';
import { todayVibe } from '../lib/dayVibe';
import { todayKey } from '../lib/dateSeed';
import { sajuToday, iljinOf, dailyZodiacRanking } from '../lib/saju';
import { shareMessage } from '../lib/share';
import { findZodiac, ZODIACS, type Zodiac, type ZodiacId } from '../data/zodiac';
import { ZODIAC_TRAIT } from '../data/traits';
import type { StoredResult, TodayReading, RarityCounts } from '../lib/storage';
import type { FortuneType } from '../types/fortune';

function todayLabel(): string {
  const d = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week})`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return '좋은 아침이에요 ☀️';
  if (h >= 11 && h < 17) return '오후도 잘 버티고 있죠? 🍀';
  if (h >= 17 && h < 22) return '오늘도 수고했어요 🌙';
  return '늦은 밤까지 애썼어요 ✨';
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
  onSelect: (t: FortuneType) => void;
  onReset: () => void;
};

// 홈 — '클릭해서 시작'하는 호기심 히어로(물음표)를 중심으로 정리.
export function HomeScreen({
  streak,
  rarityCounts,
  yesterdayRecord,
  todayReading,
  zodiac,
  onZodiac,
  onReopen,
  onCompat,
  onSelect,
  onReset,
}: Props) {
  const yNote = yesterdayRecord ? findNote(yesterdayRecord.noteId) : null;
  const [pick, setPick] = useState<'zodiac' | 'star' | null>(null);
  const [rankOpen, setRankOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const vibe = todayVibe(todayKey());
  const iljin = iljinOf(todayKey());
  const saju = zodiac ? sajuToday(todayKey(), zodiac.id) : null;
  const ranking = dailyZodiacRanking(todayKey());
  const myRank = zodiac ? ranking.find((r) => r.animal === zodiac.id) ?? null : null;

  async function shareRanking() {
    const top3 = ranking.slice(0, 3);
    const last = ranking[ranking.length - 1];
    const medal = ['🥇', '🥈', '🥉'];
    const z = (id: ZodiacId) => findZodiac(id);
    const lines = [
      `[오늘쪽지] ${todayLabel()} 오늘의 띠 서열 🏆`,
      top3.map((r, i) => `${medal[i]} ${z(r.animal)?.emoji}${z(r.animal)?.label}`).join('  '),
      `… 꼴찌 ${z(last.animal)?.emoji}${z(last.animal)?.label} 😇`,
      myRank ? `내 띠는 ${myRank.rank}위! 너는 몇 위? 👀` : '네 띠는 몇 위인지 확인해봐 👀',
    ];
    const outcome = await shareMessage(lines.join('\n'));
    if (outcome === 'copied') {
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  }

  return (
    <AppLayout>
      <div className="home-hero">
        <div className="home-hero__top">
          <div>
            <div className="pill-row">
              <span className="date-pill">{todayLabel()}</span>
              {streak >= 7 ? (
                <span className="streak-pill streak-pill--crown">👑 {streak}일째!</span>
              ) : streak >= 2 ? (
                <span className="streak-pill">🔥 {streak}일째 쪽지</span>
              ) : (
                <span className="streak-pill streak-pill--new">🌱 오늘의 첫 쪽지</span>
              )}
            </div>
            <h1 className="h1">{HOME.title}</h1>
          </div>
          <Mascot size={78} score={streak >= 3 ? 90 : 80} />
        </div>
        <p className="home-hero__sub">{greeting()}</p>
      </div>

      {/* ★ 메인 focal — '오늘의 나' 훅 카드
          사주 일진(日辰) 기반: 오늘 일진과 내 띠의 전통 관계(삼합·육합·상충 등)로
          '오늘 기운'을 결정적으로 계산해 개인화. 띠 미설정 시 일진+오늘 기운만 노출.
          잠긴 결과(?점·?)로 궁금증/FOMO 유발 → 뽑아야 전부 열림 */}
      <button type="button" className="today-hook" onClick={() => onSelect('tomorrow')}>
        <span className="today-hook__kw">
          🔮 오늘의 일진 · {iljin.kor}({iljin.hanja})일
        </span>
        {zodiac && saju ? (
          <>
            <p className="today-hook__persona">
              {ZODIAC_TRAIT[zodiac.id]} {zodiac.emoji}
              {zodiac.label}인 당신,
            </p>
            <p className="today-hook__line">{saju.title}</p>
            <div className="today-hook__saju" aria-hidden>
              <span className="saju-chip saju-chip--rel">
                내 띠와 {saju.relationKo}
              </span>
              <span className="saju-chip">기운 {saju.toneWord}</span>
            </div>
            <p className="today-hook__hint">{saju.headline}</p>
          </>
        ) : (
          <>
            <p className="today-hook__line">
              지금은 <b>‘{vibe.word}’</b> 기운이 좋아요
            </p>
            <p className="today-hook__hint">
              {vibe.line} 내 띠를 고르면 오늘 일진과 얼마나 맞는지 봐요.
            </p>
          </>
        )}

        {/* '이런 걸 볼 수 있다' — 뽑으면 열리는 것 미리보기(잠긴 ?)로 궁금증 */}
        <p className="today-hook__preview-k">쪽지를 뽑으면 이런 걸 볼 수 있어요</p>
        <div className="today-hook__reveal" aria-hidden>
          <div className="th-cell">
            <span className="th-cell__k">오늘 총운</span>
            <span className="th-cell__v">?<i>점</i></span>
          </div>
          <div className="th-cell">
            <span className="th-cell__k">행운의 색</span>
            <span className="th-cell__v th-cell__v--q">?</span>
          </div>
          <div className="th-cell">
            <span className="th-cell__k">행운 음식</span>
            <span className="th-cell__v th-cell__v--q">?</span>
          </div>
        </div>

        <span className="today-hook__cta">
          쪽지 뽑기 시작하기
          <i className="today-hook__cta-arrow" aria-hidden>›</i>
        </span>
      </button>

      {/* 오늘의 12띠 서열 — 사주(일진) 기반 매일 갈리는 랭킹. 단톡방 도발 공유의 핵 */}
      <div className="rank-card">
        <div className="rank-card__head">
          <p className="rank-card__title">🏆 오늘의 띠 서열</p>
          <button type="button" className="rank-card__share" onClick={shareRanking}>
            {shared ? '복사됨!' : '단톡방에 던지기 💬'}
          </button>
        </div>

        <div className="rank-podium">
          {ranking.slice(0, 3).map((r, i) => {
            const z = findZodiac(r.animal);
            const me = zodiac?.id === r.animal;
            return (
              <div key={r.animal} className={`podium podium--${i + 1}${me ? ' podium--me' : ''}`}>
                <span className="podium__medal" aria-hidden>{['🥇', '🥈', '🥉'][i]}</span>
                <span className="podium__emoji" aria-hidden>{z?.emoji}</span>
                <span className="podium__name">{z?.label}{me ? ' (나!)' : ''}</span>
              </div>
            );
          })}
        </div>

        {myRank ? (
          <p className={`rank-card__me${myRank.rank <= 3 ? ' rank-card__me--top' : ''}`}>
            {myRank.rank === 1
              ? '오늘 내 띠가 1위! 자랑각이에요 👑'
              : myRank.rank <= 3
                ? `내 띠는 오늘 ${myRank.rank}위! 기분 좋게 시작해요`
                : myRank.rank >= 11
                  ? `내 띠는 오늘 ${myRank.rank}위… 쪽지로 반전 만들어봐요`
                  : `내 띠는 오늘 ${myRank.rank}위 (${myRank.relationKo})`}
          </p>
        ) : (
          <button
            type="button"
            className="lucky-today__set"
            onClick={() => setPick((v) => (v === 'zodiac' ? null : 'zodiac'))}
          >
            내 띠 고르면 오늘 몇 위인지 바로 나와요 {pick === 'zodiac' ? '▴' : '▾'}
          </button>
        )}
        {!zodiac && pick === 'zodiac' ? (
          <div className="zodiac-grid zodiac-grid--full me-grid">
            {ZODIACS.map((z) => (
              <button key={z.id} type="button" className="zodiac-chip" onClick={() => onZodiac(z.id)}>
                {z.emoji} {z.label}
              </button>
            ))}
          </div>
        ) : null}

        <button type="button" className="rank-card__more" onClick={() => setRankOpen((v) => !v)}>
          {rankOpen ? '접기 ▴' : '4위부터 꼴찌까지 보기 ▾'}
        </button>
        {rankOpen ? (
          <ol className="rank-list">
            {ranking.slice(3).map((r) => {
              const z = findZodiac(r.animal);
              const me = zodiac?.id === r.animal;
              return (
                <li key={r.animal} className={me ? 'rank-row rank-row--me' : 'rank-row'}>
                  <span className="rank-row__no num">{r.rank}</span>
                  <span className="rank-row__name">
                    {z?.emoji} {z?.label}
                    {me ? ' (나)' : ''}
                  </span>
                  <span className={`rank-row__tone rank-row__tone--${r.tone}`}>{r.toneWord}</span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>

      {/* 친구 궁합 — 바이럴 훅 */}
      <button type="button" className="compat-banner" onClick={onCompat}>
        <span className="compat-banner__icon" aria-hidden>💗</span>
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
            {todayReading.result.rarity?.emoji ?? '📖'}
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

      {rarityCounts.legendary + rarityCounts.epic + rarityCounts.rare > 0 ? (
        <div className="collection">
          <span className="collection__title">✨ 이번 달 뽑은 쪽지</span>
          <div className="collection__items">
            {rarityCounts.legendary > 0 ? (
              <span className="collection__item collection__item--leg">👑 전설 {rarityCounts.legendary}</span>
            ) : null}
            {rarityCounts.epic > 0 ? (
              <span className="collection__item collection__item--epic">💜 에픽 {rarityCounts.epic}</span>
            ) : null}
            {rarityCounts.rare > 0 ? (
              <span className="collection__item">✨ 레어 {rarityCounts.rare}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 특정 주제로 보고 싶다면 (보조) */}
      <p className="menu-heading">특정 주제로 볼래요?</p>
      <div className="menu-list">
        {FORTUNE_TYPES.filter((m) => m.key !== 'tomorrow').map((meta) => (
          <FortuneTypeButton key={meta.key} meta={meta} onClick={() => onSelect(meta.key)} />
        ))}
      </div>

      {yesterdayRecord && yNote ? (
        <div className="recap-card">
          <span className="recap-card__icon" aria-hidden>
            {yNote.icon}
          </span>
          <span className="recap-card__body">
            <span className="recap-card__label">어제 뽑은 쪽지</span>
            <span className="recap-card__text">
              {FORTUNE_LABEL[yesterdayRecord.fortuneType]} · {yNote.name}
            </span>
          </span>
        </div>
      ) : null}

      <button
        type="button"
        className="reset-link"
        onClick={() => {
          if (window.confirm('내 띠·별자리·저장한 사람·출석 기록을 모두 지울까요?')) onReset();
        }}
      >
        내 데이터 전체 삭제
      </button>
    </AppLayout>
  );
}
