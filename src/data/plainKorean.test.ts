import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DECADE_AREAS } from './decadeAreas.ts';

// 쉬운 우리말 네 가지.
//
// '내 몫과 남의 몫이 자주 섞이는 십 년이에요' 를 읽고 무슨 말인지 모르겠다는
// 말을 들었다. 맞는 말이다. 몫이 뭔지, 섞인다는 게 무슨 장면인지 안 나온다.
// 국립국어원 공공언어 지침과 쉬운 우리말 자료에서 가져온 규칙을 표로 박는다.
//
//   1) 동작을 명사로 바꾸지 않는다 ('몫을 나누는 법' -> '누가 얼마나 할지 정한다')
//   2) '것' 을 주어나 목적어로 쓰지 않는다
//   3) 장면이 안 그려지는 낱말을 쓰지 않는다 (몫·기회·조건·방식·구조·결)
//   4) 비유를 쓰지 않는다 (섞인다·깔린다·밀어놓는다)
//
// 지금은 십 년 표에만 건다. 화면에서 제일 추상적이던 자리라 여기부터 잡고,
// 다른 표로 넓히는 건 그 표를 손볼 때 같이 한다.

/** 3) 장면이 안 그려지는 낱말 */
const FOGGY = /몫|기회|여건|구조적|방식이|결이|흐름이|역량|가치관|마인드|밸런스/;
/** 4) 비유 */
const FIGURE = /섞이는|섞여|깔아|깔고|밀어놓|물꼬|발판|주춧돌|날개를|밑거름/;
/** 1) 동작을 명사로 굳힌 꼬리 */
const NOMINAL = /(연습|습관|힘|법|일|자세|태도|능력|마음가짐)이에요\.$/;

function lines(): { at: string; t: string }[] {
  const out: { at: string; t: string }[] = [];
  for (const [god, a] of Object.entries(DECADE_AREAS)) {
    for (const [k, t] of Object.entries(a)) out.push({ at: `${god}.${k}`, t });
  }
  return out;
}

test('장면이 안 그려지는 낱말을 쓰지 않는다', () => {
  const bad = lines().filter((x) => FOGGY.test(x.t));
  assert.deepEqual(bad.map((x) => `${x.at} ${x.t}`), []);
});

test('비유로 설명하지 않는다', () => {
  const bad = lines().filter((x) => FIGURE.test(x.t));
  assert.deepEqual(bad.map((x) => `${x.at} ${x.t}`), []);
});

test('숙제 줄은 명사로 끝내지 않고 무엇을 하라고 말한다', () => {
  // '나눌 몫을 먼저 정하는 힘이에요' 는 힘을 기르라는 건지 뭘 하라는 건지
  // 안 나온다. '누가 얼마나 할지 시작 전에 말로 정해두세요' 가 맞다.
  for (const [god, a] of Object.entries(DECADE_AREAS)) {
    assert.ok(!NOMINAL.test(a.task), `${god}: 명사로 끝나요 - ${a.task}`);
    assert.ok(/세요\.$/.test(a.task), `${god}: 뭘 하라는지 없어요 - ${a.task}`);
  }
});

test("'것' 을 주어로 쓰지 않는다", () => {
  const bad = lines().filter((x) => /(^|[.!?]\s)(그 )?것[이은]/.test(x.t));
  assert.deepEqual(bad.map((x) => `${x.at} ${x.t}`), []);
});

test('머리줄은 십 년에 무슨 일이 생기는지를 말한다', () => {
  for (const [god, a] of Object.entries(DECADE_AREAS)) {
    assert.ok(a.head.endsWith('십 년이에요.'), `${god}: ${a.head}`);
    // 무엇이 어떻게 되는지가 들어 있어야 한다. 이름만 붙인 머리줄을 막는다.
    assert.ok(/(늘어나|넓어지|올라가|답답해지|찾아오|게 되|오는|열어주|값을 하)/.test(a.head),
      `${god}: 무슨 일이 생기는지 없어요 - ${a.head}`);
  }
});
