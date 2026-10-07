// '~하기' 로 끝나는 할 일 목록을 문장으로 바꾼다.
//
// 결정 카드의 할 것과 하지 말 것은 목록이라 '모아두기', '연락 끊기' 처럼 명사형으로
// 끝난다. 그대로 문장에 끼우면 '오늘 할 일은 성과를 모아두기예요' 가 된다. 사람이
// 쓰는 말이 아니다. 끝의 '기' 를 떼고 '~는 게 좋아요', '~는 건 피하는 게 나아요' 로 바꾼다.
//
// 전에는 '~세요', '~지 마세요' 로 바꿨다. 화면 문장 열에 넷이 시키는 말이 됐다.
// 토스 라이팅 원칙(강요 대신 제안)에 맞춰 권하는 말로 바꾼다.

const HANGUL = 0xac00;
const jong = (ch: string) => (ch.charCodeAt(0) - HANGUL) % 28;
const dropJong = (ch: string) => String.fromCharCode(ch.charCodeAt(0) - jong(ch));

function stemOf(item: string): string | null {
  const t = item.trim().replace(/[.]$/, '');
  return t.endsWith('기') && t.length > 1 ? t.slice(0, -1) : null;
}

// '~는' 을 붙일 꼴. ㄹ 받침은 떨어진다(만들 -> 만드는)
function withNeun(stem: string): string {
  const last = stem[stem.length - 1];
  return jong(last) === 8 ? `${stem.slice(0, -1)}${dropJong(last)}는` : `${stem}는`;
}

/** '모아두기' -> '모아두는 게 좋아요', '만들기' -> '만드는 게 좋아요' */
export function asDo(item: string): string {
  const stem = stemOf(item);
  if (!stem) return item.replace(/[.]?$/, '.');
  return `${withNeun(stem)} 게 좋아요.`;
}

/** '연락을 끊기' -> '연락을 끊는 건 피하는 게 나아요' */
export function asDont(item: string): string {
  const stem = stemOf(item);
  if (!stem) return item.replace(/[.]?$/, '.');
  return `${withNeun(stem)} 건 피하는 게 나아요.`;
}
