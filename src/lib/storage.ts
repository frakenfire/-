import type { FortuneType } from '../types/fortune.ts';

// PRD §14 — 개인정보/자유입력 저장 금지. 선택형 값 + 생성된 결과 텍스트만 저장.

const KEYS = {
  dailyDrawCount: 'tomorrowNoteDrawCount',
  dailyDrawDate: 'tomorrowNoteDrawDate', // 뽑기 카운트 전용 날짜(방문 기록과 분리)
  lastVisitDate: 'tomorrowNoteLastVisit',
} as const;

export type StoredResult = {
  dateKey: string;
  fortuneType: FortuneType;
  noteId: string;
};

import { parseBirth } from './birth.ts';
import { isKnownPlace } from '../data/birthPlace.ts';

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

// 뽑은 기록은 남기지 않는다.
//
// 지난 기록·이번 달 등급 수집을 로컬스토리지에 쌓아왔는데, 저장이 오래 버티지 못한다.
// 아이폰은 이레 동안 안 들어오면 웹 저장소를 통째로 지우고, 토스 SDK 가 올라가면
// 서빙 주소가 바뀌어 예전 값에 닿지 못한다. 못 지킬 약속은 애초에 하지 않는 게 낫다.
// 오늘 뽑은 결과도 저장하지 않는다. 화면을 벗어나면 그걸로 끝이다.

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

