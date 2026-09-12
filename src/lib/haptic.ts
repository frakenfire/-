// 누르는 맛 — 토스 앱 안에서는 네이티브 햅틱, 밖(브라우저)에서는 짧은 진동.
// 어디서도 실패로 앱을 멈추지 않는다.
import * as toss from '@apps-in-toss/web-framework';

type Kind = 'tick' | 'soft' | 'success';

const TOSS_TYPE: Record<Kind, string> = { tick: 'tickWeak', soft: 'softMedium', success: 'success' };
const MS: Record<Kind, number> = { tick: 4, soft: 10, success: 18 };

let last = 0;
export function tap(kind: Kind = 'soft') {
  const now = Date.now();
  // 휠이 빠르게 돌 때 틱이 겹치지 않게 최소 간격을 둔다
  if (kind === 'tick' && now - last < 30) return;
  last = now;
  // 토스 앱 안(ReactNativeWebView 가 있을 때)에서만 네이티브 햅틱을 부른다.
  // 브라우저에서 부르면 프레임워크가 비동기로 예외를 던져 콘솔 에러가 된다.
  const inToss = typeof window !== 'undefined' && 'ReactNativeWebView' in window;
  if (inToss) {
    try {
      const fn = (toss as unknown as { generateHapticFeedback?: (o: { type: string }) => unknown }).generateHapticFeedback;
      if (typeof fn === 'function') {
        const r = fn({ type: TOSS_TYPE[kind] }) as { catch?: (f: () => void) => void } | undefined;
        r?.catch?.(() => {});
        return;
      }
    } catch {
      /* 무시 */
    }
  }
  try {
    navigator.vibrate?.(MS[kind]);
  } catch {
    /* 지원 안 함 */
  }
}
