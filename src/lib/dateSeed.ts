// PRD §8.5 — 날짜 seed 기반 카드 노출.
// 같은 날에는 같은 3장이 노출되도록 결정적(deterministic) seed 를 쓴다.

/** YYYY-MM-DD (로컬 기준) */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 문자열 → 32bit 해시 (deterministic) */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — seed 로부터 0~1 난수 생성기를 만든다 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** items 에서 seed 기준으로 count 개를 중복 없이 뽑는다 */
export function pickBySeed<T>(items: T[], count: number, seed: number): T[] {
  const pool = [...items];
  const rand = seededRandom(seed);
  const picked: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
