// 생년월일시 문자열 → 엔진 입력. 검증을 여기 한 곳에만 둔다.
//
// 화면과 저장소가 각자 검사하면 반드시 어긋난다. 실제로 그랬다 —
// 저장소 쪽은 형식(\d{2}:\d{2})만 보고 "25:00" 을 통과시켰다.
// 잘못된 값은 잘못된 사주가 되고, 그건 이 앱에서 가장 나쁜 실패다.
import type { BirthInput } from './fourPillars.ts';

/** 'YYYY-MM-DD' + 'HH:MM'(또는 null) → BirthInput. 조금이라도 이상하면 null. */
export function parseBirth(date: string, time: string | null): BirthInput | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1900 || year > 2200) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // 달력에 없는 날(2월 30일 등)을 Date 가 조용히 다음 달로 넘겨버린다 → 남의 사주가 된다.
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
