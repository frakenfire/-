import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONCERN_DAY } from './concernDay.ts';
import { CONCERNS } from './concerns.ts';

// '오늘은 이렇게' 는 고민과 그날 기운으로만 뽑는다. 고른 상황은 안 본다.
// 그건 그대로 두되(상황까지 곱하면 이백마흔 칸이 된다), 어느 상황에서 읽어도
// 말이 되게 써야 한다. 전에는 '지금은 쉬는 중이에요' 를 고른 사람에게
// '내가 맡은 범위를 문서로 한 장 정리해두기' 가 나갔다. 맡은 일이 없다.
//
// 그래서 '그 상황인 사람만 할 수 있는 말' 을 막는다.
const ASSUMES: Record<string, { re: RegExp; why: string }> = {
  // 직장에 다니는 사람만 쓸 수 있는 말. 쉬는 중·첫 자리·내 일 에는 안 맞는다.
  work: { re: /동료|같은 팀|상사|사내|부서|출근|퇴근|결재|퇴사|맡은 범위|내 몫이 아닌/, why: '다니는 사람만 할 수 있는 말' },
  // 만나는 사람이 있어야만 되는 말. 혼자·끝난 사이 에는 안 맞는다.
  love: { re: /상대|애인|남자친구|여자친구|둘이서/, why: '만나는 사람이 있어야 되는 말' },
  money: { re: /월급날|직장/, why: '직장인만 되는 말' },
  people: { re: /^$/, why: '' },
  health: { re: /출근|퇴근/, why: '직장인만 되는 말' },
  mind: { re: /^$/, why: '' },
};

test('오늘 할 일이 어느 상황에서 읽어도 말이 된다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) {
    const rule = ASSUMES[c.key];
    if (rule.re.source === '^$') continue;
    for (const [god, act] of Object.entries(CONCERN_DAY[c.key])) {
      for (const [k, t] of Object.entries(act)) {
        const m = t.match(rule.re);
        if (m) bad.push(`${c.key}.${god}.${k} [${m[0]}] ${rule.why} — ${t}`);
      }
    }
  }
  assert.deepEqual(bad, [], `상황을 전제한 줄이 남아 있습니다:\n  ${bad.join('\n  ')}`);
});

test('예순 칸이 다 차 있고 서로 다른 말이다', () => {
  const all: string[] = [];
  for (const c of CONCERNS) {
    const byGod = CONCERN_DAY[c.key];
    assert.equal(Object.keys(byGod).length, 10, `${c.key}: 십신 열 개가 아니에요`);
    for (const [god, act] of Object.entries(byGod)) {
      for (const [k, t] of Object.entries(act)) {
        // hold 는 '오늘은 미뤄도 돼요' 목록이라 짧은 명사구가 맞다.
        assert.ok(t.length >= 7, `${c.key}.${god}.${k} 너무 짧아요: ${t}`);
        all.push(`${c.key}|${t}`);
      }
    }
  }
  assert.equal(all.length, 180);
  assert.equal(new Set(all).size, 180, '한 고민 안에서 같은 말을 두 번 써요');
});
