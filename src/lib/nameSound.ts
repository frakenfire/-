import type { Element } from './saju.ts';

/** 오행 상생 — 나무가 불을, 불이 흙을, 흙이 쇠를, 쇠가 물을, 물이 나무를 생한다 */
const GEN: Record<Element, Element> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

// 이름의 소리오행 (발음오행 / 음령오행).
//
// 성명학에서 한 이름을 보는 길은 셋이다. 소리(발음오행), 획수(수리오행),
// 뜻(자원오행). 이 앱은 한글 이름만 받으므로 소리오행만 쓴다. 한자를 안 받는데
// 획수를 세면 그건 계산이 아니라 짐작이다.
//
// 자음을 다섯 기운으로 나누는 배열은 이렇게 고정한다.
//   ㄱ ㅋ         나무
//   ㄴ ㄷ ㄹ ㅌ    불
//   ㅇ ㅎ         흙
//   ㅅ ㅈ ㅊ      쇠
//   ㅁ ㅂ ㅍ      물
//
// 이 배열을 SSOT 로 박아둔다. 훈민정음 원리로 ㅇㅎ 을 물로 보는 학파도 있는데,
// 한 화면에서 흙이라 하고 다음 화면에서 물이라 하면 그 순간 둘 다 못 믿을 말이
// 된다. 그래서 하나를 정하고 안 바꾼다.
//
// 보는 방법도 하나로 정한다. 성의 첫소리, 가운뎃자 첫소리, 끝자 첫소리를 차례로
// 대어 앞이 뒤를 생하면 순한 배열로 본다.

const CHO_ELEMENT: Record<string, Element> = {
  ㄱ: 'wood', ㄲ: 'wood', ㅋ: 'wood',
  ㄴ: 'fire', ㄷ: 'fire', ㄸ: 'fire', ㄹ: 'fire', ㅌ: 'fire',
  ㅇ: 'earth', ㅎ: 'earth',
  ㅅ: 'metal', ㅆ: 'metal', ㅈ: 'metal', ㅉ: 'metal', ㅊ: 'metal',
  ㅁ: 'water', ㅂ: 'water', ㅃ: 'water', ㅍ: 'water',
};

const CHO_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

/** 한 글자의 첫소리 자음. 한글이 아니면 null */
export function choseongOf(ch: string): string | null {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return CHO_LIST[Math.floor((code - 0xac00) / 588)];
}

export type NameSound = {
  /** 글자마다 첫소리와 그 기운 */
  letters: { ch: string; cho: string; el: Element }[];
  /** 이름 전체에 담긴 기운들 */
  elements: Element[];
  /** 앞 글자가 뒤 글자를 생하는 자리가 몇 군데인가 */
  flow: 'smooth' | 'mixed' | 'blocked';
  /** 이름이 가장 두껍게 실어 나르는 기운 */
  lead: Element;
};

/** 두 기운이 상극인가 (극하는 관계) */
function clashes(a: Element, b: Element): boolean {
  // 생하지도 같지도 않으면서, 상대를 이기는 쪽
  const beats: Record<Element, Element> = {
    wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
  };
  return beats[a] === b;
}

/**
 * 한글 이름을 소리오행으로 읽는다. 한글 두 글자 이상이 아니면 null.
 * (한 글자 이름은 배열을 볼 수 없어 흐름 판정이 성립하지 않는다)
 */
export function readNameSound(name: string): NameSound | null {
  const letters: { ch: string; cho: string; el: Element }[] = [];
  for (const ch of name.trim()) {
    const cho = choseongOf(ch);
    if (!cho) continue;
    const el = CHO_ELEMENT[cho];
    if (!el) continue;
    letters.push({ ch, cho, el });
  }
  if (letters.length < 2) return null;

  let gens = 0;
  let clash = 0;
  for (let i = 0; i + 1 < letters.length; i += 1) {
    const a = letters[i].el;
    const b = letters[i + 1].el;
    if (GEN[a] === b || a === b) gens += 1;
    else if (clashes(a, b) || clashes(b, a)) clash += 1;
  }
  const pairs = letters.length - 1;
  const flow: NameSound['flow'] = gens === pairs ? 'smooth' : clash >= pairs ? 'blocked' : 'mixed';

  // 가장 자주 나온 기운. 같으면 앞 글자 쪽을 쓴다.
  const tally = new Map<Element, number>();
  letters.forEach((l, i) => tally.set(l.el, (tally.get(l.el) ?? 0) + (i === 0 ? 1.1 : 1)));
  const lead = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];

  return { letters, elements: letters.map((l) => l.el), flow, lead };
}

export const FLOW_KO: Record<NameSound['flow'], string> = {
  smooth: '소리가 앞에서 뒤로 순하게 이어져요. 부를수록 편하게 읽히는 배열이에요.',
  mixed: '순하게 이어지는 자리도 있고 부딪히는 자리도 있어요. 흔한 배열이라 크게 볼 것은 아니에요.',
  blocked: '앞 글자와 뒤 글자가 서로 부딪히는 배열이에요. 이름이 뭘 더 보태주지는 않는 쪽이에요.',
};
