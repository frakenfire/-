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
