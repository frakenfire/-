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
