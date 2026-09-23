// 띠 관계 말이 읽는 자리와 단위가 맞는지.
//
// 한 벌로 쓰던 때는 이번 주 표에 '짝꿍 사이' 가 떴다. 화요일은 사이가 아니라
// 날이다. 반대로 띠 순위에는 '부딪히는 날' 이 떴다. 범띠는 날이 아니라 상대다.
// 두 벌로 나눈 뒤에도 한쪽에 말을 새로 넣다 보면 다시 섞인다. 그걸 막는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REL_GLOSS, REL_PAIR_GLOSS } from './saju.ts';

test('이번 주 표에 쓰는 말은 전부 하루를 가리킨다', () => {
  for (const [k, v] of Object.entries(REL_GLOSS)) {
    assert.ok(v.endsWith('날'), `${k}: ${v} — 날로 끝나야 해요`);
    assert.ok(!v.includes('사이'), `${k}: ${v} — 사이는 띠 순위 쪽 말이에요`);
  }
});

test('띠 순위에 쓰는 말은 전부 상대와의 사이를 가리킨다', () => {
  for (const [k, v] of Object.entries(REL_PAIR_GLOSS)) {
    assert.ok(v.endsWith('사이'), `${k}: ${v} — 사이로 끝나야 해요`);
    assert.ok(!v.endsWith('날'), `${k}: ${v} — 날은 이번 주 표 쪽 말이에요`);
  }
});

test('두 벌 다 무슨 일이 생기는지가 적혀 있다', () => {
  // '고집 겹침'·'살짝 긴장'·'밀당 기류'·'엇박 주의' 는 동사가 없었다.
  // 읽고 나면 그날 무엇이 어떻게 되는지를 모른다.
  const 동사꼴 = /(하는|되는|맞는|세는|부딪히는|엇갈리는|떠보는|조심할|비슷한|무난한|엇갈린|안 맞는|센|찰떡|짝꿍)/;
  for (const table of [REL_GLOSS, REL_PAIR_GLOSS]) {
    for (const [k, v] of Object.entries(table)) {
      assert.ok(동사꼴.test(v), `${k}: ${v} — 무엇이 어떻게 되는지를 적으세요`);
    }
  }
});

test('한 벌 안에서 같은 말이 두 번 나오지 않는다', () => {
  for (const table of [REL_GLOSS, REL_PAIR_GLOSS]) {
    const vs = Object.values(table);
    assert.equal(new Set(vs).size, vs.length, vs.join(' / '));
  }
});
