import type { FortuneResult, FortuneType, Mood, Note } from '../types/fortune';
import type { ZodiacId } from '../data/zodiac';
import type { StarSignId } from '../data/starSign';
import { findZodiac } from '../data/zodiac';
import { findStarSign } from '../data/starSign';
import { ZODIAC_TRAIT, STAR_TRAIT } from '../data/traits';
import { hashSeed } from './dateSeed';
import { computeLuck, luckBandForTone } from './luck';
import { sajuToday } from './saju';
import { computeDetail } from './detail';
import { composeLetter } from './letter';
import { computeRarity, RARITY_LINE } from './rarity';
import { FORTUNE_LABEL } from '../data/fortuneTypes';
import { NOTE_LEAD, TEMPLATES } from '../data/resultTemplates';
import { MOOD_PINPOINT, MOOD_MIND } from '../data/moodEcho';
import { PLANS, moodGroup } from '../data/dayDesign';
import { pickFreshIndex } from './pickFresh';
import {
  AFTERNOON_READINGS,
  EVENING_READINGS,
  GRADE_READING,
  GRADE_READING_MONTH,
  MIND_READINGS,
  MONTH_EARLY_READINGS,
  MONTH_LATE_READINGS,
  MONTH_MID_READINGS,
  MORNING_READINGS,
  PEOPLE_READINGS,
} from '../data/readings';

// PRD §12 — 결과 생성 로직.
// AI API 없이 (fortuneType + note + mood + dateSeed) 조합으로 결정적 결과를 만든다.

export type FortuneInput = {
  fortuneType: FortuneType;
  note: Note;
  mood: Mood;
  dateKey?: string;
  zodiac?: ZodiacId | null; // 내 띠 (있으면 결과를 개인화)
  star?: StarSignId | null; // 내 별자리 (있으면 결과를 개인화)
};

// 띠 × 별자리 → "직진하는 범띠 × 화려한 사자자리인 당신" 한 줄.
// 둘 중 하나만 있어도 그 부분만 만든다. 없으면 undefined.
function buildPersona(zodiac?: ZodiacId | null, star?: StarSignId | null): string | undefined {
  const z = zodiac ? findZodiac(zodiac) : undefined;
  const s = star ? findStarSign(star) : undefined;
  const parts: string[] = [];
  if (z) parts.push(`${ZODIAC_TRAIT[zodiac as ZodiacId]} ${z.emoji}${z.label}`);
  if (s) parts.push(`${STAR_TRAIT[star as StarSignId]} ${s.emoji}${s.label}`);
  if (parts.length === 0) return undefined;
  return `${parts.join(' × ')}인 당신에게`;
}

