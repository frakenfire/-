// 오늘 내 앞에 놓이는 쪽지 세 장을 고른다.
//
// 그동안은 (날짜 · 운세종류 · 기분) 만으로 골랐다. 생년월일을 받아놓고도 정작
// '뽑는 쪽지' 에는 한 글자도 반영하지 않아, 같은 날 같은 기분이면 온 국민이
// 똑같은 세 장을 받았다. 사주를 넣은 사람에게는 그게 제일 이상하게 느껴진다.
//
// 이제 두 가지가 달라진다.
//  (1) 생년월일이 시드에 들어가 세 장의 조합 자체가 사람마다 갈린다.
//  (2) 오늘 기운이 나에게 모자란 쪽이면 '나서는' 쪽지가, 넘치는 쪽이면 '쉬어가는'
//      쪽지가 더 자주 앞에 놓인다. 확률만 기울일 뿐 막지는 않는다 —
//      뽑기의 우연을 없애면 그건 더 이상 뽑는 게 아니다.
import type { Note } from '../types/fortune.ts';
import type { BirthInput } from './fourPillars.ts';
import { computeFourPillars } from './fourPillars.ts';
import { analyzeSaju } from './tenGods.ts';
import { dailyForMe } from './dailySaju.ts';
import { NOTE_DIRECTION, type NoteDirection } from '../data/noteDirection.ts';
import { hashSeed } from './dateSeed.ts';

export type NotePick = {
  notes: Note[];
  /** 사주가 반영됐는지 — 화면에서 근거를 밝히는 데 쓴다 */
  personal: boolean;
  /** 오늘 기울인 방향 (없으면 null) */
  leaning: NoteDirection | null;
};

/** 가중치를 준 목록에서 서로 다른 n 장을 결정적으로 고른다. */
function pickDistinct(pool: Note[], n: number, seed: number): Note[] {
  const out: Note[] = [];
  const taken = new Set<string>();
  let s = seed >>> 0;
  // 후보가 바닥나는 경우까지 고려해 넉넉히 돈다.
  for (let i = 0; i < pool.length * 4 && out.length < n; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0; // LCG — 시드만 같으면 항상 같은 순서
    const cand = pool[s % pool.length];
    if (taken.has(cand.id)) continue;
    taken.add(cand.id);
    out.push(cand);
  }
  return out;
}

export function pickNotesFor(
  all: Note[],
  count: number,
  args: {
    dateKey: string;
    fortuneType: string;
    mood: string;
    nonce: number;
    birth?: BirthInput | null;
  },
): NotePick {
  const { dateKey, fortuneType, mood, nonce, birth = null } = args;

  let leaning: NoteDirection | null = null;
  let birthKey = '';
  if (birth && dateKey) {
    birthKey = `${birth.year}-${birth.month}-${birth.day}-${birth.hour ?? 'x'}-${birth.minute ?? 0}`;
    const pillars = computeFourPillars(birth);
    const daily = dailyForMe(dateKey, pillars, analyzeSaju(pillars));
    // 오늘 기운이 모자란 쪽이면 나서는 쪽지를, 넘치는 쪽이면 쉬어가는 쪽지를 더 자주 놓는다.
    leaning = daily.fit === 'needed' ? 'push' : daily.fit === 'excess' ? 'hold' : null;
  }

  const seed = hashSeed(`notes|${dateKey}|${fortuneType}|${mood}|${nonce}|${birthKey}`);

  // 방향이 맞는 쪽지를 3배, 어느 쪽이든 어울리는 쪽지를 2배로 넣는다.
  // 반대 방향도 1배로 남겨둔다 — 아예 빼면 매일 같은 성격의 쪽지만 나온다.
  const pool: Note[] = [];
  for (const n of all) {
    const dir = NOTE_DIRECTION[n.id] ?? 'any';
    const weight = leaning === null ? 1 : dir === leaning ? 3 : dir === 'any' ? 2 : 1;
    for (let i = 0; i < weight; i += 1) pool.push(n);
  }

  return { notes: pickDistinct(pool, count, seed), personal: birth !== null, leaning };
}
