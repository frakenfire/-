// 공유 — 앱인토스 공식 share() 우선, 미지원 시 웹 표준(navigator.share)·클립보드 폴백.
// 중요: 사용자가 공유창을 '취소'한 것을 성공으로 처리하지 않는다(보상 무결성).
import { share as tossShare, getTossShareLink } from '@apps-in-toss/web-framework';

// 공유가 곧 '친구에게 도움 주기'가 되도록, 받는 사람이 바로 쓸 수 있는
// 행동 처방 브리핑 형태로 보낸다.
export type ShareBriefing = {
  title: string;
  score: number;
  grade: string;
  headline: string; // 기분에 맞춘 하루 설계 한 줄 (와닿는 훅)
  doItem: string; // 오늘 이렇게 보내요 (구체 행동)
  dontItem: string; // 오늘은 접어둬요
  shareLine: string;
  brag?: string; // "상위 8%" 자랑 문구
};

// 'shared' 실제 공유됨 / 'copied' 공유 미지원이라 문구 복사 / 'cancelled' 사용자가 취소 / 'failed' 실패
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export function buildShareText(b: ShareBriefing): string {
  const head = b.brag
    ? `💌 오늘쪽지 · 오늘의 ${b.title} · 총운 ${b.score}점 (${b.brag}) 🏆`
    : `💌 오늘쪽지 · 오늘의 ${b.title} (총운 ${b.score}점)`;
  return [
    head,
    ``,
    `"${b.headline}"`,
    ``,
    `✅ 이렇게 보내요: ${b.doItem}`,
    `🌙 오늘은 접어둬요: ${b.dontItem}`,
    ``,
    `너 생각나서 보내는 오늘의 쪽지. 네 것도 뽑아봐 👀`,
  ].join('\n');
}

function tossSupported(fn: unknown): fn is { isSupported?: () => boolean } {
  return typeof fn === 'function';
}

// 앱인토스 딥링크를 붙여 수신자가 미니앱으로 바로 진입하게 한다. (토스 웹뷰에서만 동작)
async function appendTossLink(text: string, path: string): Promise<string> {
  try {
    if (getTossShareLink && (getTossShareLink as { isSupported?: () => boolean }).isSupported?.() !== false) {
      const link = await getTossShareLink(path);
      if (link) return `${text}\n${link}`;
    }
  } catch {
    /* 딥링크 실패 시 링크 없이 공유 */
  }
  return text;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function isAbort(e: unknown): boolean {
  return !!e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'AbortError';
}

/**
 * 임의 텍스트 공유. 결과를 4가지 상태로 구분한다.
 * 취소(cancelled)는 절대 성공(shared/copied)으로 처리하지 않는다.
 * @param path 앱인토스 딥링크 경로 (예: '/compat'). 토스 웹뷰에서 링크가 붙는다.
 */
export async function shareMessage(text: string, path = '/'): Promise<ShareOutcome> {
  // 1) 앱인토스 공식 공유 (토스 웹뷰)
  if (tossSupported(tossShare) && (tossShare as { isSupported?: () => boolean }).isSupported?.() !== false) {
    try {
      const withLink = await appendTossLink(text, path);
      await tossShare({ message: withLink });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
      // 토스 공유 실패 → 아래 웹 표준으로 폴백
    }
  }

  // 2) 웹 표준 공유
  const nav = navigator as Navigator & {
    share?: (data: { text?: string; title?: string }) => Promise<void>;
  };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: '오늘쪽지 뽑기', text });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled'; // 사용자가 취소 → 복사로 넘어가지 않는다
      // 미지원/기타 오류만 복사로 폴백
    }
  }

  // 3) 공유 자체가 불가능한 환경 → 문구 복사
  return (await copyText(text)) ? 'copied' : 'failed';
}

/**
 * 궁합 잠금 해제용 공유. 실제 공유(shared) 또는 복사(copied) 성공에만 true.
 * 취소·실패는 false (보상 위장 금지).
 */
export async function shareForUnlock(text: string, path = '/compat'): Promise<boolean> {
  const outcome = await shareMessage(text, path);
  return outcome === 'shared' || outcome === 'copied';
}

/** 결과 공유(자랑). 상태를 그대로 돌려줘 화면이 취소/성공을 구분해 안내한다. */
export async function shareBriefing(b: ShareBriefing, path = '/'): Promise<ShareOutcome> {
  return shareMessage(buildShareText(b), path);
}
