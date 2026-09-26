import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFourPillars } from './fourPillars.ts';
import { computeTiming } from './timing.ts';
import { buildDeepRead } from './deepRead.ts';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';
import { CONCERN_GOD } from '../data/concernReadings.ts';
import { TEN_GOD_KO, type TenGod } from './tenGods.ts';
import { withJosa } from './josa.ts';

const TEN_GODS = Object.keys(TEN_GOD_KO) as TenGod[];

// 돈을 물었는데 '안으로 파고드는 달이라 정리하고 배우기 좋아요' 가 나왔다.
// 돈 얘기가 한 마디도 없다. 재보니 화면 문장의 30%만 고민 단어를 쓰고 있었다.
// 원인은 GOD_SCALE / GOD_PULL 이 고민을 안 보고 십성만 보고 쓴 문장이라는 것.
// 고민별로 다시 쓴 뒤 78%. 이 테스트가 다시 내려가는 걸 막는다.
const WORD: Record<ConcernKey, RegExp> = {
  work: /일|직장|회사|이직|연봉|자리|직책|경력|면접|계약|업무|성과|상사|팀|승진|이력|평가|보고|포트폴리오|독립|지원|합격|자격|기술|담당|결과물|과제|메일|미팅|추천|문서|범위/,
  money: /돈|수입|지출|저축|투자|고정비|할부|구독|연봉|금액|값|비용|이자|빚|예산|자산|계좌|카드|환급|지원금|부업|외주|원금|결제|저금|거래처|상품|조건|더치|몫|이체/,
  love: /연애|마음|만남|사이|연락|고백|헤어|데이트|상대|애인|썸|결혼|동거|소개|인연|친구|사람|관계|서운|약속/,
  people: /사람|사이|관계|말|거리|모임|친구|동료|가족|연락|부탁|인연|거절|소개|몫|선|역할|모임|스터디/,
  health: /몸|건강|잠|밥|운동|피로|컨디션|병원|쉬|무리|체력|검진|통증|진료|먹|강도|약속|일정|검색|기록|취침|기상/,
  mind: /마음|기분|생각|불안|걱정|쉬|여유|감정|스트레스|잠|취미|기준|속|말|하루|취미|규칙|시간|자극/,
};

// 생년월일 하나로만 화면을 그리면 그 사람의 십성·밴드에 걸린 문장만 나온다.
// 실제로 재보니 문구 삼백 개 중 백열 개(37퍼센트)만 화면에 닿았고, 결정 카드는
// 스물네 칸 중 여섯 칸만 닿았다. 나머지는 한 번도 안 보고 통과시키고 있었다.
// (지난 사이클에 조사 버그를 일부러 되돌려 넣었는데도 테스트가 통과한 이유다)
//
// 생년과 성별을 흩고 날짜도 여섯 개로 나눈다. 대운은 태어난 해·달·성별로
// 갈리고, 이번 달 십성은 보는 날짜로 갈리기 때문에 둘 다 흔들어야 한다.
// 스물네 명이면 98퍼센트가 닿는다. 0.3초면 돈다.
const DATES = ['2026-01-15', '2026-03-20', '2026-05-11', '2026-07-02', '2026-09-21', '2026-11-08'];
const PEOPLE = Array.from({ length: 24 }, (_, i) => ({
  input: { year: 1960 + i * 2, month: (i % 12) + 1, day: ((i * 7) % 28) + 1, hour: [3, 9, 14, 20][i % 4] },
  gender: (i % 2 ? 'female' : 'male') as 'female' | 'male',
  dateKey: DATES[i % 6],
}));

const INPUT = PEOPLE[0].input;
const P = computeFourPillars(INPUT);

/** 스물네 명이 그 고민에서 보는 화면 문장 전부 */
function screenLines(key: ConcernKey, option: string) {
  return PEOPLE.flatMap((p) => onePersonLines(p, key, option));
}

