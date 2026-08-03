import type { LetterParts, Mood } from '../types/fortune';
import type { Variant } from '../data/resultTemplates';
import {
  CLOSINGS,
  EMPATHY,
  GREETINGS,
  KEEP_INTROS,
  SIGN,
  type TimeSlot,
} from '../data/letterFragments';

export function currentTimeSlot(date = new Date()): TimeSlot {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

// 직전과 같은 조각을 피해 뽑는다 (편지가 매번 다르게 느껴지도록).
// seed 는 항상 양수로 정규화해서 음수 인덱스(빈 문단) 버그를 막는다.
function pickFresh<T>(arr: T[], seed: number, storeKey: string): T {
  if (!arr || arr.length === 0) return '' as unknown as T;
  const s = Math.abs(Math.trunc(seed));
  let idx = s % arr.length;
  try {
    const last = window.localStorage.getItem(storeKey);
    if (arr.length > 1 && last !== null && Number.parseInt(last, 10) === idx) {
      idx = (idx + 1) % arr.length;
    }
    window.localStorage.setItem(storeKey, String(idx));
  } catch {
    /* localStorage 불가 시 seed 그대로 */
  }
  return arr[idx];
}

type ComposeInput = {
  mood: Mood;
  variant: Variant;
  seed: number;
  timeSlot?: TimeSlot;
  /** 결과와 같은 기분 풀에서 뽑은, 결과 본문과는 겹치지 않는 한 줄 */
  highlight: string;
  /** 실제로 계산된 행운 세트 — 결과 화면과 어긋나지 않게 하려고 받는다 */
  luckyLine: string;
};

// 위계가 있는 손편지 구조를 조합한다.
export function composeLetter({
  mood,
  variant,
  seed,
  timeSlot,
  highlight,
  luckyLine,
}: ComposeInput): LetterParts {
  const slot = timeSlot ?? currentTimeSlot();

  // 서로 다른 양의 소수로 나눠 각 섹션 인덱스를 탈상관시킨다 (음수 시프트 회피).
  const greeting = pickFresh(GREETINGS[slot], seed, `ltr:greet:${slot}`);
  const empathy = pickFresh(EMPATHY[mood], Math.floor(seed / 7), `ltr:emp:${mood}`);
  const keepIntro = pickFresh(KEEP_INTROS, Math.floor(seed / 29), 'ltr:keep');
  const closing = pickFresh(CLOSINGS[mood], Math.floor(seed / 53), `ltr:close:${mood}`);

  return {
    intro: `${greeting}
${empathy}`,
    // 예전엔 variant.pinpoint(정적 템플릿)을 써서 결과 본문의 콕집기와 따로 놀았다.
    // 이제 같은 기분 풀에서 뽑은 다른 한 줄을 받아 톤이 어긋나지 않는다.
    highlight,
    body: `${variant.summary[0]}
${variant.summary[1]}`,
    keepIntro,
    // 예전엔 variant.lucky(정적 문자열)라, 결과의 행운 보고서가 '저녁·분홍색'인데
    // 편지 부적은 '밤·남색'이라고 말하는 모순이 있었다. 이제 실제 계산값을 받는다.
    lucky: luckyLine,
    caution: variant.caution,
    closing,
    sign: SIGN,
  };
}
