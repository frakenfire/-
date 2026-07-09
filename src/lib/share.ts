// PRD §7.2 — 친구도 뽑아주기 / 공유 문구 복사.

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

export function buildShareText(b: ShareBriefing): string {
  const head = b.brag
    ? `💌 오늘쪽지 · 오늘의 ${b.title} · 총운 ${b.score}점 (${b.brag}) 🏆`
    : `💌 오늘쪽지 · 오늘의 ${b.title} (총운 ${b.score}점)`;
  return [
    head,
    ``,
    `"${b.headline}"`,
    ``,
    `✅ 이렇게 보내요 — ${b.doItem}`,
    `🌙 오늘은 접어둬요 — ${b.dontItem}`,
    ``,
    `너 생각나서 보내는 오늘의 쪽지. 네 것도 뽑아봐 👀`,
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

// 임의 텍스트 공유(궁합 등). 성공(공유 또는 복사) 시 true.
export async function shareText(text: string): Promise<boolean> {
  const nav = navigator as Navigator & {
    share?: (data: { text?: string; title?: string }) => Promise<void>;
  };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: '오늘쪽지 뽑기', text });
      return true;
    } catch {
      /* 취소/미지원 → 복사 폴백 */
    }
  }
  return copyText(text);
}

export async function shareOrCopy(b: ShareBriefing): Promise<'shared' | 'copied' | 'failed'> {
  const text = buildShareText(b);
  const nav = navigator as Navigator & {
    share?: (data: { text?: string; title?: string }) => Promise<void>;
  };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: '오늘쪽지 뽑기', text });
      return 'shared';
    } catch {
      /* 취소/미지원 → 복사 폴백 */
    }
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}
