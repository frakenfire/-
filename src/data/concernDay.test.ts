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

// 상황을 알고 나면 더 엄하게 잴 수 있다. '내 일을 해볼까 해요' 를 고른
// 사람에게 '채용 조건을 열어보기' 는 남의 얘기다. 부딪히는 칸은
// concernDayOverride.ts 가 덮는다. 여기서는 덮은 뒤에도 남았는지 본다.
const BY_SITUATION: Record<string, RegExp> = {
  'work/stay': /개업|사업|손님|매출|첫 자리/,
  'work/rest': /맡은|동료|같은 팀|사내|출근|승진|지금 회사|개업|사업|손님|매출/,
  'work/start': /승진|경력을|재직|이직|지금 회사|개업|사업|손님|매출/,
  'work/own': /지원(?!금)|채용|이력서|면접|입사|취업|합격|승진|이직|연봉/,
  // '다음 약속' 자체는 괜찮다. 전제하는 말은 '만나면'(이미 만나는 중) 쪽이다.
  'love/alone': /상대|사귀는|연인|우리 사이|만나면/,
  'love/some': /연인|우리 사이/,
  'love/couple': /소개받|새 사람/,
  'love/past': /사귀자|만나면/,
  'people/work': /가족/,
  'people/friend': /가족|동료/,
  'people/family': /동료|회사/,
  'people/new': /가족|오래 못 본|오래 안 본/,
};

test('상황마다 부딪히는 오늘 할 일이 없다', async () => {
  const { dayActOf } = await import('./concernDayOverride.ts');
  const { TEN_GOD_KO } = await import('../lib/tenGods.ts');
  const TEN_GODS = Object.keys(TEN_GOD_KO) as (keyof typeof TEN_GOD_KO)[];
  const bad: string[] = [];
  for (const c of CONCERNS) {
    for (const o of c.options) {
      const re = BY_SITUATION[`${c.key}/${o.key}`];
      if (!re) continue;
      for (const god of TEN_GODS) {
        const act = dayActOf(c.key, o.key, god);
        for (const [k, t] of Object.entries(act)) {
          const m = t.match(re);
          if (m) bad.push(`${c.key}/${o.key} ${god}.${k} [${m[0]}] ${t}`);
        }
      }
    }
  }
  assert.deepEqual(bad, [], `상황과 부딪히는 줄이 남아 있습니다:\n  ${bad.join('\n  ')}`);
});

test('덮는 칸은 원래 칸과 다른 말이다', async () => {
  const { dayActOf } = await import('./concernDayOverride.ts');
  const { TEN_GOD_KO } = await import('../lib/tenGods.ts');
  const TEN_GODS = Object.keys(TEN_GOD_KO) as (keyof typeof TEN_GOD_KO)[];
  let n = 0;
  for (const c of CONCERNS) {
    for (const o of c.options) {
      for (const god of TEN_GODS) {
        const a = dayActOf(c.key, o.key, god);
        const b = CONCERN_DAY[c.key][god];
        for (const k of ['doIt', 'avoid', 'hold'] as const) {
          if (a[k] !== b[k]) { n += 1; assert.ok(a[k].length > 8, `${c.key}/${o.key}: ${a[k]}`); }
        }
      }
    }
  }
  assert.equal(n, 9, `덮은 칸이 ${n}개예요`);
});
