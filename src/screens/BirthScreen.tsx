import { useMemo, useState } from 'react';
import { AppLayout } from '../components/AppLayout.tsx';
import { WheelPicker, type WheelItem } from '../components/WheelPicker.tsx';
import { computeFourPillars, boundaryNotice } from '../lib/fourPillars.ts';
import { parseBirth } from '../lib/birth.ts';
import { DAY_MASTER_BY_INDEX } from '../data/dayMaster.ts';
import type { StoredBirth } from '../lib/storage.ts';

type Props = {
  initial: StoredBirth | null;
  onSave: (b: StoredBirth) => void;
  onBack: () => void;
  /** 뽑기 흐름 중이면 건너뛰기를 제공하고 단계 표시를 붙인다 */
  inFlow?: boolean;
  onSkip?: () => void;
};

const NOW = new Date();
const THIS_YEAR = NOW.getFullYear();

function range(from: number, to: number, fmt: (n: number) => string): WheelItem[] {
  const out: WheelItem[] = [];
  for (let n = from; n <= to; n += 1) out.push({ value: n, label: fmt(n) });
  return out;
}
function daysIn(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
const pad = (n: number) => String(n).padStart(2, '0');

// 생년월일시를 받는다.
//
// 네이티브 date/time 입력을 쓰다가 두 가지에 데였다.
//  - 기기 로케일을 따라가 한국 사용자에게 '03/15/1994' 로 보인다.
//  - 피커에서 고른 값이 앱으로 안 넘어와, 화면엔 값이 있는데 버튼만 죽었다.
// 그래서 굴려서 고르는 피커를 직접 쓴다. 굴려도 되고 눌러도 된다.
export function BirthScreen({ initial, onSave, onBack, inFlow = false, onSkip }: Props) {
  const init = initial ? parseBirth(initial.date, initial.time) : null;

  const [year, setYear] = useState(init?.year ?? 1995);
  const [month, setMonth] = useState(init?.month ?? 1);
  const [day, setDay] = useState(init?.day ?? 1);
  const [unknownTime, setUnknownTime] = useState(initial ? initial.time === null : false);
  const [hour24, setHour24] = useState(init?.hour ?? 12);
  const [minute, setMinute] = useState(init?.minute ?? 0);

  // 월이 바뀌면 일수가 줄 수 있다 (1/31 → 2월). 없는 날짜가 남지 않게 잘라준다.
  const maxDay = daysIn(year, month);
  const safeDay = Math.min(day, maxDay);

  const YEARS = useMemo(() => range(1930, THIS_YEAR, (n) => `${n}`), []);
  const MONTHS = useMemo(() => range(1, 12, (n) => `${n}월`), []);
  const DAYS = useMemo(() => range(1, maxDay, (n) => `${n}일`), [maxDay]);
  // 오전/오후는 값 0·1, 시는 1~12, 분은 5분 단위 — 태어난 시각을 분 단위로 기억하는 사람은 드물다.
  const AMPM: WheelItem[] = [
    { value: 0, label: '오전' },
    { value: 1, label: '오후' },
  ];
  const HOURS12 = useMemo(() => range(1, 12, (n) => `${n}시`), []);
  const MINUTES = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: `${pad(i * 5)}분` })),
    [],
  );

  const isPm = hour24 >= 12 ? 1 : 0;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  function setFrom12(pm: number, h12: number) {
    const h = (h12 % 12) + pm * 12;
    setHour24(h);
  }

  const dateStr = `${year}-${pad(month)}-${pad(safeDay)}`;
  const timeStr = unknownTime ? null : `${pad(hour24)}:${pad(minute)}`;
  const input = useMemo(() => parseBirth(dateStr, timeStr), [dateStr, timeStr]);

  const preview = useMemo(() => (input ? computeFourPillars(input) : null), [input]);
  const notice = useMemo(() => (input ? boundaryNotice(input) : null), [input]);
  const dm = preview ? DAY_MASTER_BY_INDEX[preview.dayStem] : null;

  return (
    <AppLayout onBack={onBack} step={inFlow ? 1 : undefined} totalSteps={inFlow ? 4 : undefined}>
      <span className="eyebrow">{inFlow ? '쪽지 뽑기' : '쪽지를 나에게 맞추기'}</span>
      <h2 className="h2">언제 태어났어요?</h2>
      <p className="lead">
        태어난 <b>순간</b>으로 사주를 세우면, 오늘 쪽지가 나만의 것이 돼요. 이 기기에만 저장되고
        어디에도 보내지 않아요.
      </p>

      <div className="birth-form">
        <div className="wheel-group">
          <span className="wheel-group__k">생년월일 (양력)</span>
          <span className="wheel-group__v">
            {year}년 {month}월 {safeDay}일
          </span>
          <div className="wheel-row">
            <WheelPicker items={YEARS} value={year} onChange={setYear} label="태어난 해" />
            <WheelPicker items={MONTHS} value={month} onChange={setMonth} label="태어난 달" />
            <WheelPicker items={DAYS} value={safeDay} onChange={setDay} label="태어난 날" />
          </div>
        </div>

        <div className="wheel-group">
          <span className="wheel-group__k">태어난 시각</span>
          <span className="wheel-group__v">
            {unknownTime ? '모름' : `${isPm ? '오후' : '오전'} ${hour12}시 ${pad(minute)}분`}
          </span>
          <div className="wheel-row">
            <WheelPicker
              items={AMPM}
              value={isPm}
              onChange={(v) => setFrom12(v, hour12)}
              label="오전 오후"
              disabled={unknownTime}
            />
            <WheelPicker
              items={HOURS12}
              value={hour12}
              onChange={(v) => setFrom12(isPm, v)}
              label="시"
              disabled={unknownTime}
            />
            <WheelPicker
              items={MINUTES}
              value={minute}
              onChange={setMinute}
              label="분"
              disabled={unknownTime}
            />
          </div>
        </div>

        <button
          type="button"
          className={unknownTime ? 'birth-unknown birth-unknown--on' : 'birth-unknown'}
          onClick={() => setUnknownTime((v) => !v)}
          aria-pressed={unknownTime}
        >
          <span className="birth-unknown__box" aria-hidden />
          태어난 시각을 몰라요
        </button>
        <p className="birth-hint">
          {unknownTime
            ? '시각 없이 세 기둥으로 봐요. 성격·기운은 그대로 나오고, 시주가 담당하는 부분만 빠져요.'
            : '30분만 달라도 결과가 바뀌어요. 대략이라도 알면 훨씬 정확해져요.'}
        </p>
      </div>

      {/* 굴리는 동안 결과가 같이 바뀐다 — 입력의 대가를 먼저 보여준다 */}
      {preview && dm ? (
        <div className="birth-peek">
          <span className="birth-peek__label">당신의 일간</span>
          <span className="birth-peek__icon" aria-hidden>
            {dm.icon}
          </span>
          <strong className="birth-peek__name">{dm.name}</strong>
          <span className="birth-peek__tag">{dm.tagline}</span>
          <span className="birth-peek__pillars">
            {preview.year.kor} {preview.month.kor} {preview.day.kor}
            {preview.hour ? ` ${preview.hour.kor}` : ''}
          </span>
        </div>
      ) : null}

      {notice ? <p className="birth-warn">{notice}</p> : null}

      {preview?.zodiacDiffersFromCalendarYear ? (
        <p className="birth-warn birth-warn--info">
          입춘 전에 태어나서 사주로는 <b>앞 해의 띠</b>예요. 달력 띠와 다르게 나오는 게 맞아요.
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => input && onSave({ date: dateStr, time: timeStr })}
      >
        {inFlow ? '이 사주로 쪽지 뽑기' : '내 사주 보기'}
      </button>
      {inFlow && onSkip ? (
        <button type="button" className="btn btn--ghost" onClick={onSkip}>
          지금은 건너뛸게요 (쪽지가 덜 정확해져요)
        </button>
      ) : null}
    </AppLayout>
  );
}
