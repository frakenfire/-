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
};

// 위계가 있는 손편지 구조를 조합한다.
export function composeLetter({ mood, variant, seed, timeSlot }: ComposeInput): LetterParts {
  const slot = timeSlot ?? currentTimeSlot();

  // 서로 다른 양의 소수로 나눠 각 섹션 인덱스를 탈상관시킨다 (음수 시프트 회피).
  const greeting = pickFresh(GREETINGS[slot], seed, `ltr:greet:${slot}`);
  const empathy = pickFresh(EMPATHY[mood], Math.floor(seed / 7), `ltr:emp:${mood}`);
  const keepIntro = pickFresh(KEEP_INTROS, Math.floor(seed / 29), 'ltr:keep');
  const closing = pickFresh(CLOSINGS[mood], Math.floor(seed / 53), `ltr:close:${mood}`);

  return {
    intro: `${greeting} ${empathy}`,
    highlight: variant.pinpoint,
    body: `${variant.summary[0]} ${variant.summary[1]}`,
    keepIntro,
    lucky: variant.lucky,
    caution: variant.caution,
    closing,
    sign: SIGN,
  };
}
