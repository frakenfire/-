import { computeWeekAhead, buildWeekShareText, type WeekDay } from '../lib/weekAhead.ts';
import { todayKey } from '../lib/dateSeed.ts';
import type { Zodiac } from '../data/zodiac.ts';

type Props = {
  zodiac: Zodiac | null;
  onShare: (text: string) => void;
};

// 이번 주 운세 — 어느 날이 좋고 어느 날을 조심할지.
//
// 광고로 잠가뒀었다. 이번 주에 뭘 조심해야 하는지는 이 앱이 해주기로 한 말의
// 절반인데, 그걸 광고 뒤에 두면 사람들은 그냥 앱을 닫는다. 그냥 연다.
export function WeekCard({ zodiac, onShare }: Props) {
  if (!zodiac) return null;
  const week = computeWeekAhead(todayKey(), zodiac.id);

  return (
    <section className="sec-card">
      <div className="sec__head">
        <h2 className="sec__title">이번 주 내 운세</h2>
        {week ? (
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
        <p className="week-card__headline">{week.headline}</p>
        <ol className="week-list">
          {week.days.map((d: WeekDay) => (
            <li
              key={d.dateKey}
              className={`week-row week-row--${d.tone}${d.isToday ? ' week-row--today' : ''}${
                d.dateKey === week.best.dateKey ? ' week-row--best' : ''
              }`}
            >
              <span className="week-row__dot" aria-hidden />
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
        <ul className="week2">
          <li className="week2__row week2__row--good">
            <span className="week2__k">좋은 날</span>
            <span className="week2__v">
              {week.best.isToday ? '오늘' : `${week.best.weekday}요일 ${week.best.short}`}
            </span>
          </li>
          <li className="week2__row week2__row--care">
            <span className="week2__k">조심할 날</span>
            <span className="week2__v">
              {week.caution
                ? `${week.caution.isToday ? '오늘' : `${week.caution.weekday}요일 ${week.caution.short}`}, 한 박자 천천히`
                : '이번 주엔 특별히 조심할 날이 없어요'}
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
