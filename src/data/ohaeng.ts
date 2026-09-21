import type { Element } from '../lib/saju.ts';

// 다섯 기운마다 정해진 것들 — 방위, 숫자, 시각, 맛, 빛깔.
//
// 왜 이 표가 필요한가: 행운 여섯 칸(색·숫자·방향·시간·음식·물건) 중 다섯이
// 날짜 해시로 목록에서 뽑는 제비였다. 방향은 후보 일곱 중 하나, 시간은 여섯 중
// 하나, 숫자는 1~45 난수. 앱은 홈에서 "인공지능이 그때그때 지어내지 않아요.
// 그 규칙으로 점수를 매겨요" 라고 약속해놓고, 이 카드만 정반대였다.
//
// 그런데 이 다섯은 지어낼 필요가 없다. 예부터 기운마다 방위와 수와 시각과 맛이
// 정해져 있다. 오늘 나한테 힘이 되는 기운 하나만 정해지면 나머지는 전부 계산이다.
//
//   기운   방위   숫자    가장 센 시각        맛
//   나무   동     3·8     이른 아침(3~7시)    신맛
//   불     남     2·7     점심 무렵(9~13시)   쓴맛
//   흙     가운데 5·10    이른 오후(13~15시)  단맛
//   쇠     서     4·9     늦은 오후(15~19시)  매운맛
//   물     북     1·6     밤(21~1시)          짠맛
//
// 숫자는 하도(河圖)의 수다. 이 표는 관법 논쟁이 없는 고정값이라 여기 그대로 적는다.
// 어떤 기운을 '나한테 힘이 되는' 것으로 볼지는 별개 문제이고, 그건 saju.ts 가 정한다.
//
// 말은 초등학생이 읽어도 걸리지 않게 쓴다. 한자도, 어려운 말도 넣지 않는다.

export type OhaengFacts = {
  /** 나무 / 불 / 흙 / 쇠 / 물 */
  ko: string;
  /** 동쪽 / 남쪽 / 가운데 / 서쪽 / 북쪽 */
  direction: string;
  /** 왜 그 방향인지. 뒷말에 이어붙는 '~니까' 꼴로 적는다 */
  directionWhy: string;
  /** 이 기운에 붙는 두 숫자 */
  numbers: [number, number];
  /** 이 기운이 하루 중 가장 센 때 (luckyWhen 이 아는 여섯 구간 중 하나) */
  time: string;
  /** 왜 그 시각인지. 뒷말에 이어붙는 '~니까' 꼴로 적는다 */
  timeWhy: string;
  /** 이 기운의 맛 */
  taste: string;
  /** 그 맛에 드는 먹을거리 */
  foods: string[];
  /** 이 기운에 드는, 손에 쥘 수 있는 것 */
  items: string[];
  /** 빛깔을 한마디로 */
  colorWhy: string;
};

export const OHAENG: Record<Element, OhaengFacts> = {
  wood: {
    ko: '나무',
    direction: '동쪽',
    directionWhy: '해가 뜨는 쪽에서 제일 잘 자라니까',
    numbers: [3, 8],
    time: '이른 아침',
    timeWhy: '새벽에서 아침으로 넘어갈 때 제일 세니까',
    taste: '신맛',
    foods: ['푸른 잎채소', '오이', '레몬을 띄운 물', '사과'],
    items: ['작은 화분', '나무 연필', '천가방'],
    colorWhy: '어린잎 빛깔이에요.',
  },
  fire: {
    ko: '불',
    direction: '남쪽',
    directionWhy: '해가 가장 높이 뜨는 쪽에 모이니까',
    numbers: [2, 7],
    time: '점심 무렵',
    timeWhy: '해가 제일 높을 때 같이 세지니까',
    taste: '쓴맛',
    foods: ['쌉쌀한 나물', '따뜻한 커피', '구운 채소', '토마토'],
    items: ['빨간 펜', '따뜻한 컵', '작은 조명'],
    colorWhy: '불빛 빛깔이에요.',
  },
  earth: {
    ko: '흙',
    direction: '가운데',
    directionWhy: '한쪽에 치우치지 않고 가운데에 있으니까',
    numbers: [5, 10],
    time: '이른 오후',
    timeWhy: '해가 기울기 시작할 때 땅이 제일 따뜻하니까',
    taste: '단맛',
    foods: ['호박죽', '고구마', '누룽지', '단호박 샐러드'],
    items: ['도자기 컵', '작은 수첩', '손수건'],
    colorWhy: '잘 마른 흙 빛깔이에요.',
  },
  metal: {
    ko: '쇠',
    direction: '서쪽',
    directionWhy: '해가 지면서 하루를 거두는 쪽이니까',
    numbers: [4, 9],
    time: '늦은 오후',
    timeWhy: '해가 넘어가기 직전에 제일 세니까',
    taste: '매운맛',
    foods: ['무국', '마늘을 넣은 요리', '배', '생강차'],
    items: ['열쇠고리', '금속 텀블러', '작은 가위'],
    colorWhy: '깨끗하게 닦인 쇠 빛깔이에요.',
  },
  water: {
    ko: '물',
    direction: '북쪽',
    directionWhy: '해가 닿지 않는 쪽에 고이니까',
    numbers: [1, 6],
    time: '밤',
    timeWhy: '해가 다 진 뒤에 제일 세니까',
    taste: '짠맛',
    foods: ['미역국', '검은콩', '김', '따뜻한 두부'],
    items: ['보온병', '검은 노트', '작은 우산'],
    colorWhy: '깊은 물 빛깔이에요.',
  },
};