// 뽑기 카운트는 방문 기록(markVisit)과 분리된 자체 날짜 키를 쓴다.
// (예전엔 lastVisitDate 를 공유해, 운세 선택 시 markVisit 이 먼저 날짜를
//  갱신하면 날이 바뀌어도 카운트가 초기화되지 않는 버그가 있었다.)
function getDailyDrawCount(dateKey: string): number {
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
  { key: 'bestie', icon: 'users', label: '베프' },
  { key: 'crush', icon: 'heartSpark', label: '썸' },
  { key: 'partner', icon: 'heartPair', label: '연인' },
  { key: 'family', icon: 'home', label: '가족' },
  { key: 'coworker', icon: 'briefcase', label: '동료' },
  { key: 'oneside', icon: 'flower', label: '짝사랑' },
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
/** 이 앱이 저장한 모든 로컬 데이터를 지운다. 성공 여부 반환. */
export function clearAllData(): boolean {
  try {
    // 나열식 삭제는 새 키가 생길 때마다 빼먹는다(실제로 알림 동의 상태와
    // 노출 이력 'tomorrowNoteLastVariant:*' 가 남았었다).
    // 이 앱의 모든 키는 'tomorrowNote' 접두사를 쓰므로 접두사로 전부 지운다.
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('tomorrowNote')) doomed.push(k);
    }
    for (const k of doomed) window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

// ── 알림 동의 / 리뷰 요청 상태 (한 번 물었으면 조르지 않는다) ──
const ASK_KEYS = {
  notiAsked: 'tomorrowNoteNotiAsked', // 'agreed' | 'rejected' | 'asked'
  reviewAsked: 'tomorrowNoteReviewAsked', // '1'
} as const;

export function hasAskedReview(): boolean {
  return safeGet(ASK_KEYS.reviewAsked) === '1';
}
export function markReviewAsked(): void {
  safeSet(ASK_KEYS.reviewAsked, '1');
}

// ── 주간 캘린더 해금 (스트릭 보상 또는 광고) ──
// 해금은 '그 주'에만 유효하다 — 매주 다시 열게 해야 스트릭·광고가 계속 돈다.

/** 주 식별자 — 월요일 기준. 같은 주 안에서는 한 번만 열면 된다. */
export function weekIdOf(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  const day = d.getDay(); // 0=일
  const back = day === 0 ? 6 : day - 1; // 월요일까지 되감기
  d.setDate(d.getDate() - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── 생년월일시 ────────────────────────────────────────────────────────────
// 사주를 세우려면 태어난 순간이 필요하다. 서버로 보내지 않고 이 기기에만 둔다.
// (그래서 앱을 지우면 사라진다 — 화면에서 그 사실을 명시한다)
const BIRTH_KEY = 'tomorrowNoteBirth';


export type StoredBirth = {
  /** 'YYYY-MM-DD' 양력 */
  date: string;
  /** 'HH:MM' 또는 null(모름) */
  time: string | null;
  /** 결과에 부를 이름. 없어도 된다 */
  name?: string;
  /** 대운의 방향이 성별로 갈린다. 안 고르면 대운은 순행으로 세운다 */
  gender?: 'male' | 'female';
  /**
   * 넣을 때 무엇으로 넣었는지. date 는 언제나 양력이다 — 계산은 양력 하나로만 한다.
   * 이건 다시 열었을 때 넣던 모습 그대로 보여주기 위한 값이다.
   * 음력으로 넣은 사람에게 양력 날짜를 보여주면 '내가 이렇게 넣었나' 가 된다.
   */
  calendar?: 'solar' | 'lunar';
  /** 음력으로 넣었고 그게 윤달이었으면 true */
  leap?: boolean;
  /** 태어난 곳. 진태양시 보정의 경도가 여기서 나온다. 없으면 서울로 본다 */
  place?: string;
};
// 생년월일 없이 보고 싶어요 — 한 번 고르면 다시 묻지 않는다
const SKIP_BIRTH_KEY = 'tomorrowNoteSkipBirth';
export function loadSkipBirth(): boolean {
  return safeGet(SKIP_BIRTH_KEY) === '1';
}

export function loadBirth(): StoredBirth | null {
  const raw = safeGet(BIRTH_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as StoredBirth;
    if (typeof v?.date !== 'string') return null;
    const time = typeof v.time === 'string' ? v.time : null;
    // 형식만 보면 "25:00" 같은 값이 통과한다. 화면과 같은 검증을 써서
    // 저장소에 남은 이상한 값이 잘못된 사주로 이어지지 않게 한다.
    if (!parseBirth(v.date, time)) return null;
    const name = typeof v.name === 'string' ? v.name.trim().slice(0, 10) : undefined;
    // 성별은 대운이 앞으로 가는지 뒤로 가는지를 가른다. 예전엔 여기서 흘려서,
    // 새로고침하면 열 해 흐름이 통째로 반대로 섰다. 넣은 값은 전부 되돌려준다.
    const gender = v.gender === 'male' || v.gender === 'female' ? v.gender : undefined;
    const calendar = v.calendar === 'lunar' ? 'lunar' : v.calendar === 'solar' ? 'solar' : undefined;
    const out: StoredBirth = { date: v.date, time };
    if (name) out.name = name;
    if (gender) out.gender = gender;
    if (calendar) out.calendar = calendar;
    if (calendar === 'lunar' && v.leap === true) out.leap = true;
    // 모르는 지역 값은 받지 않는다. 경도가 없으면 계산이 서울로 조용히 돌아간다.
    if (isKnownPlace(v.place)) out.place = v.place;
    return out;
  } catch {
    return null;
  }
}

export function saveBirth(b: StoredBirth): boolean {
  return safeSet(BIRTH_KEY, JSON.stringify(b));
}

export function clearBirth(): boolean {
  try {
    window.localStorage.removeItem(BIRTH_KEY);
    return true;
  } catch {
    return false;
  }
}


// ── 오늘 광고로 연 고민 ─────────────────────────────────────────────────────
// 본문은 전부 무료다. 광고는 '고민 하나를 더 보는 것'에만 쓴다.
// 한 번 열었으면 그 날은 다시 광고를 보게 하지 않는다. 같은 값에 두 번
// 값을 치르게 하면 그때부터 광고가 아니라 통행료가 된다.
const UNLOCKED_KEY = 'tomorrowNoteUnlockedConcerns';

export function loadUnlockedConcerns(dateKey: string): string[] {
  const raw = safeGet(UNLOCKED_KEY);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as { date?: unknown; keys?: unknown };
    if (v?.date !== dateKey || !Array.isArray(v.keys)) return [];
    return v.keys.filter((k): k is string => typeof k === 'string').slice(0, 12);
  } catch {
    return [];
  }
}

export function addUnlockedConcern(dateKey: string, key: string): string[] {
  const next = [...new Set([...loadUnlockedConcerns(dateKey), key])].slice(0, 12);
  safeSet(UNLOCKED_KEY, JSON.stringify({ date: dateKey, keys: next }));
  return next;
}


// ── 알림을 물어봤는가 ───────────────────────────────────────────────────────
// 알림 동의는 한 번만 묻는다. 거절한 사람에게 다시 묻는 건 그 자체로 이탈이다.
const NOTI_ASK_KEY = 'tomorrowNoteNotiAsked';

export function hasAskedNoti(): boolean {
  return safeGet(NOTI_ASK_KEY) === '1';
}

export function markNotiAsked(): boolean {
  return safeSet(NOTI_ASK_KEY, '1');
}
