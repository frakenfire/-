import type { FortuneResult, FortuneType, Note } from '../types/fortune';
import { hashSeed } from './dateSeed';
import { computeLuck } from './luck';
import { FORTUNE_LABEL } from '../data/fortuneTypes';
import { NOTE_LEAD, TEMPLATES } from '../data/resultTemplates';

// PRD §12 — 결과 생성 로직.
// AI API 없이 (fortuneType + note + dateSeed) 조합으로 결정적 결과를 만든다.

export type FortuneInput = {
  fortuneType: FortuneType;
  note: Note;
  dateKey?: string;
};

export function generateFortune(input: FortuneInput): FortuneResult {
  const { fortuneType, note, dateKey = '' } = input;
  const seed = hashSeed(`${dateKey}|${fortuneType}|${note.id}`);

  const variants = TEMPLATES[fortuneType];
  const variant = variants[seed % variants.length];

  const lead = NOTE_LEAD[note.id] ?? '오늘의 쪽지가 도착했어요.';
  const luck = computeLuck(seed);

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
  };
}
