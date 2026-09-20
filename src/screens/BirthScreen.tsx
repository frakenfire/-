import { useMemo, useRef, useState } from 'react';
import { AppLayout } from '../components/AppLayout.tsx';
import { WheelPicker, type WheelItem } from '../components/WheelPicker.tsx';
import { boundaryNotice } from '../lib/fourPillars.ts';
import { parseBirth } from '../lib/birth.ts';
import { solarToLunar, lunarToSolar, leapMonthOf, lunarMonthLength } from '../lib/lunar.ts';
import { BIRTH_PLACES, DEFAULT_PLACE_ID, findPlace } from '../data/birthPlace.ts';
import type { StoredBirth } from '../lib/storage.ts';

type Props = {
  initial: StoredBirth | null;
  onSave: (b: StoredBirth) => void;
  /** 이미 넣어둔 정보를 지운다. 안 주면 지우기 줄이 안 보인다 */
  onClear?: () => void;
  onBack: () => void;
  /** 뽑기 흐름 중이면 건너뛰기를 제공하고 단계 표시를 붙인다 */
  inFlow?: boolean;
  /** 아래 버튼 문구. 흐름마다 다음에 볼 게 다르다 */
  ctaLabel?: string;
  spin?: number;
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
export function BirthScreen({ initial, onSave, onClear, onBack, inFlow = false, ctaLabel }: Props) {
  const init = initial ? parseBirth(initial.date, initial.time) : null;
  // 음력으로 넣었던 사람에게는 음력 그대로 다시 보여준다.
  // 저장된 값은 언제나 양력이라, 보여줄 때 되돌린다.
  const initLunar =
    initial?.calendar === 'lunar' && init ? solarToLunar(init.year, init.month, init.day) : null;

  const [cal, setCal] = useState<'solar' | 'lunar'>(initLunar ? 'lunar' : 'solar');
  const [leap, setLeap] = useState(initLunar?.leap ?? false);
  const [year, setYear] = useState(initLunar?.year ?? init?.year ?? 1995);
  const [month, setMonth] = useState(initLunar?.month ?? init?.month ?? 1);
  const [day, setDay] = useState(initLunar?.day ?? init?.day ?? 1);
  const [unknownTime, setUnknownTime] = useState(initial ? initial.time === null : false);
  const [hour24, setHour24] = useState(init?.hour ?? 12);
  const [minute, setMinute] = useState(init?.minute ?? 0);
  const [name, setName] = useState(initial?.name ?? '');
  const [gender, setGender] = useState<'male' | 'female' | null>(initial?.gender ?? null);
  const [placeId, setPlaceId] = useState(initial?.place ?? DEFAULT_PLACE_ID);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [nameWarn, setNameWarn] = useState(false);
  const [genderWarn, setGenderWarn] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);

  // 안 채운 칸을 알려주는 방식.
  //
  // 예전에는 칸 밑 안내 문구만 조용히 바꿨다. 같은 회색, 같은 크기라
  // 바뀐 걸 알아채지 못했고, 생년월일 휠까지 내려간 상태면 이름 칸은
  // 화면 밖이라 아무 일도 안 일어난 것처럼 보였다. 버튼만 먹통인 줄 안다.
  //
  // 그래서 세 가지를 같이 한다. 칸을 화면 안으로 끌어오고, 커서를 넣고,
  // 눈에 띄는 색으로 무엇이 빠졌는지 적는다.
  function nudge(el: HTMLElement | null, focusEl?: HTMLElement | null) {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      el.scrollIntoView();
    }
    // 스크롤이 먼저 눈에 들어와야 어디로 가는지 보인다. 포커스는 한 박자 뒤에.
    window.setTimeout(() => {
      try {
        focusEl?.focus({ preventScroll: true });
      } catch {
        focusEl?.focus();
      }
    }, 260);
  }

  // 월이 바뀌면 일수가 줄 수 있다 (1/31 → 2월). 없는 날짜가 남지 않게 잘라준다.
  // 윤달은 그 해 그 달에만 있다. 윤2월이 없는 해에 윤달을 켜둔 채로 두면
  // 없는 날짜가 되므로, 고를 수 있을 때만 켜진 것으로 친다.
  const leapAvail = cal === 'lunar' && leapMonthOf(year) === month;
  const leapOn = leapAvail && leap;

  const maxDay =
    cal === 'lunar' ? (lunarMonthLength(year, month, leapOn) ?? 29) : daysIn(year, month);
  const safeDay = Math.min(day, maxDay);

  // 계산은 양력 하나로만 돈다. 음력은 넣는 방식일 뿐 명식의 기준이 아니다.
  const solar =
    cal === 'lunar' ? lunarToSolar(year, month, safeDay, leapOn) : { year, month, day: safeDay };

  // 음력 해는 양력보다 한 해 앞에서 시작한다 (1930년 1월 1일은 음력 1929년이다).
  const YEARS = useMemo(
    () => range(cal === 'lunar' ? 1929 : 1930, THIS_YEAR, (n) => `${n}`),
    [cal],
  );
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

  const dateStr = solar
    ? `${solar.year}-${pad(solar.month)}-${pad(solar.day)}`
    : `${year}-${pad(month)}-${pad(safeDay)}`;

  // 달력을 바꿔도 가리키는 날은 같아야 한다. 같은 날을 다른 말로 다시 적어준다.
  function switchCal(next: 'solar' | 'lunar') {
    if (next === cal) return;
    if (next === 'lunar') {
      const l = solarToLunar(year, month, safeDay);
      setYear(l.year);
      setMonth(l.month);
      setDay(l.day);
      setLeap(l.leap);
    } else if (solar) {
      setYear(solar.year);
      setMonth(solar.month);
      setDay(solar.day);
      setLeap(false);
    }
    setCal(next);
  }
  const timeStr = unknownTime ? null : `${pad(hour24)}:${pad(minute)}`;
  const place = findPlace(placeId);
  const input = useMemo(
    () => parseBirth(dateStr, timeStr, place.longitude),
    [dateStr, timeStr, place.longitude],
  );

  const notice = useMemo(() => (input ? boundaryNotice(input) : null), [input]);

  return (
    <AppLayout
      onBack={onBack}
      step={inFlow ? 1 : undefined}
      totalSteps={inFlow ? 4 : undefined}
      bottom={
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            if (!input) return;
            // 이름도 계산에 들어간다. 빈 채로 넘기면 이름 칸이 통째로 빠지므로 막는다.
            // 버튼을 잠그지는 않는다 — 안 눌리면 '왜 안 되지' 로 멈춘다. 눌러서 알려준다.
            if (name.trim().length < 2) {
              setNameWarn(true);
              nudge(nameRef.current, nameRef.current);
              return;
            }
            if (!gender) {
              setGenderWarn(true);
              nudge(genderRef.current);
              return;
            }
            onSave({
              date: dateStr,
              time: timeStr,
              name: name.trim(),
              gender,
              calendar: cal,
              place: placeId,
              ...(leapOn ? { leap: true } : {}),
            });
          }}
        >
          {ctaLabel ?? (inFlow ? '쪽지 열어보기' : '내 사주 보기')}
        </button>
      }
    >
      <h2 className="h2">언제 태어났어요?</h2>
      <p className="lead">이 기기에만 저장돼요. 어디에도 보내지 않아요.</p>

      <div className="birth-form">
        <label className={nameWarn ? 'field field--warn' : 'field'}>
        <span className="field__k">이름</span>
        <input
          ref={nameRef}
          className="field__input"
          type="text"
          inputMode="text"
          maxLength={10}
          placeholder="한글 이름"
          value={name}
          aria-invalid={nameWarn || undefined}
          aria-describedby="birth-name-hint"
          onChange={(e) => {
            setName(e.target.value);
            if (nameWarn) setNameWarn(false);
          }}
        />
        {nameWarn ? (
          <span className="field__warn" id="birth-name-hint" role="alert">
            <span className="field__warn__mark" aria-hidden>!</span>
            이름을 두 글자 이상 넣어주세요. 이름 소리도 계산에 들어가요.
          </span>
        ) : (
          <span className="field__hint" id="birth-name-hint">
            이름 소리를 다섯 기운으로 갈라 사주와 같이 봐요.
          </span>
        )}
      </label>

      <div className={genderWarn ? 'field field--warn' : 'field'} ref={genderRef}>
        <span className="field__k">성별</span>
        <div className="seg">
          {([['female', '여자'], ['male', '남자']] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`seg__btn${gender === k ? ' seg__btn--on' : ''}`}
              aria-pressed={gender === k}
              aria-describedby="birth-gender-hint"
              onClick={() => {
                setGender(gender === k ? null : k);
                if (genderWarn) setGenderWarn(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {genderWarn ? (
          <span className="field__warn" id="birth-gender-hint" role="alert">
            <span className="field__warn__mark" aria-hidden>!</span>
            성별을 골라주세요. 십 년 흐름이 앞으로 가는지 뒤로 가는지가 여기서 갈려요.
          </span>
        ) : (
          <span className="field__hint" id="birth-gender-hint">
            십 년 흐름의 방향이 성별로 갈려요.
          </span>
        )}
      </div>

      <div className="wheel-group">
          <span className="wheel-group__k">생년월일</span>
          {/* 음력 생일만 아는 분이 많다. 음력을 양력인 줄 알고 넣으면
              여덟 글자가 통째로 남의 것이 되므로, 무엇으로 넣는지 먼저 고르게 한다. */}
          <div className="seg cal-seg">
            {([['solar', '양력'], ['lunar', '음력']] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`seg__btn${cal === k ? ' seg__btn--on' : ''}`}
                aria-pressed={cal === k}
                onClick={() => switchCal(k)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="wheel-group__v">
            {cal === 'lunar' ? '음력 ' : ''}
            {year}년 {leapOn ? '윤' : ''}
            {month}월 {safeDay}일
          </span>
          {cal === 'lunar' ? (
            <span className="wheel-group__sub">
              {solar
                ? `양력 ${solar.year}년 ${solar.month}월 ${solar.day}일로 봐요`
                : '이 날짜는 그 해에 없어요'}
            </span>
          ) : null}
          <div className="wheel-row">
            <WheelPicker items={YEARS} value={year} onChange={setYear} label="태어난 해" />
            <WheelPicker items={MONTHS} value={month} onChange={setMonth} label="태어난 달" />
            <WheelPicker items={DAYS} value={safeDay} onChange={setDay} label="태어난 날" />
          </div>
          {/* 윤달은 그 해 그 달에만 있다. 없는 해에도 칸을 띄워두면 뭘 고르라는 건지 모른다. */}
          {leapAvail ? (
            <button
              type="button"
              className={leapOn ? 'birth-unknown birth-unknown--on' : 'birth-unknown'}
              onClick={() => setLeap((v) => !v)}
              aria-pressed={leapOn}
            >
              <span className="birth-unknown__box" aria-hidden />
              윤{month}월에 태어났어요
            </button>
          ) : null}
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
        {/* '30분만 달라도…' 같은 설득 문장은 넣지 않는다. 몰라요를 켰을 때만,
            무엇이 빠지는지 한 문장. */}
        {unknownTime ? <p className="birth-hint">시각 없이 세 기둥으로 봐요.</p> : null}

        {/* 태어난 곳 — 한국 표준시는 동경 135°를 쓰는데 국토는 126~130°에 있다.
            목포와 포항은 해가 뜨는 시각이 12분 차이라, 시주 경계 근처에서
            태어난 사람은 전원 서울로 계산하면 시주가 한 칸 밀린다.
            모양은 이름 칸과 같은 줄을 쓴다 — 같은 폼 안에서 칸마다 생김새가
            다르면 무엇을 넣는 자리인지가 안 읽힌다. */}
        <div className="field">
          <span className="field__k">태어난 곳</span>
          <button
            type="button"
            className={placeOpen ? 'field__pick field__pick--on' : 'field__pick'}
            aria-expanded={placeOpen}
            onClick={() => setPlaceOpen((v) => !v)}
          >
            <span>{place.label}</span>
            <span className="field__pick__c" aria-hidden>
              {placeOpen ? '닫기' : '바꾸기'}
            </span>
          </button>
          {placeOpen ? (
            <div className="field__opts">
              {BIRTH_PLACES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={p.id === placeId ? 'field__opt field__opt--on' : 'field__opt'}
                  aria-pressed={p.id === placeId}
                  onClick={() => {
                    setPlaceId(p.id);
                    setPlaceOpen(false);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}
          <span className="field__hint">
            해가 뜨는 시각이 지역마다 달라요. 목록에 없으면 가까운 곳으로 골라주세요.
          </span>
        </div>

      </div>

      {notice ? <p className="birth-warn">{notice}</p> : null}

      {/* 지울 길은 넣는 자리에 둔다. 결과 화면에 두면 '또 볼 게 있나' 가 된다.
          지우는 건 되돌릴 수 없으니 한 번 더 묻는다. */}
      {initial && onClear ? (
        confirmClear ? (
          <div className="clear-ask">
            <p className="clear-ask__q">이름, 생년월일, 성별을 전부 지울까요?</p>
            <div className="clear-ask__btns">
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmClear(false)}>
                아니요
              </button>
              <button type="button" className="btn btn--danger" onClick={onClear}>
                네, 지울게요
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="data-link" onClick={() => setConfirmClear(true)}>
            넣어둔 정보 지우기
          </button>
        )
      ) : null}
    </AppLayout>
  );
}
