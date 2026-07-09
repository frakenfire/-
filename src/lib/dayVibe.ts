import { hashSeed } from './dateSeed';

// 오늘의 기운 — 하루를 관통하는 키워드. 날짜만으로 결정(운세 종류·기분과 무관).
// 홈의 '오늘의 한 줄'과 모든 결과 화면에 똑같이 떠서, 홈→결과가 하나로 이어진다.
// (예전엔 홈 한 줄이 결과와 따로 놀아 "이게 뭐랑 연결되지?" 하는 단절이 있었음)

export type DayVibe = { word: string; emoji: string; line: string };

const VIBES: DayVibe[] = [
  { word: '정리', emoji: '🧹', line: '오늘은 새로 벌이기보다 하나씩 정리하면 잘 풀리는 날이에요.' },
  { word: '연결', emoji: '🤝', line: '오늘은 사람과의 연결에서 좋은 기운이 오는 날이에요.' },
  { word: '회복', emoji: '🌿', line: '오늘은 무리보다 나를 회복시키는 게 이득인 날이에요.' },
  { word: '기회', emoji: '✨', line: '오늘은 작은 기회 하나가 슬쩍 다가오는 날이에요.' },
  { word: '여유', emoji: '☕', line: '오늘은 속도를 늦출수록 더 많이 챙기는 날이에요.' },
  { word: '집중', emoji: '🎯', line: '오늘은 딱 하나에 집중하면 성과가 나는 날이에요.' },
  { word: '다정', emoji: '💗', line: '오늘은 먼저 건넨 다정함이 돌아오는 날이에요.' },
  { word: '도전', emoji: '🚀', line: '오늘은 평소 안 하던 작은 시도가 운을 깨우는 날이에요.' },
  { word: '안정', emoji: '🪴', line: '오늘은 익숙한 것에서 힘이 나오는 안정적인 날이에요.' },
  { word: '설렘', emoji: '🎈', line: '오늘은 사소한 것에서 기분 좋은 설렘이 오는 날이에요.' },
];

export function todayVibe(dateKey: string): DayVibe {
  return VIBES[hashSeed(`vibe|${dateKey}`) % VIBES.length];
}
