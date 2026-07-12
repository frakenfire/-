import { AppLayout } from '../components/AppLayout';
import { FortuneTypeButton } from '../components/FortuneTypeButton';
import { Mascot } from '../components/Mascot';
import { FORTUNE_TYPES, FORTUNE_LABEL } from '../data/fortuneTypes';
import { findNote } from '../data/notes';
import { HOME } from '../data/copy';
import { useState } from 'react';
import { todayVibe } from '../lib/dayVibe';
import { todayKey } from '../lib/dateSeed';
import { luckyZodiacsToday } from '../lib/luckyToday';
import { ZODIACS, type Zodiac, type ZodiacId } from '../data/zodiac';
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
  const vibe = todayVibe(todayKey());
  const lucky = luckyZodiacsToday(todayKey());
  const myLucky = !!(zodiac && lucky.some((z) => z.id === zodiac.id));

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
          점신식 즉시성(오늘 기운 바로 노출) + 포스텔러식 개인화 공감 한 줄 +
          잠긴 결과(?점·?)로 궁금증/FOMO 유발 → 뽑아야 전부 열림 */}
      <button type="button" className="today-hook" onClick={() => onSelect('tomorrow')}>
        <span className="today-hook__kw">✨ 오늘의 기운 · {vibe.emoji} {vibe.word}</span>
        <p className="today-hook__persona">
          {zodiac
            ? `${ZODIAC_TRAIT[zodiac.id]} ${zodiac.emoji}${zodiac.label}인 당신,`
            : '오늘 나에게 온 쪽지엔,'}
        </p>
        <p className="today-hook__line">{vibe.line}</p>

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
          쪽지 뽑고 오늘 전부 확인하기
          <i className="today-hook__cta-arrow" aria-hidden>›</i>
        </span>
      </button>

      {/* 오늘 운 좋은 띠 — 궁금증 훅(내 띠 있나?) + 여기서 바로 내 띠 설정 */}
      <div className="lucky-today">
        <p className="lucky-today__title">🍀 오늘 운이 트인 띠</p>
        <div className="lucky-today__chips">
          {lucky.map((z) => (
            <span key={z.id} className={zodiac?.id === z.id ? 'lt-chip lt-chip--me' : 'lt-chip'}>
              {z.emoji} {z.label}
              {zodiac?.id === z.id ? ' (나!)' : ''}
            </span>
          ))}
        </div>
        {zodiac ? (
          <p className="lucky-today__cta">
            {myLucky ? '내 띠가 있네요! 오늘 뭐가 좋은지 쪽지로 확인해봐요' : '내 띠는 오늘 어떨까? 쪽지 한 장 뽑아봐요'}
          </p>
        ) : (
          <button
            type="button"
            className="lucky-today__set"
            onClick={() => setPick((v) => (v === 'zodiac' ? null : 'zodiac'))}
          >
            내 띠 고르면 오늘 운 좋은지 바로 알려줘요 {pick === 'zodiac' ? '▴' : '▾'}
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
