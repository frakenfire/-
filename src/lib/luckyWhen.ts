// 행운의 시간은 '앞으로 올 시간' 이어야 한다.
//
// 밤 열한 시에 '늦은 오후' 라고 띄우면 이미 지나간 때를 오늘의 행운이라고 말하는 셈이다.
// 뽑기 결과 자체는 그대로 두고, 화면에 낼 때만 지나갔는지 표시한다.

/** luck.time 이 쓰는 여섯 구간과 각 구간이 끝나는 시각 */
const SLOT_END: Record<string, number> = {
  '이른 아침': 8,
  오전: 11,
  '점심 무렵': 14,
  '늦은 오후': 18,
  저녁: 21,
  밤: 24,
};

export type LuckyWhen = { label: string; passed: boolean };

/** 지금 시각 기준으로 그 시간대가 지났는지 함께 돌려준다 */
export function luckyWhen(time: string, now: Date = new Date()): LuckyWhen {
  const end = SLOT_END[time];
  if (end === undefined) return { label: time, passed: false };
  const passed = now.getHours() >= end;
  return { label: passed ? `내일 ${time}` : time, passed };
}