export function generateFortune(input: FortuneInput): FortuneResult {
  const { fortuneType, note, mood, dateKey = '', zodiac = null, star = null } = input;
  // 기분 + 띠 + 별자리까지 seed 에 넣어, 세 조합으로 결과가 갈라지게 한다.
  const seed = hashSeed(`${dateKey}|${fortuneType}|${note.id}|${mood}|${zodiac ?? ''}|${star ?? ''}`);
  const persona = buildPersona(zodiac, star);

  const variants = TEMPLATES[fortuneType];
  const variant = variants[pickFreshIndex(seed, variants.length, `tpl:${fortuneType}`)];

  const lead = NOTE_LEAD[note.id] ?? '오늘의 쪽지가 도착했어요.';
  // 오늘 일진×내 띠 사주 — 띠가 있으면 사주 톤이 총운의 구간을 정한다(로직 일관성).
  // 띠를 안 골랐으면 근거가 없으므로 전 구간(65~99)을 그대로 쓴다.
  const saju = zodiac && dateKey ? sajuToday(dateKey, zodiac) : null;
  const luck = computeLuck(seed, saju ? luckBandForTone(saju.tone) : undefined);
  // 행운 색을 사주 개운 컬러로 연결 — 띠를 알면 색이 랜덤이 아니라
  // '내 오행을 생해주는 오행(인성)'의 오방색에서 나온다. 매일의 색에 근거가 생긴다.
  if (saju) luck.color = saju.luckyColor;
  const detail = computeDetail(seed, luck, zodiac);
  const rarity = computeRarity(seed);

  // 콕 집은 한마디 — '어떻게 알았지'의 핵심. 방금 고른 기분을 되읽는 전용 풀에서.
  const isMonth = fortuneType === 'month';
  const moodPool = MOOD_PINPOINT[mood] ?? [variant.pinpoint];
  // '이번 달의 나'는 월간 리포트라 기분 풀(4분의 3이 '오늘/하루'로 쓰여 있다)을 그대로
  // 쓰면 "오늘이 그런 쪽이에요" 가 월간 화면 맨 위에 박힌다. 월간은 월간 문장으로.
  // 회피 이력은 기분 풀에 대해 한 번만 갱신한다(키 하나 = 풀 하나).
  const moodIdx = pickFreshIndex(Math.abs(Math.trunc(seed / 7)), moodPool.length, `pin:${mood}`);
  // 편지는 어떤 주제로 뽑았든 '오늘 쓴 편지'라 기분 풀을 그대로 쓰되,
  // 본문에 나온 한마디와는 다른 줄을 골라 같은 문장이 두 번 보이지 않게 한다.
  const letterHighlight =
    moodPool.length > 1
      ? moodPool[(moodIdx + 1 + (Math.abs(seed) % (moodPool.length - 1))) % moodPool.length]
      : moodPool[moodIdx];
  const pinpoint = isMonth ? variant.pinpoint : moodPool[moodIdx];

  // 편지의 '오늘의 부적'은 실제 계산된 행운 세트를 쓴다 (결과 보고서와 같은 값).
  const letter = composeLetter({
    mood,
    variant,
    seed,
    highlight: letterHighlight,
    luckyLine: `${luck.time}, ${luck.color.name}, ${luck.item}`,
  });

  // 운세 종류(주제·시간척도) × 상태(회복/그라운딩/실행)로 오늘의 설계를 고른다.
  // 결과의 주인공이라 직전과 같은 설계가 연달아 나오지 않게 별도로 회피한다.
  const state = moodGroup(mood);
  const cell = PLANS[fortuneType][state];
  const planSeed = Math.abs(Math.trunc(seed / 13));
  const dayPlan = cell[pickFreshIndex(planSeed, cell.length, `plan:${fortuneType}:${state}`)];

  // 에픽 이상이면 요정의 특별 한마디를 편지에 담는다.
  const rarityLine = RARITY_LINE[rarity.tier];
  if (rarityLine) letter.special = rarityLine;

  // 행동 처방: lucky("타이밍 · 색 · 행동")에서 행동을 분리해 DO 목록으로.
  const luckyParts = variant.lucky.split(' · ');
  const luckyAction = luckyParts[luckyParts.length - 1];
  const luckyHint = luckyParts.slice(0, -1).join(' · ');
  const dos = [luckyAction, variant.good];
  const dont = variant.caution;

  // 하루 풀이: 등급 해설 + 시간대·사람·마음 해석을 seed 로 조합.
  // 서로 다른 소수로 나눠 섹션 간 조합이 매일 갈라지게 하고, 섹션마다
  // 직전과 다른 문장이 나오도록 독립된 회피 이력을 둔다.
  const pickReading = (arr: string[], div: number, key: string) =>
    arr[pickFreshIndex(Math.abs(Math.trunc(seed / div)), arr.length, key)];
  const reading = {
    overall: `${(isMonth ? GRADE_READING_MONTH : GRADE_READING)[luck.grade] ?? GRADE_READING['평']}
${variant.flow}`,
    // month 타입은 초반/중순/월말 풀로, 나머지는 오전/오후/저녁 풀로.
    morning: pickReading(isMonth ? MONTH_EARLY_READINGS : MORNING_READINGS, 3, `read:morning:${isMonth}`),
    afternoon: pickReading(isMonth ? MONTH_MID_READINGS : AFTERNOON_READINGS, 11, `read:afternoon:${isMonth}`),
    evening: pickReading(isMonth ? MONTH_LATE_READINGS : EVENING_READINGS, 17, `read:evening:${isMonth}`),
    people: pickReading(PEOPLE_READINGS, 23, 'read:people'),
    // 마음 관리 — 방금 고른 기분 전용 풀(무드 에코). 기분마다 회피 이력을 분리.
    mind: pickReading(MOOD_MIND[mood] ?? MIND_READINGS, 31, `read:mind:${mood}`),
    scale: (isMonth ? 'month' : 'day') as 'day' | 'month',
  };


  return {
    title: FORTUNE_LABEL[fortuneType],
    subtitle: `${note.name} 쪽지`,
    persona,
    saju,
    pinpoint,
    summaryLines: [lead, variant.summary[0], variant.summary[1]],
    detailFlow: variant.flow,
    goodPoint: variant.good,
    caution: variant.caution,
    luckyPoint: variant.lucky,
    shareLine: variant.share,
    luck,
    letter,
    rarity,
    dos,
    dont,
    luckyHint,
    reading,
    dayPlan,
    detail,
  };
}
