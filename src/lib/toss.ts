// 앱인토스 네이티브 브릿지 어댑터.
// 모든 호출은 토스 웹뷰 밖(브라우저/프리뷰)에서도 안전하게 폴백하도록 감싼다.
// isSupported() 로 게이팅하고, 실패/미지원 시 웹 표준 동작으로 대체한다.
import {
  saveBase64Data as tossSaveBase64Data,
  getServerTime as tossGetServerTime,
  SafeAreaInsets,
} from '@apps-in-toss/web-framework';

function supported(fn: unknown): boolean {
  try {
    const s = (fn as { isSupported?: () => boolean } | undefined)?.isSupported;
    return typeof s === 'function' ? s() : false;
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

  if (supported(tossSaveBase64Data)) {
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
