import { AppLayout } from '../components/AppLayout';
import { FortuneTypeButton } from '../components/FortuneTypeButton';
import { Mascot } from '../components/Mascot';
import { FORTUNE_TYPES, FORTUNE_LABEL } from '../data/fortuneTypes';
import { findNote } from '../data/notes';
import { HOME } from '../data/copy';
import { useState } from 'react';
import { dailyLine } from '../lib/dailyLine';
import { todayKey } from '../lib/dateSeed';
import { ZODIACS, zodiacLine } from '../data/zodiac';
import type { Zodiac, ZodiacId } from '../data/zodiac';
import type { StoredResult, TodayReading } from '../lib/storage';
import type { FortuneType } from '../types/fortune';

function todayLabel(): string {
  const d = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week})`;
}

// 시간대별 인사 — 매번 조금 다른 첫인상 (매일 보고 싶게)
function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return '좋은 아침이에요 ☀️';
  if (h >= 11 && h < 17) return '오후도 잘 버티고 있죠? 🍀';
  if (h >= 17 && h < 22) return '오늘도 수고했어요 🌙';
  return '늦은 밤까지 애썼어요 ✨';
}

type Props = {
  streak: number;
  yesterdayRecord: StoredResult | null;
  todayReading: TodayReading | null;
  zodiac: Zodiac | null;
  onZodiac: (id: ZodiacId) => void;
  onReopen: () => void;
  onCompat: () => void;
  onSelect: (t: FortuneType) => void;
};

// PRD §5.1 + 리텐션 — 오늘의 한 줄 · 친구 궁합 · 다시 읽기 · 스트릭 · 어제의 쪽지.
export function HomeScreen({
  streak,
  yesterdayRecord,
  todayReading,
  zodiac,
  onZodiac,
  onReopen,
  onCompat,
  onSelect,
}: Props) {
  const yNote = yesterdayRecord ? findNote(yesterdayRecord.noteId) : null;
  const [zodiacOpen, setZodiacOpen] = useState(false);

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
          <Mascot size={84} score={streak >= 3 ? 90 : 80} />
        </div>
        <p className="home-hero__sub">
          {greeting()}
          <br />
          오늘 뭘 하면 좋고, 뭘 피해야 할지.
          <br />
          쪽지 한 장이면 돼요.
        </p>
      </div>

      {/* 오늘의 한 줄 — 0탭 즉시 보상 + 띠별 한 줄 */}
      <div className="daily-line">
        <span className="daily-line__label">✨ 오늘의 한 줄</span>
        <p className="daily-line__text">“{dailyLine(todayKey())}”</p>
        {zodiac ? (
          <p className="daily-line__zodiac">
            <b>
              {zodiac.emoji} {zodiac.label}의 오늘
            </b>
            <br />
            {zodiacLine(todayKey(), zodiac.id)}
          </p>
        ) : (
          <button
            type="button"
            className="daily-line__zpick"
            onClick={() => setZodiacOpen((v) => !v)}
          >
            🐾 내 띠 고르면 띠별 한 줄도 나와요 {zodiacOpen ? '▴' : '▾'}
          </button>
        )}
        {!zodiac && zodiacOpen ? (
          <div className="zodiac-grid">
            {ZODIACS.map((z) => (
              <button
                key={z.id}
                type="button"
                className="zodiac-chip"
                onClick={() => onZodiac(z.id)}
              >
                {z.emoji} {z.label}
              </button>
            ))}
          </div>
        ) : null}
        <span className="daily-line__hint">더 자세한 건 쪽지가 알려줄 거예요</span>
      </div>

      {/* 친구 궁합 — 로그인 없이 되는 바이럴 훅 */}
      <button type="button" className="compat-banner" onClick={onCompat}>
        <span className="compat-banner__icon" aria-hidden>💗</span>
        <span className="compat-banner__body">
          <span className="compat-banner__title">오늘 우리 궁합, 몇 점일까?</span>
          <span className="compat-banner__desc">친구·연인 띠만 고르면 바로 나와요</span>
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

      <p className="menu-heading">오늘은 뭐가 제일 궁금해요?</p>
      <div className="menu-list">
        {FORTUNE_TYPES.map((meta) => (
          <FortuneTypeButton key={meta.key} meta={meta} onClick={() => onSelect(meta.key)} />
        ))}
      </div>

      {/* 어제의 쪽지 돌아보기 */}
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

    </AppLayout>
  );
}
