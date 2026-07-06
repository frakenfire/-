import type { FortuneType } from '../types/fortune';

// PRD §14 — 개인정보/자유입력 저장 금지. 선택형 값만 localStorage 에 남긴다.

const KEYS = {
  lastResult: 'tomorrowNoteLastResult',
  dailyDrawCount: 'tomorrowNoteDrawCount',
  lastVisitDate: 'tomorrowNoteLastVisit',
} as const;

export type StoredResult = {
  dateKey: string;
  fortuneType: FortuneType;
  noteId: string;
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

// ── 쪽지 유형 (테스트 결과) ──
const TYPE_KEY = 'tomorrowNoteMyType';

export function saveMyType(typeId: string): void {
  safeSet(TYPE_KEY, typeId);
}

export function loadMyType(): string | null {
  return safeGet(TYPE_KEY);
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
