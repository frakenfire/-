// PRD §7.2 — 친구도 뽑아주기 / 공유 문구 복사.

const SHARE_INTRO = '내 내일쪽지 결과야. 너도 한 장 뽑아볼래?';

export function buildShareText(title: string, shareLine: string): string {
  return `[내일쪽지 뽑기]\n${title}\n\n"${shareLine}"\n\n${SHARE_INTRO}`;
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

export async function shareOrCopy(
  title: string,
  shareLine: string,
): Promise<'shared' | 'copied' | 'failed'> {
  const text = buildShareText(title, shareLine);
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
