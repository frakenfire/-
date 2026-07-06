// 매일 쪽지 받기(주기 수신) — 구독 상태는 localStorage, 알림 등록은 mock.
// 실제 배포 시 앱인토스 푸시/알림 API 호출로 mock 부분만 교체한다. (ads.ts 와 같은 패턴)

const KEYS = {
  subscribed: 'tomorrowNoteSubscribed',
  lastDelivered: 'tomorrowNoteLastDelivered',
} as const;

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

export function isSubscribed(): boolean {
  return safeGet(KEYS.subscribed) === '1';
}

/** 매일 아침 쪽지 알림 등록 (mock — 앱인토스 푸시 연동 지점) */
export async function subscribeDaily(): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 400));
  safeSet(KEYS.subscribed, '1');
  return true;
}

export async function unsubscribeDaily(): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 200));
  safeSet(KEYS.subscribed, '0');
  return true;
}

/** 구독 중이고 오늘 아직 안 열어봤으면 true → "오늘의 쪽지 도착" 배너 노출 */
export function hasNewDelivery(dateKey: string): boolean {
  return isSubscribed() && safeGet(KEYS.lastDelivered) !== dateKey;
}

export function markDelivered(dateKey: string): void {
  safeSet(KEYS.lastDelivered, dateKey);
}
