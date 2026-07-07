// PRD §7.2 — 친구도 뽑아주기 / 공유 문구 복사.

// 공유가 곧 '친구에게 도움 주기'가 되도록, 받는 사람이 바로 쓸 수 있는
// 행동 처방 브리핑 형태로 보낸다.
export type ShareBriefing = {
  title: string;
  score: number;
  grade: string;
  doItem: string;
  dontItem: string;
  shareLine: string;
};

export function buildShareText(b: ShareBriefing): string {
  return [
    `[내일쪽지] 오늘의 ${b.title} · 총운 ${b.score}점 (${b.grade})`,
    `✅ 하면 좋아요: ${b.doItem}`,
    `🚫 피하세요: ${b.dontItem}`,
    ``,
    `"${b.shareLine}"`,
    ``,
    `너한테 필요할 것 같아서 보내. 네 쪽지도 뽑아봐 👀`,
  ].join('\n');
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

export async function shareOrCopy(b: ShareBriefing): Promise<'shared' | 'copied' | 'failed'> {
  const text = buildShareText(b);
  const nav = navigator as Navigator & {
    share?: (data: { text?: string; title?: string }) => Promise<void>;
  };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: '내일쪽지 뽑기', text });
      return 'shared';
    } catch {
      /* 취소/미지원 → 복사 폴백 */
    }
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}
