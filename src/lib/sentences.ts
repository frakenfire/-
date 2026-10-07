// 문장이 끝나면 줄을 바꾼다.
//
// 긴 설명을 한 덩이로 흘리면 어디서 끊어 읽어야 할지 몰라 전부 흘려 읽는다.
// 마침표를 기준으로 잘라 한 문장씩 줄을 차지하게 하면, 읽는 사람이 한 번에
// 한 가지만 받아들이면 된다. 마침표는 그대로 둔다.
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

// 화면에 그릴 줄 묶음. 문장마다 끊으면 두세 문장짜리 칸이 시처럼 세로로 늘어서서
// 읽기 싫다는 말을 들었다(사장님). 줄은 뜻이 바뀌는 자리에서만 바꾼다 -
// '그래서, 다만, 한편' 처럼 앞 문장을 받아 방향을 트는 말 앞. 나머지는 이어 흐른다.
const TURN = /^(그래서|다만|그런데|하지만|반대로|한편|그럼에도|실제로|대신|그러면|그래도|그러니)/;

export function lineGroups(text: string): string[] {
  const out: string[] = [];
  for (const s of splitSentences(text)) {
    if (out.length === 0 || TURN.test(s)) out.push(s);
    else out[out.length - 1] = `${out[out.length - 1]} ${s}`;
  }
  return out;
}
