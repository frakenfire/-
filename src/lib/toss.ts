// 앱인토스 네이티브 브릿지 어댑터.
// 모든 호출은 토스 웹뷰 밖(브라우저/프리뷰)에서도 안전하게 폴백하도록 감싼다.
// isSupported() 로 게이팅하고, 실패/미지원 시 웹 표준 동작으로 대체한다.
import {
  saveBase64Data as tossSaveBase64Data,
  getServerTime as tossGetServerTime,
  requestNotificationAgreement as tossRequestNotiAgreement,
  eventLog as tossEventLog,
  SafeAreaInsets,
  requestReview as tossRequestReview,
} from '@apps-in-toss/web-framework';

/**
 * SDK 가 isSupported 를 붙여준 함수만 그걸로 게이팅한다.
 *
 * 설치된 SDK 를 실제로 열어보면 isSupported 가 붙은 건 getServerTime 과
 * requestReview 뿐이다. saveBase64Data, eventLog, requestNotificationAgreement
 * 에는 없다. 그래서 '없으면 false' 로 두면 그 셋은 토스 안에서도 영영
 * 안 불린다. (실제로 saveBase64Data 가 그랬다)
 */
function supported(fn: unknown): boolean {
  try {
    const s = (fn as { isSupported?: () => boolean } | undefined)?.isSupported;
    if (typeof s === 'function') return s();
    // isSupported 를 안 주는 함수는 '있으면 쓸 수 있다' 로 본다.
    return typeof fn === 'function';
  } catch {
    return false;
  }
}

/**
 * 지금 토스 웹뷰 안인가.
 *
 * SDK 의 브릿지가 직접 보는 신호와 같은 것을 본다 - window.ReactNativeWebView
 * 가 없으면 브릿지는 'ReactNativeWebView is not available in browser
 * environment' 로 던진다. 네이티브가 실패했을 때 웹 폴백으로 내려갈지,
 * 아니면 실패로 끝낼지를 이걸로 가른다.
 */
function inTossWebView(): boolean {
  try {
    return typeof window !== 'undefined'
      && (window as { ReactNativeWebView?: unknown }).ReactNativeWebView != null;
  } catch {
    return false;
  }
}

/**
 * Base64 이미지를 사용자 기기에 저장.
 * 토스 웹뷰: 공식 saveBase64Data. 그 외: 브라우저 다운로드 폴백.
 * @param dataUrl `data:image/png;base64,...` 형식의 canvas.toDataURL 결과
 */