function onePersonLines(p: (typeof PEOPLE)[number], key: ConcernKey, option: string) {
  const pill = computeFourPillars(p.input);
  const t = computeTiming(p.input, pill, p.gender, key, new Date(`${p.dateKey}T09:00:00+09:00`));
  const r = buildDeepRead(pill, t, key, option, p.dateKey, '김한별');
  return [
    r.headline, r.sub, r.decision.verdict,
    // 맨 위 카드의 한 줄. 화면에 늘 떠 있는데 이 목록에 빠져 있어서, 예순 줄을
    // 다시 쓰는 동안 화면 검사는 한 번도 그 줄을 안 봤다.
    r.monthWhy,
    ...r.slots.map((s) => s.outer),
    ...r.monthSlots.map((s) => s.outer),
    ...r.yearLines.map((y) => y.v),
    ...r.why.map((x) => x.v),
    r.daeunLine,
  ].filter((x): x is string => typeof x === 'string' && x.length > 6);
}

test('화면 문장 대부분이 그 고민의 말을 쓴다', () => {
  let tot = 0, hit = 0;
  const miss: string[] = [];
  for (const c of CONCERNS) {
    const re = WORD[c.key];
    for (const line of screenLines(c.key, c.options[0].key)) {
      tot += 1;
      if (re.test(line)) hit += 1;
      else miss.push(`${c.key}: ${line}`);
    }
  }
  const pct = Math.round((hit / tot) * 100);
  assert.ok(pct >= 75, `${pct}% 만 고민 단어를 써요 (${hit}/${tot})\n  ${miss.slice(0, 5).join('\n  ')}`);
});

test('고민별 문장 네 벌이 다 채워져 있다', () => {
  for (const c of CONCERNS) {
    for (const god of TEN_GODS) {
      const g = CONCERN_GOD[c.key][god];
      // 네 벌 전부가 그 고민의 말을 써야 한다. '구간이 열려요' 같은 문장은
      // 어느 고민에 붙여도 말이 되고, 그래서 아무 말도 안 하는 것과 같다.
      for (const [k, v] of Object.entries({
        month: g.month, decide: g.decide, pull: g.pull, year: g.year, daeun: g.daeun,
      })) {
        assert.ok(v && v.length >= 8, `${c.key}.${god}.${k} 가 비었어요`);
        assert.ok(WORD[c.key].test(v), `${c.key}.${god}.${k} 에 고민 말이 없어요 — ${v}`);
      }
    }
  }
});

// 결과 화면 맨 위 카드는 [판정 배지] [decide] [행동 한 줄] 순으로 붙는다.
// decide 예순 줄이 전부 '~할 때예요' 판정형이라, 배지가 '지금 준비하기' 인데
// 바로 옆에서 '병원에 갈 때예요' 라고 말하는 일이 생겼다. 판정은 배지가 하고,
// 이 줄은 '그래서 무엇부터인가' 만 말해야 배지와 안 싸운다.
// 예순 줄이 전부 '때예요' 로 끝나던 것도 같이 풀렸다.
test('맨 위 카드의 한 줄이 판정을 다시 내리지 않는다', () => {
  const verdict: string[] = [];
  const tails = new Map<string, number>();
  for (const c of CONCERNS) {
    for (const god of TEN_GODS) {
      const d = CONCERN_GOD[c.key][god].decide;
      if (/(때|타이밍|시기)(예요|이에요)\.?$/.test(d)) verdict.push(`${c.key}.${god} ${d}`);
      const t = d.replace(/[.!?]\s*$/, '').slice(-3);
      tails.set(t, (tails.get(t) ?? 0) + 1);
    }
  }
  assert.deepEqual(verdict, [], '판정형 문장이 남아 있습니다 - 배지가 이미 판정합니다');
  // 한 어미가 예순 줄의 절반을 넘으면 어느 고민을 눌러도 같은 말투가 된다
  const top = [...tails.values()].sort((a, b) => b - a)[0];
  assert.ok(top <= 30, `한 어미가 ${top}번 - 예순 줄의 절반을 넘습니다`);
});

