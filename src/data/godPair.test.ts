import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONCERN_GOD } from './concernReadings.ts';
import { CONCERNS } from './concerns.ts';

// 한 화면에 같이 그려지는 칸끼리는 같은 말을 하면 안 된다.
//
//   act  x good : 언제 표의 '이 달에 할 일'(act) 과, 점수 해설·열두 달 카드의
//                 '이때 잘 되는 것'(good) 이 결과 화면에 같이 있다. 이번 달 글자는
//                 열두 달 표에도 반드시 들어 있으니 같은 십신의 두 칸이 한 화면에
//                 같이 뜨는 건 우연이 아니라 매달 일어난다.
//   pull x line : 근거 줄의 '...으로 읽었어요'(pull) 와 오늘 글자 카드(line) 가
//                 둘 다 오늘 십신을 쓴다. 역시 매일 같이 뜬다.
//
// 재보니 이 두 쌍에서 19곳이 글자 그대로 같은 말을 두 번 하고 있었다.
// 다른 쌍(month 가 pull 을 품는 것 등)은 한 화면에 같이 안 뜨거나 일부러 겹친 것이다.
const 같은말_길이 = 7;

const 겹친조각 = (a: string, b: string): string | null => {
  const x = a.replace(/[^가-힣]/g, '');
  const y = b.replace(/[^가-힣]/g, '');
  for (let i = 0; i + 같은말_길이 <= x.length; i += 1) {
    const piece = x.slice(i, i + 같은말_길이);
    if (y.includes(piece)) return piece;
  }
  return null;
};

test('한 화면에 같이 뜨는 칸이 같은 말을 두 번 안 한다', () => {
  const 겹침: string[] = [];
  for (const concern of CONCERNS) {
    const gods = CONCERN_GOD[concern.key];
    for (const [god, cell] of Object.entries(gods)) {
      for (const [a, b] of [
        ['act', 'good'],
        ['pull', 'line'],
      ] as const) {
        const piece = 겹친조각(cell[a], cell[b]);
        if (piece) 겹침.push(`${concern.key}/${god} ${a} x ${b} [${piece}]`);
      }
    }
  }
  assert.deepEqual(겹침, []);
});

test('겹침을 찾아내는 눈이 살아 있다', () => {
  // 일부러 같은 말을 넣으면 걸려야 한다.
  assert.equal(겹친조각('세금과 갚을 돈을 먼저 정리해요', '세금과 갚을 돈을 먼저 정리하는 것'), '세금과갚을돈을');
  // 짧게 스치는 말은 안 걸려야 한다. 안 그러면 쓸 수 있는 말이 남지 않는다.
  assert.equal(겹친조각('오늘 잘 시간을 정해두고 알람을 맞춰요', '같은 시간에 자고 일어나는 것'), null);
});
