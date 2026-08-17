// 한국의 시간 이력 — 사람이 말한 '태어난 시각'을 천문 계산이 쓰는 UTC 로 옮긴다.
//
// 왜 이게 필요한가:
//   사주의 시주(時柱)는 2시간 단위라 30분만 어긋나도 다른 기둥이 선다.
//   그런데 한국의 표준시는 역사적으로 +9 와 +8:30 을 오갔고, 서머타임도 12번 있었다.
//   "1959년 5월 10일 밤 11시 30분에 태어났다"는 말은 그 시절 시계 기준이라,
//   지금의 +9 로 계산하면 시주가 한 칸 밀린다. 실제로 틀리는 사람이 나온다.
//
// 출처: IANA tz database, Asia/Seoul (Zone + Rule ROK). 'Sun>=N' 규칙은 스크립트로 확정했고
//       koreaTime.test.ts 가 요일까지 다시 검증한다.

/** 표준시(서머타임 제외) 구간. from 이상 to 미만, 현지 시각 기준. */
const STANDARD_OFFSETS: { from: string; offsetMin: number }[] = [
  { from: '0000-01-01T00:00', offsetMin: 8.5 * 60 }, // 1912 이전(대한제국 표준시)
  { from: '1912-01-01T00:00', offsetMin: 9 * 60 },
  { from: '1954-03-21T00:00', offsetMin: 8.5 * 60 },
  { from: '1961-08-10T00:00', offsetMin: 9 * 60 },
];

/** 서머타임 구간 — [시작(현지, 표준시 기준), 종료(현지, 서머타임 기준)). 모두 +60분. */
const DST_RANGES: [string, string][] = [
  ['1948-06-01T00:00', '1948-09-13T00:00'],
  ['1949-04-03T00:00', '1949-09-11T00:00'],
  ['1950-04-01T00:00', '1950-09-10T00:00'],
  ['1951-05-06T00:00', '1951-09-09T00:00'],
  ['1955-05-05T00:00', '1955-09-09T00:00'],
  ['1956-05-20T00:00', '1956-09-30T00:00'],
  ['1957-05-05T00:00', '1957-09-22T00:00'],
  ['1958-05-04T00:00', '1958-09-21T00:00'],
  ['1959-05-03T00:00', '1959-09-20T00:00'],
  ['1960-05-01T00:00', '1960-09-18T00:00'],
  ['1987-05-10T02:00', '1987-10-11T03:00'],
  ['1988-05-08T02:00', '1988-10-09T03:00'],
];

/** 'YYYY-MM-DDTHH:mm' 을 비교 가능한 숫자로. 문자열 비교로도 되지만 의도를 분명히 한다. */
function stamp(y: number, mo: number, d: number, h: number, mi: number): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(y, 4)}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}`;
}

export type KoreaOffset = {
  /** 그 시각에 적용된 총 오프셋(분). 예: 서머타임 중 +9 지역이면 600 */
  offsetMin: number;
  /** 서머타임이 적용된 시각인지 */
  isDst: boolean;
  /** 사용자에게 보여줄 근거 한 줄 (없으면 undefined) */
  note?: string;
};

/**
 * 한국 현지 시각(사람이 기억하는 그 시계) → 그때 적용되던 UTC 오프셋.
 * 서머타임 시작 직후의 '존재하지 않는 시각'은 표준시로 읽어 앞으로 당긴다.
 */
export function koreaOffsetAt(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): KoreaOffset {
  const s = stamp(year, month, day, hour, minute);

  let standard = STANDARD_OFFSETS[0].offsetMin;
  for (const row of STANDARD_OFFSETS) {
    if (s >= row.from) standard = row.offsetMin;
  }

  for (const [start, end] of DST_RANGES) {
    if (s >= start && s < end) {
      const y = start.slice(0, 4);
      return {
        offsetMin: standard + 60,
        isDst: true,
        note: `${y}년 서머타임 적용 구간이라 시계가 1시간 당겨져 있었어요`,
      };
    }
  }

  const note =
    standard === 8.5 * 60
      ? `${year}년 당시 한국 표준시는 지금(+9)과 달리 +8:30 이었어요`
      : undefined;
  return { offsetMin: standard, isDst: false, note };
}

/** 서울의 경도. 진태양시 보정의 기준점. */
export const SEOUL_LONGITUDE = 126.978;

/**
 * 진태양시(眞太陽時) 보정값(분). 표준자오선 135°E 와 실제 경도의 차이.
 * 서울은 약 -32분 — 시계가 12:00 일 때 태양은 아직 11:28 자리에 있다.
 * 전통 명리는 태양의 실제 위치로 시주를 세우므로 이 보정을 쓰는 것이 통설이다.
 */
export function trueSolarCorrectionMin(longitude = SEOUL_LONGITUDE): number {
  return (longitude - 135) * 4;
}
