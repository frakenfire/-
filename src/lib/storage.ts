import type { FortuneResult, FortuneType } from '../types/fortune';

// PRD §14 — 개인정보/자유입력 저장 금지. 선택형 값 + 생성된 결과 텍스트만 저장.

const KEYS = {
  lastResult: 'tomorrowNoteLastResult',
  todayReading: 'tomorrowNoteTodayReading',
  dailyDrawCount: 'tomorrowNoteDrawCount',
  dailyDrawDate: 'tomorrowNoteDrawDate', // 뽑기 카운트 전용 날짜(방문 기록과 분리)
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

// 저장 성공 여부를 돌려준다(용량 부족·사생활 보호 모드 등에서 실패 감지).
function safeSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
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

// ── 뽑기 기록 히스토리 (최근 7일) ──
// lastResult 하나만 저장하면 오늘 새로 뽑을 때 어제 기록이 사라진다.
// 날짜별로 최근 7건을 보관해 '어제의 쪽지' 등이 안정적으로 남게 한다.
const HISTORY_KEY = 'tomorrowNoteHistory';

export function loadHistory(): StoredResult[] {
  const raw = safeGet(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (r): r is StoredResult =>
            !!r && typeof r.dateKey === 'string' && typeof r.noteId === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

export function pushHistory(record: StoredResult): void {
  const list = loadHistory().filter((r) => r.dateKey !== record.dateKey);
  list.unshift(record);
  safeSet(HISTORY_KEY, JSON.stringify(list.slice(0, 7)));
}

export function getRecordForDate(dateKey: string): StoredResult | null {
  return loadHistory().find((r) => r.dateKey === dateKey) ?? null;
}

// 내 띠 (12개 중 선택 — 선택형 값)
const ZODIAC_KEY = 'tomorrowNoteZodiac';

export function saveMyZodiac(id: string): boolean {
  return safeSet(ZODIAC_KEY, id);
}

export function loadMyZodiac(): string | null {
  return safeGet(ZODIAC_KEY);
}

// 내 별자리 (12개 중 선택 — 선택형 값, 생년월일 아님)
const STAR_KEY = 'tomorrowNoteStarSign';

export function saveMyStarSign(id: string): boolean {
  return safeSet(STAR_KEY, id);
}

export function loadMyStarSign(): string | null {
  return safeGet(STAR_KEY);
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
    // 하루 설계(dayPlan)·심층 리포트(detail) 없는 구버전 스냅샷은 새 화면과 호환되지 않음
    if (!r.result.dayPlan?.headline || !Array.isArray(r.result.dayPlan.steps)) {
      return null;
    }
    if (!r.result.detail?.topPick || !Array.isArray(r.result.detail.ranked)) {
      return null;
    }
    return r;
  } catch {
    return null;
  }
}

// 뽑기 카운트는 방문 기록(markVisit)과 분리된 자체 날짜 키를 쓴다.
// (예전엔 lastVisitDate 를 공유해, 운세 선택 시 markVisit 이 먼저 날짜를
//  갱신하면 날이 바뀌어도 카운트가 초기화되지 않는 버그가 있었다.)
export function getDailyDrawCount(dateKey: string): number {
  if (safeGet(KEYS.dailyDrawDate) !== dateKey) return 0;
  const n = Number.parseInt(safeGet(KEYS.dailyDrawCount) ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
}

export function incrementDailyDrawCount(dateKey: string): number {
  const next = getDailyDrawCount(dateKey) + 1;
  safeSet(KEYS.dailyDrawDate, dateKey);
  safeSet(KEYS.dailyDrawCount, String(next));
  return next;
}

export function markVisit(dateKey: string): void {
  safeSet(KEYS.lastVisitDate, dateKey);
}

// ── 내 사람들 (저장된 궁합 상대) ──
// 웹서치 기준: 국내 1위 운세 앱(점신, 1900만 사용자)의 핵심 차별화 기능인
// '인맥보고서'(여러 사람을 저장해두고 오늘 누구와 잘 맞는지 한눈에 보기)를
// 벤치마킹. 단, PRD §14(개인정보/자유입력 저장 금지)에 따라 이름 대신
// 관계(가족/베프/썸 등) 선택형 값으로만 사람을 구분한다.
export const RELATIONS = [
  { key: 'bestie', emoji: '👯', label: '베프' },
  { key: 'crush', emoji: '💘', label: '썸' },
  { key: 'partner', emoji: '💑', label: '연인' },
  { key: 'family', emoji: '👪', label: '가족' },
  { key: 'coworker', emoji: '💼', label: '동료' },
  { key: 'oneside', emoji: '🌸', label: '짝사랑' },
] as const;
export type RelationKey = (typeof RELATIONS)[number]['key'];

export function relationMeta(key: RelationKey) {
  return RELATIONS.find((r) => r.key === key) ?? RELATIONS[0];
}

export type SavedPerson = {
  id: string;
  mode: 'zodiac' | 'star';
  value: string; // ZodiacId | StarSignId
  relation: RelationKey;
};

const SAVED_PEOPLE_KEY = 'tomorrowNoteSavedPeople';
const MAX_SAVED_PEOPLE = 10;

const RELATION_KEYS = new Set(RELATIONS.map((r) => r.key));

// 손상·구버전 데이터 방어 — 스키마를 실제로 검증한다(타입 단언만 하지 않음).
function isValidSavedPerson(x: unknown): x is SavedPerson {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    (p.mode === 'zodiac' || p.mode === 'star') &&
    typeof p.value === 'string' &&
    typeof p.relation === 'string' &&
    RELATION_KEYS.has(p.relation as RelationKey)
  );
}

export function loadSavedPeople(): SavedPerson[] {
  const raw = safeGet(SAVED_PEOPLE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidSavedPerson) : [];
  } catch {
    return [];
  }
}

export function addSavedPerson(
  person: Omit<SavedPerson, 'id'>,
): { list: SavedPerson[]; saved: boolean; duplicate: boolean } {
  const existing = loadSavedPeople();
  // 같은 띠/별자리라도 관계(가족·베프 등)가 다르면 다른 사람으로 저장 가능.
  // 완전히 동일한(모드+값+관계) 항목만 중복으로 막는다.
  const duplicate = existing.some(
    (p) => p.mode === person.mode && p.value === person.value && p.relation === person.relation,
  );
  if (duplicate) return { list: existing, saved: true, duplicate: true };
  const updated = [
    { ...person, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    ...existing,
  ].slice(0, MAX_SAVED_PEOPLE);
  const saved = safeSet(SAVED_PEOPLE_KEY, JSON.stringify(updated));
  return { list: updated, saved, duplicate: false };
}

export function removeSavedPerson(id: string): SavedPerson[] {
  const updated = loadSavedPeople().filter((p) => p.id !== id);
  safeSet(SAVED_PEOPLE_KEY, JSON.stringify(updated));
  return updated;
}

// ── 연속 출석 스트릭 (매일 보고 싶게 만드는 장치) ──
const STREAK_KEYS = {
  date: 'tomorrowNoteStreakDate',
  count: 'tomorrowNoteStreakCount',
} as const;

/** 현재 저장된 스트릭 값을 부작용 없이 읽는다(홈 표시용). */
export function peekStreak(): number {
  const raw = Number.parseInt(safeGet(STREAK_KEYS.count) ?? '0', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

/** 쪽지를 실제로 뽑은 날 기준으로 스트릭을 갱신하고 연속 일수를 반환한다. */
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

// ── 내 데이터 전체 삭제 (사용자가 기기 로컬 데이터 생명주기를 통제) ──
const ALL_KEYS = [
  KEYS.lastResult,
  KEYS.todayReading,
  KEYS.dailyDrawCount,
  KEYS.dailyDrawDate,
  KEYS.lastVisitDate,
  HISTORY_KEY,
  ZODIAC_KEY,
  STAR_KEY,
  SAVED_PEOPLE_KEY,
  STREAK_KEYS.date,
  STREAK_KEYS.count,
];

/** 이 앱이 저장한 모든 로컬 데이터를 지운다. 성공 여부 반환. */
export function clearAllData(): boolean {
  try {
    for (const k of ALL_KEYS) window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
