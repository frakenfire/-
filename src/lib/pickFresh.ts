// 공용 "직전 회피" 픽 — 같은 콘텐츠를 연달아 볼 때 방금 본 것과 다른 걸 고른다.
// (반복을 두 번 체감하는 순간 "맞는다"는 몰입이 깨지기 때문)
// storageKey로 콘텐츠 축마다 독립된 이력을 유지한다(하루설계/풀이/미션/궁합 등).

export function pickFreshIndex(seed: number, len: number, storageKey: string): number {
  let idx = Math.abs(Math.trunc(seed)) % len;
  try {
    const key = `tomorrowNoteLastVariant:${storageKey}`;
    const last = window.localStorage.getItem(key);
    if (len > 1 && last !== null && Number.parseInt(last, 10) === idx) {
      idx = (idx + 1 + (Math.abs(Math.trunc(seed)) % (len - 1))) % len;
      if (idx === Number.parseInt(last, 10)) idx = (idx + 1) % len;
    }
    window.localStorage.setItem(key, String(idx));
  } catch {
    /* localStorage 불가 환경에서는 seed 값 그대로 사용 */
  }
  return idx;
}

export function pickFresh<T>(arr: T[], seed: number, storageKey: string): T {
  return arr[pickFreshIndex(seed, arr.length, storageKey)];
}
