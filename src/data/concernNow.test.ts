import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONCERN_NOW } from './concernNow.ts';

// 한 화면에는 십 년·올해·이번 달이 한 줄씩 같이 온다. 서로 다른 십성 칸에서
// 뽑혀 오므로 칸끼리 같은 마디를 쓰면 화면에서 같은 말을 두 번 한 것처럼
// 읽힌다. 실제로 '금액을 정해요' 가 십 년 칸과 올해 칸에 같이 들어 있어
// 돈 화면에서 두 줄이 붙어 나왔다.
//
// 문법 마디까지 막으면 한국어가 어색해진다. 뜻을 담지 않는 마디만 적어둔다.
const GRAMMAR_OK = [
  '이 먼저 나',   // '~이 먼저 나가면/나가기'
  '는 시기예요',
  '는 게 좋아',
  '고 싶어지는',
  '는 편이 나',
  '편이 나아요',
];

function phrases(s: string, n: number): Set<string> {
  const t = s.replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
  const out = new Set<string>();
  for (let i = 0; i + n <= t.length; i += 1) {
    const g = t.slice(i, i + n);
    if (/^[가-힣 ]+$/.test(g) && !g.startsWith(' ') && !g.endsWith(' ')) out.add(g);
  }
  return out;
}

test('한 고민 안에서 십 년·올해·이번 달이 같은 마디를 쓰지 않는다', () => {
  const bad: string[] = [];
  for (const [concern, gods] of Object.entries(CONCERN_NOW)) {
    const cells: { where: string; text: string }[] = [];
    for (const [god, row] of Object.entries(gods)) {
      for (const [slot, text] of Object.entries(row)) cells.push({ where: `${god}.${slot}`, text });
    }
    const seen = new Map<string, string[]>();
    for (const c of cells) {
      for (const g of phrases(c.text, 6)) {
        if (!seen.has(g)) seen.set(g, []);
        seen.get(g)!.push(c.where);
      }
    }
    for (const [g, where] of seen) {
      const slots = new Set(where.map((w) => w.split('.')[1]));
      // 같은 슬롯끼리는 한 화면에 같이 안 나온다 - 서로 다른 슬롯일 때만 본다
      if (where.length > 1 && slots.size > 1 && !GRAMMAR_OK.includes(g)) {
        bad.push(`${concern} "${g}" ${where.join(' + ')}`);
      }
    }
  }
  assert.deepEqual(bad, [], `한 화면에 같이 뜰 수 있는 칸들이 같은 마디를 씁니다:\n  ${bad.join('\n  ')}`);
});

test('허용 목록이 실제로 쓰이고 있다', () => {
  // 안 쓰는 예외가 쌓이면 목록이 거짓말이 된다
  const all = Object.values(CONCERN_NOW)
    .flatMap((gods) => Object.values(gods).flatMap((row) => Object.values(row)))
    .join(' ');
  for (const g of GRAMMAR_OK) {
    assert.ok(all.includes(g), `허용 목록의 "${g}" 를 쓰는 문장이 없습니다 - 목록에서 빼세요`);
  }
});
