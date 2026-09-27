import { OHAENG } from '../data/ohaeng.ts';

// 행운의 시간은 '앞으로 올 시간' 이어야 한다.
//
// 밤 열한 시에 '늦은 오후' 라고 띄우면 이미 지나간 때를 오늘의 행운이라고 말하는 셈이다.
// 뽑기 결과 자체는 그대로 두고, 화면에 낼 때만 지나갔는지 표시한다.
//
// 끝 시각을 여기 따로 적어두다가 오행 표와 갈라졌다. 화면에 뜨는 시각은
// OHAENG 의 time 인데 여기 표에는 '이른 오후' 가 없었고, 그래서 흙이 용신인
// 사람은 몇 시에 열든 늘 '이른 오후' 를 봤다. 이제 끝 시각은 OHAENG 에서
// 그대로 읽는다. luckyWhen.test 가 다섯 가지가 다 있는지 센다.
const FROM_OHAENG: Record<string, number> = Object.fromEntries(
  Object.values(OHAENG).map((o) => [o.time, o.timeEnd]),
);

// 생년월일이 없어 용신을 못 고를 때 쓰는 무작위 여섯 구간에만 있는 말.
// (luck.ts 의 TIMES)
const EXTRA: Record<string, number> = { 오전: 11, 저녁: 21 };

export const SLOT_END: Record<string, number> = { ...FROM_OHAENG, ...EXTRA };

export type LuckyWhen = { label: string; passed: boolean };

/** 지금 시각 기준으로 그 시간대가 지났는지 함께 돌려준다 */
export function luckyWhen(time: string, now: Date = new Date()): LuckyWhen {
  const end = SLOT_END[time];
  if (end === undefined) return { label: time, passed: false };
  const passed = now.getHours() >= end;
  return { label: passed ? `내일 ${time}` : time, passed };
}
