import { hashSeed } from './dateSeed';
import { TEMPLATES } from '../data/resultTemplates';

// 홈에서 0탭으로 받는 '오늘의 한 줄' — 첫 보상까지의 거리를 0으로 만든다.
// (탭 4번+로딩 전에 이탈하는 유저도 열자마자 가치를 받게)
// 42개 variant 의 share 문장 풀에서 날짜 seed 로 결정적으로 선택.

const LINES: string[] = Object.values(TEMPLATES)
  .flat()
  .map((v) => v.share);

export function dailyLine(dateKey: string): string {
  return LINES[hashSeed(`daily|${dateKey}`) % LINES.length];
}