/**
 * 여섯 칸이 왜 그렇게 나왔는지 풀어 쓴다.
 *
 * 칸에는 답만 적고, 이유는 여기 한 덩이로 모은다. 칸마다 한 줄씩 붙이면
 * 여섯 줄이 각자 떠들어서 정작 답이 안 읽힌다.
 *
 * 줄바꿈을 직접 넣는다. 다섯 문장을 한 덩이로 붙여두면 벽이 되어서,
 * 눈이 어디서 끊어 읽을지를 못 찾는다.
 *
 * where/when 은 고른 고민의 말이다. 돈을 물은 사람에게 '중요한 건 늦은 오후에'
 * 라고만 하면, 위에서 촘촘히 돈 얘기를 하다가 아래로 갈수록 아무 고민에나
 * 똑같이 붙는 말로 바뀐다. 고민을 골랐으면 끝까지 그 고민의 말로 말한다.
 */
export function ohaengWhy(
  boost: Element,
  colorName: string,
  concern?: { luckyWhere: string; luckyWhen: string },
): string {
  const f = OHAENG[boost];
  const hasBatchim = (w: string) => /[가-힣]$/.test(w)
    && (w.charCodeAt(w.length - 1) - 0xac00) % 28 !== 0;
  // 숫자는 소리로 읽어서 받침을 본다. 2(이)·4(사)·5(오)·9(구)는 받침이 없어
  // '와', 1(일)·3(삼)·6(육)·7(칠)·8(팔)·10(십)은 '과'. '2과 7' 이라고 적으면
  // 계산이 맞아도 읽는 사람은 대충 만든 글로 본다.
  const numJosa = [2, 4, 5, 9].includes(f.numbers[0]) ? '와' : '과';
  const dirLine = concern
    ? `${f.directionWhy} ${f.direction}이 ${concern.luckyWhere}이에요.`
    : `${f.directionWhy} ${f.direction}${hasBatchim(f.direction) ? '이' : '가'} 오늘 내 자리예요.`;
  const timeLine = concern
    ? `${f.timeWhy} ${concern.luckyWhen} ${f.time}에 놓으면 수월해요.`
    : `${f.timeWhy} 중요한 건 ${f.time}에 놓으면 수월해요.`;
  // 기운 이름은 첫 문장에서 한 번만 부른다. 문장마다 '쇠 기운' 을 되풀이하면
  // 다섯 줄이 같은 말을 네 번 하는 것처럼 읽힌다.
  return [
    `오늘 나한테 힘이 되는 건 ${f.ko} 기운이에요.`,
    dirLine,
    timeLine,
    `붙는 숫자는 ${f.numbers[0]}${numJosa} ${f.numbers[1]}, 빛깔은 ${colorName}이에요. 먹는 건 ${f.taste}이 드는 쪽이 좋아요.`,
    // 여섯 칸이 어제와 같은 이유를 먼저 말해준다. 안 말하면 '왜 안 바뀌지' 가 남는다.
    '이건 내 여덟 글자에서 제일 모자란 기운이라 날마다 바뀌지 않아요. 오늘 바뀐 건 빛깔이에요.',
  ].join('\n');
}