test('같은 기운도 고민마다 다른 문장이다', () => {
  for (const god of TEN_GODS) {
    const months = CONCERNS.map((c) => CONCERN_GOD[c.key][god].month);
    assert.equal(new Set(months).size, months.length, `${god} 의 달 문장이 고민끼리 겹쳐요`);
    const pulls = CONCERNS.map((c) => CONCERN_GOD[c.key][god].pull);
    assert.equal(new Set(pulls).size, pulls.length, `${god} 의 근거가 고민끼리 겹쳐요`);
    const daeuns = CONCERNS.map((c) => CONCERN_GOD[c.key][god].daeun);
    assert.equal(new Set(daeuns).size, daeuns.length, `${god} 의 십 년 줄이 고민끼리 겹쳐요`);
  }
});

// 결과 화면에서 제일 큰 글자가 제일 추상적이었다.
// '곧 돈이 도는 구간이 와요' 는 돈이 언제 어떻게 도는지 아무것도 말하지 않는다.
test('맨 위 결론이 도망가는 말을 쓰지 않는다', () => {
  const ESCAPE = /구간|흐름이 열|기운이 열|자리가 열/;
  for (const c of CONCERNS) {
    for (const opt of c.options) {
      const t = computeTiming(INPUT, P, 'female', c.key, new Date('2026-09-21T09:00:00+09:00'));
      const r = buildDeepRead(P, t, c.key, opt.key, '2026-09-21', '김한별');
      assert.ok(!ESCAPE.test(r.headline), `${c.key}: ${r.headline}`);
      assert.ok(WORD[c.key].test(r.headline), `${c.key} 결론에 고민 말이 없어요 — ${r.headline}`);
    }
  }
});

// 매일 쪽지를 뽑는 앱이다. 제일 큰 글자가 오늘 이야기가 아니면, 오늘 보러
// 들어온 사람은 제 답을 찾으려고 화면을 한참 내려야 한다.
// 한때 여기가 '올해는 옮기기보다 자리를 지키는 해예요' 였다.
test('제일 큰 글자가 오늘 이야기다', () => {
  for (const c of CONCERNS) {
    for (const opt of c.options) {
      for (const d of ['2026-09-21', '2026-12-21', '2027-03-21']) {
        const t = computeTiming(INPUT, P, 'female', c.key, new Date(`${d}T09:00:00+09:00`));
        const r = buildDeepRead(P, t, c.key, opt.key, d, '김한별');
        assert.ok(/오늘/.test(r.headline), `${c.key}/${opt.key}: ${r.headline}`);
        // 올해 판정은 '언제' 칸으로 내려갔다. 거기 있어야 한다.
        assert.ok(r.whenVerdict.head.length > 0, `${c.key}: 언제 칸이 비었어요`);
      }
    }
  }
});

test('왜 N점인가요 줄이 그 고민의 말로 설명한다', () => {
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, new Date('2026-09-21T09:00:00+09:00'));
    const r = buildDeepRead(P, t, c.key, c.options[0].key, '2026-09-21', '김한별');
    assert.ok(WORD[c.key].test(r.scoreLine), `${c.key}: ${r.scoreLine}`);
    assert.ok(!/구간/.test(r.scoreLine), `${c.key} 점수 줄에 구간 — ${r.scoreLine}`);
  }
});

test('내일 한 줄도 그 고민의 말을 쓴다', () => {
  for (const c of CONCERNS) {
    for (let d = 18; d <= 24; d += 1) {
      const at = new Date(Date.UTC(2026, 8, d, 3));
      const t = computeTiming(INPUT, P, 'female', c.key, at);
      const r = buildDeepRead(P, t, c.key, c.options[0].key, `2026-09-${d}`, '김한별');
      const line = r.todayMeet.nextDay;
      // '결이 비슷한 날' 갈래는 고민 말이 없어도 된다 (오늘과 같다는 뜻)
      if (/결이 비슷|같은 기운/.test(line)) continue;
      assert.ok(WORD[c.key].test(line), `${c.key} ${d}일: ${line}`);
    }
  }
});

