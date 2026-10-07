// '~하기' 로 끝나는 할 일 목록을 문장으로 바꾼다.
//
// 결정 카드의 할 것과 하지 말 것은 목록이라 '모아두기', '연락 끊기' 처럼 명사형으로
// 끝난다. 그대로 문장에 끼우면 '오늘 할 일은 성과를 모아두기예요' 가 된다. 사람이
// 쓰는 말이 아니다. 끝의 '기' 를 떼고 받침을 보아 '~세요', '~지 마세요' 로 바꾼다.

const HANGUL = 0xac00;
const jong = (ch: string) => (ch.charCodeAt(0) - HANGUL) % 28;
const dropJong = (ch: string) => String.fromCharCode(ch.charCodeAt(0) - jong(ch));

// ㄷ 불규칙(듣다, 걷다, 묻다, 싣다): 받침 ㄷ 이 ㄹ 로 바뀐다
const D_IRREGULAR = new Set(['듣', '걷', '묻', '싣']);

function stemOf(item: string): string | null {
  const t = item.trim().replace(/[.]$/, '');
  return t.endsWith('기') && t.length > 1 ? t.slice(0, -1) : null;
}

/** '모아두기' -> '모아두세요', '적기' -> '적으세요', '만들기' -> '만드세요', '듣기' -> '들으세요' */
export function asDo(item: string): string {
  const stem = stemOf(item);
  if (!stem) return item.replace(/[.]?$/, '.');
  // '보지 않기' 는 '보지 않으세요' 가 아니라 '보지 마세요' 다
  if (/지 않$/.test(stem)) return `${stem.replace(/지 않$/, '지')} 마세요.`;
  const last = stem[stem.length - 1];
  const head = stem.slice(0, -1);
  const j = jong(last);
  if (j === 0) return `${stem}세요.`;
  if (j === 8) return `${head}${dropJong(last)}세요.`; // ㄹ 탈락
  if (D_IRREGULAR.has(last)) return `${head}${String.fromCharCode(last.charCodeAt(0) - j + 8)}으세요.`;
  return `${stem}으세요.`;
}

/** '연락을 끊기' -> '연락을 끊지 마세요'. 이미 '안 ~기' 면 이중 부정이 되므로 '~는 피하세요' 로 */
export function asDont(item: string): string {
  const stem = stemOf(item);
  if (!stem) return item.replace(/[.]?$/, '.');
  // '안 ~기', '~지도 않기' 에 '~지 마세요' 를 붙이면 이중 부정이 된다
  if (/(^|\s)(안|못)\s/.test(stem) || /않$/.test(stem)) return `${stem}는 건 피하세요.`;
  return `${stem}지 마세요.`;
}
