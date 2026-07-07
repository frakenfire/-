import type { FortuneResult, FortuneType } from '../types/fortune';

// PRD §14 — 개인정보/자유입력 저장 금지. 선택형 값 + 생성된 결과 텍스트만 저장.

const KEYS = {
  lastResult: 'tomorrowNoteLastResult',
  todayReading: 'tomorrowNoteTodayReading',
  dailyDrawCount: 'tomorrowNoteDrawCount',
  lastVisitDate: 'tomorrowNoteLastVisit',
} as const;

export type StoredResult = {
  dateKey: string;
  fortuneType: FortuneType;
  noteId: string;
};

// 오늘의 편지 스냅샷 — 다시 들어와도 같은 편지를 그대로 읽을 수 있게.
// (편지 조합은 직전 회피 로직 때문에 재생성 시 달라지므로 스냅샷으로 보존)
export type TodayReading = {
  dateKey: string;
  fortuneType: FortuneType;
  noteId: string;
  result: FortuneResult;
};

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}

export function saveResult(result: StoredResult): void {
  safeSet(KEYS.lastResult, JSON.stringify(result));
}

export function loadResult(): StoredResult | null {
  const raw = safeGet(KEYS.lastResult);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredResult;
  } catch {
    return null;
  }
}

// 내 띠 (12개 중 선택 — 선택형 값)
const ZODIAC_KEY = 'tomorrowNoteZodiac';

export function saveMyZodiac(id: string): void {
  safeSet(ZODIAC_KEY, id);
}

export function loadMyZodiac(): string | null {
  return safeGet(ZODIAC_KEY);
}

export function saveTodayReading(reading: TodayReading): void {
  safeSet(KEYS.todayReading, JSON.stringify(reading));
}

export function loadTodayReading(dateKey: string): TodayReading | null {
  const raw = safeGet(KEYS.todayReading);
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as TodayReading;
    if (r.dateKey !== dateKey) return null;
    // 구버전 스냅샷(배열 편지·처방 없음)은 새 구조와 호환되지 않으므로 무시
    if (!r.result?.letter || Array.isArray(r.result.letter) || !r.result.letter.sign) {
      return null;
    }
    if (!Array.isArray(r.result.dos) || r.result.dos.length === 0) {
      return null;
    }
    if (!r.result.reading?.overall) {
      return null;
    }
    return r;
  } catch {
    return null;
  }
}

export function getDailyDrawCount(dateKey: string): number {
  if (safeGet(KEYS.lastVisitDate) !== dateKey) return 0;
  const n = Number.parseInt(safeGet(KEYS.dailyDrawCount) ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
}

export function incrementDailyDrawCount(dateKey: string): number {
  const next = getDailyDrawCount(dateKey) + 1;
  safeSet(KEYS.dailyDrawCount, String(next));
  safeSet(KEYS.lastVisitDate, dateKey);
  return next;
}

export function markVisit(dateKey: string): void {
  safeSet(KEYS.lastVisitDate, dateKey);
}

// ── 연속 출석 스트릭 (매일 보고 싶게 만드는 장치) ──
const STREAK_KEYS = {
  date: 'tomorrowNoteStreakDate',
  count: 'tomorrowNoteStreakCount',
} as const;

/** 오늘 방문 기준으로 스트릭을 갱신하고 현재 연속 일수를 반환한다. */
export function updateStreak(todayKey: string, yesterdayKey: string): number {
  const last = safeGet(STREAK_KEYS.date);
  const raw = Number.parseInt(safeGet(STREAK_KEYS.count) ?? '0', 10);
  const cur = Number.isFinite(raw) && raw > 0 ? raw : 0;

  let next: number;
  if (last === todayKey) {
    next = cur || 1; // 오늘 이미 방문
  } else if (last === yesterdayKey) {
    next = cur + 1; // 연속 유지
  } else {
    next = 1; // 새로 시작
  }
  safeSet(STREAK_KEYS.date, todayKey);
  safeSet(STREAK_KEYS.count, String(next));
  return next;
}