// 고민별 문장을 붙이면서 같은 말이 한 문단에 두 번 들어가기 쉽다.
// 돈에서 '빌려주는 돈은 못 돌아오기 쉬워요' 가 십 년 줄에 두 번 나왔다.
test('한 문단 안에서 같은 문장이 두 번 안 나온다', () => {
  for (const c of CONCERNS) {
    for (const opt of c.options) {
      const t = computeTiming(INPUT, P, 'female', c.key, new Date('2026-09-21T09:00:00+09:00'));
      const r = buildDeepRead(P, t, c.key, opt.key, '2026-09-21', '김한별');
      for (const para of [r.daeunLine, r.sub, r.scoreLine, r.decision.verdict]) {
        if (!para) continue;
        const sents = para.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 6);
        assert.equal(new Set(sents).size, sents.length, `${c.key}/${opt.key}: ${para}`);
      }
    }
  }
});

// 맨 위 카드에서 큰 글씨와 그 밑 줄이 정반대를 가리킨 적이 있다.
//   큰 글씨  지금은 상대보다 나를 먼저 채울 때예요
//   밑 줄    상대를 먼저 챙겨줄 때예요
// 둘이 다른 층(판정 / 이번 달 기운)에서 나와서 생긴 일이다.
// 이 카드의 두 줄은 반드시 같은 층에서 나와야 한다.
test('맨 위 카드의 두 줄이 같은 층에서 나온다', () => {
  for (const c of CONCERNS) {
    for (const opt of c.options) {
      const t = computeTiming(INPUT, P, 'female', c.key, new Date('2026-09-21T09:00:00+09:00'));
      const r = buildDeepRead(P, t, c.key, opt.key, '2026-09-21', '김한별');
      // 두 줄은 이제 오늘 답 하나에서만 나온다. 예전에는 큰 글씨가 올해 판정
      // 이었는데, 매일 뽑는 앱에서 제일 큰 글자가 올해 얘기인 게 이상해서
      // 오늘 답을 올리고 올해 판정을 '언제' 칸으로 내렸다(whenVerdict).
      // 그래서 같은 층인지 보는 기준도 판정에서 오늘 밴드로 바뀐다.
      const t2 = computeTiming(INPUT, P, 'female', c.key, new Date('2026-12-21T09:00:00+09:00'));
      const r2 = buildDeepRead(P, t2, c.key, opt.key, '2026-12-21', '김한별');
      if (r.todayAsk.band === r2.todayAsk.band) {
        assert.equal(r.sub, r2.sub, `${c.key}: 오늘 밴드가 같은데 밑 줄이 달라요`);
        assert.equal(r.headline, r2.headline, `${c.key}: 오늘 밴드가 같은데 큰 글씨가 달라요`);
      }
      // 내려간 올해 판정은 전처럼 판정 하나에서만 나온다
      if (r.verdict === r2.verdict) {
        assert.equal(r.whenVerdict.sub, r2.whenVerdict.sub, `${c.key}: 같은 판정인데 언제 칸 줄이 달라요`);
      }
      // 큰 글씨와 밑 줄이 같은 말을 되풀이하지 않는다. 바로 붙어 있는 두 줄이라
      // 같은 동사가 두 번 나오면 한 문장을 두 번 쓴 것처럼 읽힌다.
      // 종결어미(때예요·해예요·남아요…)는 어느 문장에나 붙으니 떼고 본다.
      // 안 떼면 '는때예요' 같은 게 겹침으로 잡혀서 검사가 시끄러워진다.
      const grams = (x: string) => {
        const out = new Set<string>();
        const t = x
          .split(/(?<=[.!?])\s+/)
          .map((one) => one.replace(/(는|은|을|를|이|가)?\s*(때|해|거|것)?(예요|에요|이에요|돼요|해요|나아요|남아요|와요|줘요|봐요|세요|어요|아요)\.?$/, ''))
          .join('')
          .replace(/[^가-힣]/g, '');
        for (let i = 0; i + 4 <= t.length; i += 1) out.add(t.slice(i, i + 4));
        return out;
      };
      const shared = [...grams(r.headline)].filter((g) => grams(r.sub).has(g));
      assert.equal(shared.length, 0, `${c.key}: 큰 글씨와 밑 줄이 겹쳐요 — ${shared.join(',')}\n  ${r.headline}\n  ${r.sub}`);
      // 한 줄 안에 같은 종결이 두 번 오지 않는다
      const endings = r.sub.split(/(?<=[.!?])\s+/).map((x) => x.trim().slice(-4)).filter(Boolean);
      assert.equal(new Set(endings).size, endings.length, `${c.key} 밑 줄 종결 반복 — ${r.sub}`);
    }
  }
});

