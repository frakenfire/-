import { AppLayout } from '../components/AppLayout';
import { FortuneTypeButton } from '../components/FortuneTypeButton';
import { Mascot } from '../components/Mascot';
import { FORTUNE_TYPES, FORTUNE_LABEL } from '../data/fortuneTypes';
import { findNote } from '../data/notes';
import { GREETINGS } from '../data/copy';
import { useState } from 'react';
import { todayVibe } from '../lib/dayVibe';
import { todayKey, hashSeed } from '../lib/dateSeed';
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
  // 오늘 이미 뽑았으면 그 결과를 히어로 카드에도 반영한다(잠긴 ? → 실제 값).
  const drawn = todayReading?.result ?? null;
  const [pick, setPick] = useState<'zodiac' | 'star' | null>(null);
  const [rankOpen, setRankOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
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
      {/* 첫 블록 — 상단 네비에 앱 이름이 이미 있어서, 큰 제목 자리는 앱 이름을
          반복하지 않고 '나에게 건네는 인사'가 차지한다. (예전엔 같은 글자가 두 번) */}
      <div className="home-hero">
        <div className="pill-row">
          <span className="date-pill">{todayLabel()}</span>
          {streak >= 7 ? (
            <span className="streak-pill streak-pill--crown">👑 {streak}일째!</span>
          ) : streak >= 2 ? (
            <span className="streak-pill">🔥 {streak}일째 쪽지</span>
          ) : (
            // 오늘 이미 뽑았는데 '오늘의 첫 쪽지'가 그대로 붙어 있으면
            // 아직 안 뽑은 것처럼 읽힌다. 뽑은 뒤엔 위의 🔥 N일째와 같은 말투로.
            <span className="streak-pill streak-pill--new">
              {todayReading ? '🌱 1일째 쪽지' : '🌱 오늘의 첫 쪽지'}
            </span>
          )}
        </div>
        <div className="home-hero__top">
          <h1 className="h1">{greeting(todayKey())}</h1>
          <Mascot size={72} score={streak >= 3 ? 90 : 80} />
        </div>
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

        {/* 아직 안 뽑았으면 잠긴 ?로 궁금증을, 이미 뽑았으면 오늘 나온 값을 그대로 보여준다.
            (이미 88점을 본 사람에게 '?점'을 다시 내미는 건 뒷걸음질이다) */}
        <p className="today-hook__preview-k">
          {drawn ? '오늘 쪽지에서 나온 거예요' : '쪽지를 뽑으면 이런 걸 볼 수 있어요'}
        </p>
        <div className="today-hook__reveal" aria-hidden>
          <div className="th-cell">
            <span className="th-cell__k">오늘 총운</span>
            <span className="th-cell__v">{drawn ? drawn.luck.total : '?'}<i>점</i></span>
          </div>
          <div className="th-cell">
            <span className="th-cell__k">행운의 색</span>
            <span className={`th-cell__v${drawn ? '' : ' th-cell__v--q'}`}>
              {drawn ? drawn.luck.color.name : '?'}
            </span>
          </div>
          <div className="th-cell">
            <span className="th-cell__k">행운 음식</span>
            <span className={`th-cell__v${drawn ? '' : ' th-cell__v--q'}`}>
              {drawn ? drawn.luck.food.name : '?'}
            </span>
          </div>
        </div>

        <span className="today-hook__cta">
          {drawn ? '다른 기분으로 하나 더 뽑기' : '쪽지 뽑기 시작하기'}
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