export async function saveImageData(dataUrl: string, fileName: string): Promise<boolean> {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const mimeMatch = /^data:([^;]+);/.exec(dataUrl);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

  // 토스 안에서는 네이티브 저장만 쓴다. 여기서 실패했는데 아래 웹 폴백으로
  // 내려가면 <a download> 가 조용히 아무것도 안 하고 true 를 돌려줘서
  // '저장 완료' 라고 거짓말을 하게 된다.
  if (inTossWebView() && supported(tossSaveBase64Data)) {
    try {
      await tossSaveBase64Data({ data: base64, fileName, mimeType });
      return true;
    } catch {
      return false; // 토스 저장 실패 — 위장 성공 금지
    }
  }

  // 브라우저 폴백 (개발/웹 프리뷰)
  try {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}

/**
 * 신뢰할 수 있는 '오늘' 날짜 키(YYYY-MM-DD).
 * 토스 서버 시간을 우선 쓰고(기기 시간 조작 방지), 미지원 시 기기 시간 폴백.
 */
export async function getTrustedDateKey(fallback: () => string): Promise<string> {
  if (supported(tossGetServerTime)) {
    try {
      const ms = await tossGetServerTime();
      if (typeof ms === 'number' && Number.isFinite(ms)) {
        const d = new Date(ms);
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    } catch {
      /* 폴백 */
    }
  }
  return fallback();
}

/**
 * 시스템 뒤로가기 구독. 현재 앱인토스 web SDK 표면에는 안정적으로 노출된
 * 하드웨어 back 이벤트 API가 없어 지금은 no-op(앱 내부 뒤로가기 버튼으로 처리).
 * goBack 로직은 App 에 준비돼 있어, 향후 공식 back 이벤트가 열리면 여기만 연결하면 된다.
 */
export function subscribeBackEvent(_handler: () => void): () => void {
  void _handler;
  return () => {};
}

/** Safe Area 를 CSS 변수(--sat)로 상단 인셋 반영. 초기값 + 변화 구독. 미지원이면 no-op. */
export function subscribeSafeArea(): () => void {
  const apply = (insets: { top?: number } | undefined) => {
    if (insets && typeof insets.top === 'number') {
      document.documentElement.style.setProperty('--sat', `${insets.top}px`);
    }
  };
  try {
    if (SafeAreaInsets && typeof SafeAreaInsets.get === 'function') {
      apply(SafeAreaInsets.get() as { top?: number });
    }
    if (SafeAreaInsets && typeof SafeAreaInsets.subscribe === 'function') {
      const unsub = SafeAreaInsets.subscribe({ onEvent: (insets) => apply(insets) });
      return typeof unsub === 'function' ? unsub : () => {};
    }
  } catch {
    /* no-op */
  }
  return () => {};
}

/**
 * 퍼널 이벤트 로깅 — 토스 Analytics(eventLog). 미지원/실패 시 조용히 no-op.
 * 절대 throw 하지 않으며, 앱 흐름을 막지 않는다(fire-and-forget).
 */
export function logEvent(name: string, params: Record<string, unknown> = {}): void {
  try {
    const fn = tossEventLog as unknown as ((p: unknown) => Promise<void>) & {
      isSupported?: () => boolean;
    };
    if (typeof fn !== 'function') return;
    if (typeof fn.isSupported === 'function' && !fn.isSupported()) return;
    void fn({ log_name: name, log_type: 'user_event', params }).catch(() => {});
  } catch {
    /* no-op */
  }
}

/** 운영 오류 관측 — 최소 컨텍스트를 이벤트로 남긴다(전송 실패해도 무시). */
export function reportError(where: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  logEvent('app_error', { where, message: message.slice(0, 300) });
}

// ── 리텐션: 아침 운세 알림 ──────────────────────────────────
// 운세 앱의 재방문은 '아침에 오는 알림'이 만든다(점신·포스텔러의 공통 장치).
// 앱인토스는 콘솔에서 알림 템플릿을 등록하고, SDK 로 동의 UI 를 띄운 뒤
// 콘솔에서 발송하는 구조다. 템플릿 코드를 아직 안 받았으면 기능 전체를 숨긴다.
export const NOTI_TEMPLATE_CODE = 'REPLACE_NOTI_TEMPLATE';

/** 알림 동의를 요청할 수 있는 상태인가 (콘솔 템플릿 코드가 채워졌는가) */
export function canAskNotification(): boolean {
  return !NOTI_TEMPLATE_CODE.startsWith('REPLACE_');
}

export type NotiAgreement = 'newAgreement' | 'alreadyAgreed' | 'agreementRejected' | 'unsupported';

/**
 * 푸시 알림 동의 UI 를 요청한다. 토스 밖/미설정/실패는 전부 'unsupported' 로
 * 조용히 수렴 — 알림은 부가 기능이라 어떤 경우에도 본 흐름을 막지 않는다.
 *
 * SDK 는 Promise 가 아니라 콜백과 해제 함수를 돌려주는 모양이라 감싸서 쓴다.
 * (requestNotificationAgreement(params): () => void)
 */
export async function askNotificationAgreement(): Promise<NotiAgreement> {
  if (!canAskNotification()) return 'unsupported';
  try {
    return await new Promise<NotiAgreement>((resolve) => {
      try {
        tossRequestNotiAgreement({
          options: { templateCode: NOTI_TEMPLATE_CODE },
          onEvent: (r: { type: NotiAgreement }) => resolve(r.type),
          onError: () => resolve('unsupported'),
        });
      } catch {
        resolve('unsupported');
      }
    });
  } catch {
    return 'unsupported';
  }
}

// ── 평판: 미니앱 리뷰 요청 ──────────────────────────────────
// 기분 좋은 순간(대길·스트릭 달성)에 한 번만 요청한다. 그 외 타이밍의
// 리뷰 요청은 평점을 깎는다. 미지원/실패는 조용히 무시.
export async function askReview(): Promise<boolean> {
  try {
    if (!supported(tossRequestReview)) return false;
    await tossRequestReview();
    return true;
  } catch {
    return false;
  }
}