test('이번 달 이유가 행동 칸으로 내려가 있다', () => {
  for (const c of CONCERNS) {
    const t = computeTiming(INPUT, P, 'female', c.key, new Date('2026-09-21T09:00:00+09:00'));
    const r = buildDeepRead(P, t, c.key, c.options[0].key, '2026-09-21', '김한별');
    assert.ok(r.monthWhy.length > 6, `${c.key}: 이번 달 이유가 비었어요`);
    assert.ok(!r.sub.includes(r.monthWhy), `${c.key}: 밑 줄에 아직 섞여 있어요`);
    assert.ok(WORD[c.key].test(r.monthWhy), `${c.key}: 이번 달 이유에 고민 말이 없어요 — ${r.monthWhy}`);
  }
});

// '지금 왜 이 고민이 커졌나' 카드와 층 카드(십 년·올해·이번 달)가 같은 층을
// 두 번 설명하고 있었다. 층이 무엇인지는 층 카드가 말하고, 지금 카드는
// 그래서 무엇이 느껴지는지로 각도를 갈라야 한다.
test('지금 카드와 층 카드가 같은 말을 하지 않는다', async () => {
  const { CONCERN_NOW } = await import('../data/concernNow.ts');
  const strip = (x: string) => x.replace(/[^가-힣]/g, '');
  const near = (a: string, b: string) => {
    const A = strip(a), B = strip(b);
    let n = 0;
    for (let i = 0; i + 6 <= A.length; i += 1) if (B.includes(A.slice(i, i + 6))) n += 1;
    return n >= 2;
  };
  const hits: string[] = [];
  for (const c of CONCERNS) {
    for (const god of TEN_GODS) {
      const n = CONCERN_NOW[c.key][god];
      const f = CONCERN_GOD[c.key][god];
      for (const [nk, fk] of [['decade', 'daeun'], ['year', 'year'], ['month', 'month']] as const) {
        if (near(n[nk], f[fk])) hits.push(`${c.key}.${god}.${nk}\n    ${n[nk]}\n    ${f[fk]}`);
      }
    }
  }
  assert.equal(hits.length, 0, `겹치는 쌍 ${hits.length}개\n  ${hits.slice(0, 3).join('\n  ')}`);
});

