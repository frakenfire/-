import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateFortune } from './generateFortune.ts';
import { NOTES } from '../data/notes.ts';
import { parseBirth } from './birth.ts';

const BIRTH = parseBirth('1992-03-03', '20:00');
const base = {
  fortuneType: 'tomorrow' as const,
  mood: 'soso' as const,
  dateKey: '2026-09-17',
  zodiac: 'monkey' as const,
  star: null,
  birth: BIRTH,
};

test('같은 날 다른 쪽지를 뽑아도 점수는 그대로다', () => {
  const scores = NOTES.slice(0, 8).map((note) => generateFortune({ ...base, note }).luck.total);
  assert.equal(new Set(scores).size, 1, `점수가 ${[...new Set(scores)].join(', ')} 로 갈림`);
});

test('같은 날 다른 쪽지를 뽑아도 네 가지 운과 행운 요소가 그대로다', () => {
  const keys = NOTES.slice(0, 8).map((note) => {
    const { luck, detail } = generateFortune({ ...base, note });
    return [
      luck.categories.map((c) => `${c.key}:${c.score}`).join(','),
      luck.color.name,
      luck.number,
      luck.direction,
      luck.time,
      luck.food.name,
      luck.item,
      detail.match.good.id,
    ].join('|');
  });
  assert.equal(new Set(keys).size, 1);
});

test('날이 바뀌면 점수도 바뀐다', () => {
  const note = NOTES[0];
  const a = generateFortune({ ...base, note }).luck.total;
  const b = generateFortune({ ...base, note, dateKey: '2026-09-18' }).luck.total;
  const c = generateFortune({ ...base, note, dateKey: '2026-09-19' }).luck.total;
  assert.ok(new Set([a, b, c]).size >= 2, '사흘 내리 같은 점수면 날짜가 안 먹은 것');
});

test('사람이 다르면 같은 날이라도 점수가 갈린다', () => {
  const note = NOTES[0];
  const me = generateFortune({ ...base, note }).luck.total;
  const other = generateFortune({
    ...base,
    note,
    birth: parseBirth('1988-11-20', '06:30'),
    zodiac: 'dragon',
  }).luck.total;
  assert.notEqual(me, other);
});

test('쪽지가 다르면 읽는 말은 달라진다', () => {
  const texts = NOTES.slice(0, 6).map((note) => generateFortune({ ...base, note }).summaryLines.join(' '));
  assert.ok(new Set(texts).size >= 3, '쪽지를 바꿔도 문장이 거의 같으면 뽑는 의미가 없다');
});
