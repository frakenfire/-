// 조사 붙이기 — '돈은', '연애는' 처럼 받침에 따라 갈린다.
// 이름과 고민 이름이 문장에 들어가는 자리가 많아, 틀리면 바로 어색해진다.

function hasBatchim(word: string): boolean {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/**
 * kind 는 '받침 있을 때 + 없을 때' 순서다. 과/와 는 받침 있는 쪽이 '과' 라
 * '과와' 로 적는다. 순서를 뒤집으면 '오과 미가' 같은 말이 나온다.
 */
export function withJosa(word: string, kind: '은는' | '이가' | '을를' | '과와'): string {
  const [withB, withoutB] = [kind[0], kind[1]];
  return `${word}${hasBatchim(word) ? withB : withoutB}`;
}

/**
 * '으로 / 로'. 받침이 없거나 받침이 ㄹ 이면 '로', 나머지는 '으로'.
 *
 * '자리와 규칙' + '로' 를 그냥 이어 붙여 '자리와 규칙로 봐요' 가 화면에
 * 나가 있었다. 은는·이가 와 달리 이 조사는 ㄹ 받침이 예외라 withJosa 의
 * 두 글자 규칙으로는 안 된다.
 */
export function withRo(word: string): string {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return `${word}로`;
  const batchim = (code - 0xac00) % 28;
  // 8 = ㄹ
  return `${word}${batchim === 0 || batchim === 8 ? '로' : '으로'}`;
}