// 점수를 푸는 줄은 이제 '무슨 일이 일어나는가(pull)' 뒤에 '무엇을 하라(good/care)'
// 를 붙인다. 전에는 뒤에 점수를 붙였는데, pull 에는 좋고 나쁨이 없어서
// '미뤄둔 다툼이 상대와의 사이에서 올라오는 때라 연애에 바로 보탬이 돼요' 처럼
// 앞뒤가 거꾸로인 문장이 나왔다. 여섯 고민 × 열 기운을 전부 세워 확인한다.
test('점수 푸는 줄이 앞뒤 거꾸로가 아니다', () => {
  const bad: string[] = [];
  for (const c of CONCERNS) {
    for (const g of Object.keys(CONCERN_GOD[c.key]) as TenGod[]) {
      const cell = CONCERN_GOD[c.key][g];
      const body = cell.good.endsWith('것')
        ? `${cell.good.slice(0, -1)}게`
        : withJosa(cell.good, '이가');
      const high = `${cell.pull} 때예요. 지금은 ${body} 통해요.`;
      const low = `${cell.pull} 때예요. ${cell.care}만 조심하면 돼요.`;
      for (const line of [high, low]) {
        // 점수 말('보탬이 돼요' / '발목을 잡아요')은 이 줄에 다시 오면 안 된다
        if (/보탬이|발목을 잡/.test(line)) bad.push(`${c.key}.${g}  ${line}`);
        // 같은 조사가 잇달아 붙는 자리
        if (/것만 것|게 게/.test(line)) bad.push(`${c.key}.${g}  ${line}`);
        if (/이 고민/.test(line)) bad.push(`${c.key}.${g}  ${line}`);
      }
      // 조사 없이 낱말이 그냥 붙는 자리가 없어야 한다
      assert.ok(/(게|이|가) 통해요\.$/.test(high), `${c.key}.${g}: ${high}`);
      assert.ok(/만 조심하면 돼요\.$/.test(low), `${c.key}.${g}: ${low}`);
    }
  }
  assert.deepEqual(bad, [], `앞뒤가 어긋납니다:\n  ${bad.join('\n  ')}`);
});

// '이 고민' 은 앱이 아는 것을 일부러 안 말하는 것이다. 소스 점검(check:vague)이
// 막고 있지만, 화면에 실제로 안 뜨는지는 여기서 본다.
test("화면에 '이 고민' 이 안 나온다", () => {
  const bad: string[] = [];
  for (const c of CONCERNS) {
    for (const line of screenLines(c.key, c.options[0].key)) {
      if (/이 고민/.test(line)) bad.push(`${c.key}  ${line}`);
    }
  }
  assert.deepEqual(bad, [], `무엇을 물었는지 앱이 압니다:\n  ${bad.join('\n  ')}`);
});


// 화면을 훑는 검사가 문구의 몇 퍼센트를 보는가.
//
// 이 숫자를 안 재면 위의 검사들이 다 통과해도 아무 뜻이 없다. 생년월일 하나로
// 돌던 때는 문구 삼백 개 중 백열 개(37퍼센트)만 봤다. 나머지 백구십 개는
// 어떤 상태든 통과였다. 사람 스물넷·날짜 여섯으로 늘려 구십 퍼센트를 넘긴다.
//
// 못 닿는 나머지는 dead copy 가 아니다. daeun 은 한 사람에 한 칸뿐이라
// 사람 수만큼만 닿고, decide 는 보는 날짜의 월 십성 하나만 닿는다.
test('화면 검사가 문구의 90퍼센트 이상을 실제로 본다', () => {
  const seen = new Set<string>();
  for (const c of CONCERNS) for (const line of screenLines(c.key, c.options[0].key)) seen.add(line);
  const blob = [...seen].join('\n');
  let tot = 0, hit = 0;
  const miss: string[] = [];
  for (const [ck, gods] of Object.entries(CONCERN_GOD)) {
    for (const [god, v] of Object.entries(gods)) {
      for (const f of ['month', 'decide', 'pull', 'year', 'daeun'] as const) {
        tot += 1;
        if (blob.includes(v[f])) hit += 1;
        else miss.push(`${ck}.${god}.${f}`);
      }
    }
  }
  const pct = Math.round((hit / tot) * 100);
  assert.ok(pct >= 90, `화면 검사가 문구의 ${pct}퍼센트만 봅니다 (${hit}/${tot}). 안 닿은 것: ${miss.slice(0, 8).join(' ')}`);
});
