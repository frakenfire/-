import type { FortuneResult, FortuneType, Mood, Note } from '../types/fortune';
import { hashSeed } from './dateSeed';
import { computeLuck } from './luck';
import { computeDetail } from './detail';
import { composeLetter } from './letter';
import { computeRarity, RARITY_LINE } from './rarity';
import { FORTUNE_LABEL } from '../data/fortuneTypes';
import { NOTE_LEAD, TEMPLATES } from '../data/resultTemplates';
import { PLANS, moodGroup } from '../data/dayDesign';
import { pickFreshIndex } from './pickFresh';
import {
  AFTERNOON_READINGS,
  EVENING_READINGS,
  GRADE_READING,
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
};

export function generateFortune(input: FortuneInput): FortuneResult {
  const { fortuneType, note, mood, dateKey = '' } = input;
  const seed = hashSeed(`${dateKey}|${fortuneType}|${note.id}|${mood}`);

  const variants = TEMPLATES[fortuneType];
  const variant = variants[pickFreshIndex(seed, variants.length, `tpl:${fortuneType}`)];

  const lead = NOTE_LEAD[note.id] ?? '오늘의 쪽지가 도착했어요.';
  const luck = computeLuck(seed);
  const detail = computeDetail(seed, luck);
  const rarity = computeRarity(seed);
  const letter = composeLetter({ mood, variant, seed });

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
  const isMonth = fortuneType === 'month';
  const pickReading = (arr: string[], div: number, key: string) =>
    arr[pickFreshIndex(Math.abs(Math.trunc(seed / div)), arr.length, key)];
  const reading = {
    overall: `${GRADE_READING[luck.grade] ?? GRADE_READING['평']}
${variant.flow}`,
    // month 타입은 초반/중순/월말 풀로, 나머지는 오전/오후/저녁 풀로.
    morning: pickReading(isMonth ? MONTH_EARLY_READINGS : MORNING_READINGS, 3, `read:morning:${isMonth}`),
    afternoon: pickReading(isMonth ? MONTH_MID_READINGS : AFTERNOON_READINGS, 11, `read:afternoon:${isMonth}`),
    evening: pickReading(isMonth ? MONTH_LATE_READINGS : EVENING_READINGS, 17, `read:evening:${isMonth}`),
    people: pickReading(PEOPLE_READINGS, 23, 'read:people'),
    mind: pickReading(MIND_READINGS, 31, 'read:mind'),
    scale: (isMonth ? 'month' : 'day') as 'day' | 'month',
  };

  return {
    title: FORTUNE_LABEL[fortuneType],
    subtitle: `${note.name} 쪽지`,
    pinpoint: variant.pinpoint,
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
