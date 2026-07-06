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
