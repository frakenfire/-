// 공용 "최근 노출 회피" 픽 — 같은 콘텐츠 축에서 최근에 본 것들과 다른 걸 고른다.
// (반복을 두 번 체감하는 순간 "맞는다"는 몰입이 깨지기 때문)
// storageKey 로 콘텐츠 축마다 독립된 이력을 유지한다(하루설계/풀이/미션/궁합 등).
//
// 예전엔 '직전 1개'만 피했는데, 풀이 7~12개로 커진 뒤로는 하루 걸러 같은 문장이
// 다시 나올 수 있었다. 최근 3개까지 피하되, 풀이 작으면 피할 수 있는 만큼만 피한다
// (회피 수 ≥ 풀 크기면 고를 게 없어지므로 len-1 로 캡).

const HISTORY_DEPTH = 3;

function loadHistory(key: string): number[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    if (raw.startsWith('[')) {
      const arr = JSON.parse(raw) as unknown;
      return Array.isArray(arr) ? arr.filter((n): n is number => Number.isInteger(n)) : [];
    }
    // 구버전(단일 숫자) 이력과 호환
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) ? [n] : [];
  } catch {
    return [];
  }
}

export function pickFreshIndex(seed: number, len: number, storageKey: string): number {
  const base = Math.abs(Math.trunc(seed)) % len;
  if (len <= 1) return base;
  let idx = base;
  try {
    const key = `tomorrowNoteLastVariant:${storageKey}`;
    const history = loadHistory(key);
    const avoid = new Set(history.slice(0, Math.min(HISTORY_DEPTH, len - 1)));
    if (avoid.has(idx)) {
      // seed 에서 파생된 결정적 보폭으로 회피 — 같은 입력이면 같은 결과(재현성 유지)
      const step = 1 + (Math.abs(Math.trunc(seed / 7)) % (len - 1));
      for (let i = 0; i < len && avoid.has(idx); i++) idx = (idx + step) % len;
      if (avoid.has(idx)) idx = (base + 1) % len; // 전부 회피 불가하면 최소한 직전과 다르게
    }
    const next = [idx, ...history.filter((n) => n !== idx)].slice(0, HISTORY_DEPTH);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* localStorage 불가 환경에서는 seed 값 그대로 사용 */
  }
  return idx;
}

export function pickFresh<T>(arr: T[], seed: number, storageKey: string): T {
  return arr[pickFreshIndex(seed, arr.length, storageKey)];
}
