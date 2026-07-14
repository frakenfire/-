import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { LetterCard } from '../components/LetterCard';
import { Disclaimer } from '../components/Disclaimer';
import { AdBadge, AdBanner } from '../components/AdNotice';
import { luckPercentile } from '../lib/luck';
import { ELEMENT_EMOJI, ELEMENT_KO } from '../lib/saju';
import { todayVibe } from '../lib/dayVibe';
import { todayKey } from '../lib/dateSeed';
import type { FortuneResult, Note } from '../types/fortune';

type Props = {
  result: FortuneResult;
  note: Note;
  busy: boolean;
  onDetail: () => void;
  onSave: () => void;
  onShare: () => void;
  onRetry: () => void;
  onCompat: () => void;
  onBack: () => void;
};

// 결과 = 기분에 맞춘 하루 설계.
// 공유는 "친구에게 도움 주기"로 첫 번째 액션. 상위 % 배지로 자랑 공유를 유도한다.
export function ResultScreen({
  result,
  note,
  busy,
  onDetail,
  onSave,
  onShare,
  onRetry,
  onCompat,
  onBack,
}: Props) {
  const { luck, rarity, dayPlan } = result;
  const [letterOpen, setLetterOpen] = useState(false);
  const brag = luckPercentile(luck.total);
  const vibe = todayVibe(todayKey()); // 홈과 같은 '오늘의 기운' — 홈→결과 연결

  // 총운 카운트업 리빌 — 0→N 으로 차오르며 점수가 '뽑힌' 느낌을 준다.
  // prefers-reduced-motion 이면 즉시 최종값.
  const [shownTotal, setShownTotal] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShownTotal(luck.total);
      return;
    }
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

  // 풀이 라벨 — month 타입은 초반/중순/월말, 나머지는 오전/오후/저녁.
  const isMonth = result.reading.scale === 'month';
  const rl = isMonth
    ? { title: '이번 달 풀이', desc: '초반부터 월말까지 이번 달을 그려봤어요', m: '🌱 이번 달 초반', a: '📈 중순', e: '🏁 월말' }
    : { title: '오늘의 풀이', desc: '시간대별로 하루를 미리 그려봤어요', m: '🌅 오전', a: '☀️ 오후', e: '🌙 저녁' };

  return (
    <AppLayout onBack={onBack} title={isMonth ? '이번 달 쪽지' : '오늘의 쪽지'}>
      {/* 브리핑 카드 */}
      <div
        className={`briefing briefing--${rarity.tier} fade-in`}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {luck.total >= 88 || rarity.special ? (
          <div className="confetti" aria-hidden>
            {['🎉', '✨', '⭐', '💙', '✨', '🎊', '⭐', '✨'].map((e, i) => (
              <span
                key={i}
                className="confetti__bit"
                style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 0.12}s` }}
              >
                {e}
              </span>
            ))}
          </div>
        ) : null}

        <div className="briefing__chips">
          <span className="chip chip--type">
            {note.icon} {result.title}
          </span>
          <span className="chip chip--score">
            총운 <b className="num">{shownTotal}점</b> · {luck.grade}
          </span>
          <span className={`rarity-badge rarity-badge--${rarity.tier}`}>
            {rarity.emoji} {rarity.label}
          </span>
          {/* 기운 칩 — 띠가 있으면 아래 일진 스트립이 사주 기운을 보여주므로,
              날짜 기운(dayVibe)은 띠 미설정 사용자에게만 (기운 표기 이원화 방지) */}
          {!isMonth && !result.saju && (
            <span className="chip chip--vibe">{vibe.emoji} 오늘의 기운 · {vibe.word}</span>
          )}
        </div>

        <div className="brag" aria-label={`오늘 상위 ${brag.pct}퍼센트`}>
          <span className="brag__pct">🏆 오늘 총운 상위 {brag.pct}%</span>
          <span className="brag__label">· {brag.label}</span>
        </div>

        {result.persona ? <p className="briefing__persona">💌 {result.persona}</p> : null}
        <p className="briefing__headline">{dayPlan.headline}</p>
        <p className="briefing__vibe">{dayPlan.vibe}</p>

        {/* 기분에 맞춘 하루 설계 — 결과의 주인공 */}
        <div className="plan">
          <p className="plan__title">{isMonth ? '이번 달, 이렇게 보내요' : '오늘, 이렇게 보내요'}</p>
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

        {/* 행운 보고서 — day: 타이밍·색·음식 / month: 행운의 주·이달의 색·키워드 */}
        <div className="report">
          <p className="report__head">🍀 {isMonth ? '이번 달 행운 보고서' : '오늘의 행운 보고서'}</p>
          <div className="report__grid">
            <div className="report__cell">
              <span className="report__k">{isMonth ? '행운의 주' : '타이밍'}</span>
              <span className="report__v">{isMonth ? `${luck.luckyWeek ?? 1}주차` : luck.time}</span>
            </div>
            <div className="report__cell">
              <span className="report__k">{isMonth ? '이달의 색' : '행운 색'}</span>
              <span className="report__v">
                <i className="report__dot" style={{ background: luck.color.hex }} aria-hidden />
                {luck.color.name}
              </span>
            </div>
            <div className="report__cell">
              <span className="report__k">{isMonth ? '이달의 키워드' : '행운 음식'}</span>
              <span className="report__v">
                {isMonth ? luck.tag : `${luck.food.emoji} ${luck.food.name}`}
              </span>
            </div>
          </div>
          <p className="report__why">
            {isMonth
              ? `이번 달은 '${luck.tag}'을 키워드로 삼으면 술술 풀려요.`
              : luck.food.why}
          </p>
        </div>
      </div>

      {/* 오늘의 사주 — 일진 도장(스탬프) 스트립. 행운 보고서 그리드와 다른 시각 언어로,
          일진×내 띠 관계·기운·개운 컬러(행운 색의 근거)를 한 줄 흐름으로 보여준다 */}
      {result.saju ? (
        <div className="iljin fade-in">
          <div className="iljin__row">
            <span className="iljin__seal" aria-hidden>{result.saju.iljin.hanja}</span>
            <div className="iljin__flow">
              <span className="iljin__date">오늘의 일진 · {result.saju.iljin.kor}일</span>
              <span className="iljin__rel">
                내 띠와 <b>{result.saju.relationKo}</b> · {ELEMENT_EMOJI[result.saju.myElement]}
                {ELEMENT_KO[result.saju.myElement]} 기운
              </span>
            </div>
            <span className={`iljin__tone iljin__tone--${result.saju.tone}`}>
              {result.saju.toneWord}
            </span>
          </div>
          <p className="iljin__line">{result.saju.headline}</p>
          <div className="iljin__boost">
            <span className="iljin__boost-color">
              <i className="report__dot" style={{ background: result.saju.luckyColor.hex }} aria-hidden />
              개운 컬러 <b>{result.saju.luckyColor.name}</b>
              <small>({ELEMENT_KO[result.saju.boostElement]} 보충)</small>
            </span>
            <span className="iljin__boost-tip">💡 {result.saju.tip}</span>
          </div>
        </div>
      ) : null}

      {/* 하루 풀이 — 매일 볼 만한 해석 */}
      <div className="card fade-in">
        <div className="card-head">
          <p className="card-head__title">{rl.title}</p>
          <p className="card-head__desc">{rl.desc}</p>
        </div>
        <div className="section">
          <p className="section__label">🔎 전체 풀이</p>
          <p className="section__lead">{result.pinpoint}</p>
          <p className="section__text">{result.reading.overall}</p>
        </div>
        <div className="section">
          <p className="section__label">{rl.m}</p>
          <p className="section__text">{result.reading.morning}</p>
        </div>
        <div className="section">
          <p className="section__label">{rl.a}</p>
          <p className="section__text">{result.reading.afternoon}</p>
        </div>
        <div className="section">
          <p className="section__label">{rl.e}</p>
          <p className="section__text">{result.reading.evening}</p>
        </div>
        <div className="section">
          <p className="section__label">🤝 사람과의 사이</p>
          <p className="section__text">{result.reading.people}</p>
        </div>
        <div className="section">
          <p className="section__label">🫧 마음 관리</p>
          <p className="section__text">{result.reading.mind}</p>
        </div>
      </div>

      <div className="btn-stack">
        {/* 공유 = 친구에게 오늘의 처방 보내주기 (광고 없음, 첫 번째 액션) */}
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onShare}>
          이 쪽지, 친구한테 보내주기 💌
        </button>

        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setLetterOpen((v) => !v)}
        >
          {letterOpen ? '요정의 편지 접기' : '요정이 쓴 편지도 읽기 💌'}
        </button>
      </div>

      {letterOpen ? (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <LetterCard letter={result.letter} score={luck.total} rarity={rarity} />
        </div>
      ) : null}

      <div className="btn-stack" style={{ marginTop: 'var(--space-3)' }}>
        <button type="button" className="btn btn--unlock" disabled={busy} onClick={onDetail}>
          <span className="btn-unlock__top">
            <span className="btn-unlock__main">🔓 오늘의 심층 리포트 열기</span>
            <AdBadge label="광고" />
          </span>
          <span className="btn-unlock__sub">운세 원픽 · 잘 맞는 띠 · 행운 미션 · 부적</span>
        </button>

        <button type="button" className="btn btn--secondary" disabled={busy} onClick={onSave}>
          결과 카드 저장하기 📸 스토리에 올리기
        </button>

        <button type="button" className="btn btn--ghost" disabled={busy} onClick={onRetry}>
          다른 쪽지도 뽑아볼래요 <AdBadge label="광고" />
        </button>
      </div>

      <button
        type="button"
        className="compat-banner"
        style={{ marginTop: 'var(--space-4)' }}
        onClick={onCompat}
      >
        <span className="compat-banner__icon" aria-hidden>💗</span>
        <span className="compat-banner__body">
          <span className="compat-banner__title">이 사람이랑 오늘 궁합은?</span>
          <span className="compat-banner__desc">띠 또는 별자리만 고르면 바로 나와요</span>
        </span>
        <span className="compat-banner__cta">보러가기 ›</span>
      </button>

      <AdBanner />
      <Disclaimer />
    </AppLayout>
  );
}
