// 이번 주 운세 캘린더 — 앞으로 7일간 내 띠와 일진의 관계를 미리 본다.
//
// 이 기능이 이 앱에 맞는 이유:
//  - 서버가 필요 없다. 사주 엔진이 날짜만 있으면 미래도 똑같이 계산한다.
//  - 광고 수익을 깎지 않는다. 오히려 "목요일이 제일 좋대" → 그날 다시 오게 만든다.
//  - 스트릭에 줄 보상이 된다. 3일 연속이면 무료로 열리고, 아니면 광고로 연다.
//    (습관 있는 유저는 보상으로, 없는 유저는 수익으로 — 양쪽 다 남는다)
import { sajuToday, type SajuTone } from './saju.ts';
import type { ZodiacId } from '../data/zodiac.ts';

export type WeekDay = {
  dateKey: string;
  /** '월'~'일' */
  weekday: string;
  /** 8월 14일 → '8/14' */
  short: string;
  isToday: boolean;
  iljinKor: string;
  relationKo: string;
  relationGloss: string;
  tone: SajuTone;
  toneWord: string;
};

export type WeekAhead = {
  days: WeekDay[];
  /** 가장 기운이 좋은 날 (동점이면 가까운 날) */
  best: WeekDay;
  /** 조심할 날 — 없으면 null */
  caution: WeekDay | null;
  /** 헤드라인 한 줄 */
  headline: string;
};

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const TONE_RANK: Record<SajuTone, number> = { great: 3, good: 2, steady: 1, caution: 0 };

function addDays(dateKey: string, n: number): string {
  // 정오 기준으로 더해 서머타임/타임존 경계에서 날짜가 밀리는 걸 막는다.
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeWeekAhead(todayKey: string, zodiac: ZodiacId): WeekAhead {
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dateKey = addDays(todayKey, i);
    const d = new Date(`${dateKey}T12:00:00`);
    const saju = sajuToday(dateKey, zodiac);
    days.push({
      dateKey,
      weekday: WEEKDAY[d.getDay()],
      short: `${d.getMonth() + 1}/${d.getDate()}`,
      isToday: i === 0,
      iljinKor: saju.iljin.kor,
      relationKo: saju.relationKo,
      relationGloss: saju.relationGloss,
      tone: saju.tone,
      toneWord: saju.toneWord,
    });
  }

  // 동점이면 더 가까운 날을 고른다 — '이번 주 언제 움직일까'의 답이 되어야 하므로.
  let best = days[0];
  for (const d of days) {
    if (TONE_RANK[d.tone] > TONE_RANK[best.tone]) best = d;
  }
  const cautionDays = days.filter((d) => d.tone === 'caution');
  const caution = cautionDays.length > 0 ? cautionDays[0] : null;

  const bestLabel = best.isToday ? '오늘' : `${best.weekday}요일(${best.short})`;
  const headline =
    TONE_RANK[best.tone] >= 3
      ? `이번 주는 ${bestLabel}이 크게 트여요`
      : TONE_RANK[best.tone] === 2
        ? `이번 주는 ${bestLabel}이 가장 순해요`
        : `이번 주는 큰 굴곡 없이 잔잔해요`;

  return { days, best, caution, headline };
}

/** 주간 캘린더 공유 문구 — 링크는 shareMessage 가 붙인다. */
export function buildWeekShareText(week: WeekAhead, zodiacLabel: string, zodiacEmoji: string): string {
  const mark: Record<SajuTone, string> = { great: '◎', good: '○', steady: '△', caution: '▲' };
  return [
    `🗓️ ${zodiacEmoji}${zodiacLabel} 이번 주 운세`,
    ``,
    ...week.days.map((d) => `${mark[d.tone]} ${d.weekday} ${d.short} · ${d.toneWord}`),
    ``,
    `👑 ${week.headline}`,
    `네 띠는 이번 주 어떤지 봐봐 👇`,
  ].join('\n');
}
