import { Icon } from './Icon.tsx';
import { computeWeekAhead, buildWeekShareText, type WeekDay } from '../lib/weekAhead.ts';
import { todayKey } from '../lib/dateSeed.ts';
import type { Zodiac } from '../data/zodiac.ts';

type Props = {
  zodiac: Zodiac | null;
  streak: number;
  unlocked: boolean;
  onUnlock: () => void;
  onShare: (text: string) => void;
};

// 이번 주 운세 캘린더 — 좋은 날을 미리 알려 그날 다시 오게 만드는 자리.
// 잠금은 스트릭(무료) 또는 광고로 열린다.
//
// 홈에 있을 땐 아무것도 안 넣은 사람에게도 보여서 '내 것' 이 아니었다.
// 생년월일을 넣고 결과를 받은 자리로 옮겼다.
export function WeekCard({ zodiac, streak, unlocked, onUnlock, onShare }: Props) {
  if (!zodiac) return null;
  const week = computeWeekAhead(todayKey(), zodiac.id);

  return (
    <section className="sec">
      <div className="sec__head">
        <h2 className="sec__title">이번 주 내 운세</h2>
        {unlocked && week ? (
          <button
            type="button"
            className="sec__action"
            onClick={() => onShare(buildWeekShareText(week, zodiac.label, zodiac.emoji))}
          >
            공유
          </button>
        ) : null}
      </div>
      <div className="week-card">
        {unlocked && week ? (
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
                {week.caution.isToday ? '오늘' : `${week.caution.weekday}요일`}은 한 박자 천천히 가면 좋아요
              </p>
            ) : null}
          </>
        ) : (
          <button type="button" className="week-lock" onClick={onUnlock}>
            <span className="week-lock__icon" aria-hidden>
              <Icon name="calendar" size={20} />
            </span>
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
  );
}
