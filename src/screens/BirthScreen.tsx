import { useMemo, useState } from 'react';
import { AppLayout } from '../components/AppLayout.tsx';
import { computeFourPillars, boundaryNotice, type BirthInput } from '../lib/fourPillars.ts';
import { DAY_MASTER_BY_INDEX } from '../data/dayMaster.ts';
import type { StoredBirth } from '../lib/storage.ts';

type Props = {
  initial: StoredBirth | null;
  onSave: (b: StoredBirth) => void;
  onBack: () => void;
};

/** 'YYYY-MM-DD' + 'HH:MM' → 엔진 입력. 형식이 깨지면 null. */
export function toBirthInput(date: string, time: string | null): BirthInput | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // 달력에 없는 날(2월 30일 등)은 받지 않는다 — 조용히 다른 날로 넘어가면 남의 사주가 된다.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;

  if (time === null) return { year, month, day, hour: null };
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!t) return null;
  const hour = Number(t[1]);
  const minute = Number(t[2]);
  if (hour > 23 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

const TODAY = new Date();
const MAX_DATE = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;

// 생년월일시를 받아 사주를 세운다. 입력이 무거우면 아무도 안 하므로
// 네이티브 날짜·시간 피커 두 개로 끝낸다(탭 두 번). 시각은 몰라도 넘어갈 수 있다.
export function BirthScreen({ initial, onSave, onBack }: Props) {
  const [date, setDate] = useState(initial?.date ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [unknownTime, setUnknownTime] = useState(initial ? initial.time === null : false);

  const input = useMemo(
    () => (date ? toBirthInput(date, unknownTime ? null : time || null) : null),
    [date, time, unknownTime],
  );
  // 입력하는 동안 결과를 미리 보여준다 — 다 채우기 전에 "오, 이게 나오는구나"가 와야 한다.
  const preview = useMemo(() => (input ? computeFourPillars(input) : null), [input]);
  const notice = useMemo(() => (input ? boundaryNotice(input) : null), [input]);
  const dm = preview ? DAY_MASTER_BY_INDEX[preview.dayStem] : null;

  const ready = date !== '' && (unknownTime || time !== '');

  return (
    <AppLayout onBack={onBack}>
      <span className="eyebrow">내 사주 만들기</span>
      <h2 className="h2">언제 태어났어요?</h2>
      <p className="lead">
        사주는 태어난 <b>순간</b>으로 세워요. 이 기기에만 저장되고 어디에도 보내지 않아요.
      </p>

      <div className="birth-form">
        <label className="birth-field">
          <span className="birth-field__k">생년월일 (양력)</span>
          <input
            className="birth-field__input"
            type="date"
            value={date}
            max={MAX_DATE}
            min="1900-01-01"
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className={unknownTime ? 'birth-field birth-field--off' : 'birth-field'}>
          <span className="birth-field__k">태어난 시각</span>
          <input
            className="birth-field__input"
            type="time"
            value={time}
            disabled={unknownTime}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>

        <button
          type="button"
          className={unknownTime ? 'birth-unknown birth-unknown--on' : 'birth-unknown'}
          onClick={() => setUnknownTime((v) => !v)}
          aria-pressed={unknownTime}
        >
          <span className="birth-unknown__box" aria-hidden>
            {unknownTime ? '✓' : ''}
          </span>
          태어난 시각을 몰라요
        </button>
        <p className="birth-hint">
          {unknownTime
            ? '시각 없이 세 기둥으로 봐요. 성격·기운은 그대로 나오고, 시주가 담당하는 부분만 빠져요.'
            : '30분만 달라도 결과가 바뀌어요. 대략이라도 알면 훨씬 정확해져요.'}
        </p>
      </div>

      {/* 다 채우기 전에 결과 맛보기 — 입력의 대가를 먼저 보여준다 */}
      {preview && dm ? (
        <div className="birth-peek" style={{ ['--peek-hue' as string]: dm.hue }}>
          <span className="birth-peek__label">당신의 일간</span>
          <span className="birth-peek__icon" aria-hidden>
            {dm.icon}
          </span>
          <strong className="birth-peek__name">
            {dm.hanja} {dm.name}
          </strong>
          <span className="birth-peek__tag">{dm.tagline}</span>
          <span className="birth-peek__pillars">{preview.year.hanja} {preview.month.hanja} {preview.day.hanja}{preview.hour ? ` ${preview.hour.hanja}` : ''}</span>
        </div>
      ) : null}

      {notice ? <p className="birth-warn">⚠️ {notice}</p> : null}

      {preview?.zodiacDiffersFromCalendarYear ? (
        <p className="birth-warn birth-warn--info">
          입춘 전에 태어나서 사주로는 <b>앞 해의 띠</b>예요. 달력 띠와 다르게 나오는 게 맞아요.
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn--primary"
        disabled={!ready || !input}
        onClick={() => input && onSave({ date, time: unknownTime ? null : time })}
      >
        {ready ? '내 사주 보기' : '생년월일을 입력해 주세요'}
      </button>
    </AppLayout>
  );
}
