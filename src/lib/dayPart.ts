// 하루를 세 토막으로 자르는 자 하나.
//
// 같은 자를 두 군데서 따로 쓰고 있었다. 홈 인사는 제 손으로 시각을 재서
// 오전·오후·저녁·밤을 갈랐고, 결과 화면의 '오늘의 풀이' 는 시각을 아예 안
// 보고 오전·오후·저녁 세 줄을 늘 함께 띄웠다. 그래서 아침 아홉 시에 열어도
// '오후엔 미뤄둔 답장 하나를 보내봐요' 가 나오고, 밤 아홉 시에 열어도
// '오후 세 시쯤 좋은 소식이 올 수 있어요' 가 나왔다. 이미 지나간 때를
// 오늘 할 일이라고 말하는 셈이다.
//
// 같은 문제를 행운의 시간에서는 이미 풀어 뒀다(luckyWhen.ts). 거기 적힌
// 규칙을 그대로 가져와 하루 토막에도 쓴다 - 지나간 토막은 지나갔다고 하고,
// 지금인 토막은 지금이라고 한다.
//
// 시각은 기기 시계를 쓴다. 날짜는 토스 서버 시각으로 받지만(getTrustedDateKey),
// '지금 몇 시냐' 는 쓰는 사람이 보고 있는 시계를 따르는 게 맞다. 한국이 아닌
// 곳에서 열었을 때 그 사람의 아침에 '저녁이에요' 라고 하면 안 된다.

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

/** 각 토막이 끝나는 시각. 밤은 다음 날 새벽 다섯 시까지 이어진다 */
const ENDS: { part: DayPart; end: number }[] = [
  { part: 'morning', end: 11 },
  { part: 'afternoon', end: 17 },
  { part: 'evening', end: 22 },
];

/** 지금이 하루의 어느 토막인가 */
export function dayPartOf(now: Date = new Date()): DayPart {
  const h = now.getHours();
  if (h < 5) return 'night';
  for (const { part, end } of ENDS) if (h < end) return part;
  return 'night';
}

/** 그 토막이 오늘 안에서 이미 지나갔는가. 밤은 지나갈 데가 없다 */
export function partPassed(part: DayPart, now: Date = new Date()): boolean {
  const row = ENDS.find((r) => r.part === part);
  if (!row) return false;
  const h = now.getHours();
  // 새벽 다섯 시 전은 아직 어제의 밤이다. 오늘 아침은 아직 안 지났다.
  if (h < 5) return false;
  return h >= row.end;
}
