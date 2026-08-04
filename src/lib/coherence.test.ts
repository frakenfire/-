import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeLuck, luckBandForTone, luckPercentile } from './luck.ts';
import { iljinOf, sajuToday } from './saju.ts';
import { GRADE_READING, GRADE_READING_MONTH, MONTH_PEOPLE_READINGS, PEOPLE_READINGS } from '../data/readings.ts';
import { TEMPLATES } from '../data/resultTemplates.ts';
import { PLANS, moodGroup } from '../data/dayDesign.ts';
import { computeCompat } from './compat.ts';
import { computeStarCompat } from './starCompat.ts';
import { STAR_SIGNS } from '../data/starSign.ts';

// 결과 화면은 '총운 96점 · 대길'(숫자)과 '내 띠와 상충 · 조심'(사주 해석)을
// 한 화면에 나란히 보여준다. 둘이 반대 방향을 가리키면 "이 앱 안 맞네"가 된다.
// 여기서는 그 모순이 구조적으로 불가능한지를 검증한다.

const ZODIACS = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'sheep', 'monkey', 'rooster', 'dog', 'pig',
] as const;

function gradeOf(total: number): string {
  return computeLuck(0, [total, total]).grade;
}

test('사주 톤별 총운 구간이 서로 모순되는 등급을 만들지 않는다', () => {
  // 조심(충·형·원진)인 날에는 길·대길이 나올 수 없어야 한다.
  const [, cautionHi] = luckBandForTone('caution');
  assert.ok(!['길', '대길'].includes(gradeOf(cautionHi)), `caution 상한 ${cautionHi} 등급이 ${gradeOf(cautionHi)}`);

  // 비화(평운)인 날에는 대길이 나올 수 없어야 한다.
  const [, steadyHi] = luckBandForTone('steady');
  assert.notEqual(gradeOf(steadyHi), '대길');

  // 삼합·육합인 날에는 평(최하 등급)이 나올 수 없어야 한다.
  const [greatLo] = luckBandForTone('great');
  assert.notEqual(gradeOf(greatLo), '평');
});

test('총운은 항상 65~99 안에 있고, 사주 톤 구간을 벗어나지 않는다', () => {
  for (const tone of ['great', 'good', 'steady', 'caution'] as const) {
    const band = luckBandForTone(tone);
    for (let seed = 0; seed < 400; seed++) {
      const { total } = computeLuck(seed, band);
      assert.ok(total >= band[0] && total <= band[1], `${tone} seed=${seed} total=${total}`);
      assert.ok(total >= 65 && total <= 99, `범위 이탈 total=${total}`);
    }
  }
});

test('띠를 안 고르면 총운 구간 제한이 없다(근거가 없으므로 전 구간)', () => {
  const totals = new Set<number>();
  for (let seed = 0; seed < 2000; seed++) totals.add(computeLuck(seed).total);
  assert.ok(Math.min(...totals) <= 66, '하한이 65 근처까지 나와야 함');
  assert.ok(Math.max(...totals) >= 98, '상한이 99 근처까지 나와야 함');
});

test('실제 날짜×띠 전수에서 총운 등급과 사주 톤이 정면충돌하지 않는다', () => {
  let checked = 0;
  for (let d = 0; d < 60; d++) {
    const dt = new Date(Date.UTC(2026, 0, 1 + d));
    const dateKey = dt.toISOString().slice(0, 10);
    for (const z of ZODIACS) {
      const saju = sajuToday(dateKey, z);
      for (let s = 0; s < 6; s++) {
        const { grade } = computeLuck(s * 7919 + d, luckBandForTone(saju.tone));
        checked++;
        if (saju.tone === 'caution') {
          assert.ok(!['길', '대길'].includes(grade), `${dateKey} ${z} caution 인데 ${grade}`);
        }
        if (saju.tone === 'great') {
          assert.notEqual(grade, '평', `${dateKey} ${z} great 인데 평`);
        }
        if (saju.tone === 'steady') {
          assert.notEqual(grade, '대길', `${dateKey} ${z} steady 인데 대길`);
        }
      }
    }
  }
  assert.ok(checked > 4000, `표본이 너무 적음: ${checked}`);
});

test('등급 해설은 행동을 지시하지 않는다(뒤에 붙는 흐름 문장과 충돌 방지)', () => {
  // 등급 해설 바로 뒤에 variant.flow 가 이어붙는다. variant.flow 가 행동 지침을
  // 담당하므로, 등급 해설이 같은 층위에서 반대 지시를 하면 한 문단이 자기모순이 된다.
  const IMPERATIVE = /(해보세요|나가보세요|덜어내면|꺼내기에|옮겨도 좋은)/;
  for (const [grade, line] of Object.entries(GRADE_READING)) {
    assert.ok(!IMPERATIVE.test(line), `${grade} 해설이 행동을 지시함: ${line}`);
  }
});

test('일진 계산은 알려진 기준일과 일치한다(회귀 방지)', () => {
  // 총운 구간이 일진에 걸려 있으므로, 일진이 밀리면 점수 전체가 밀린다.
  assert.equal(iljinOf('2026-08-04').kor, '경술');
});

test('상위 N% 배지가 총운 등급과 같은 이야기를 한다', () => {
  // '88점 · 길'인데 배지가 '평범한 하루'로 뜨면 한 화면 안에서 말이 갈린다.
  const GRADE_LABEL: Record<string, string> = {
    대길: '역대급 행운',
    길: '상위권',
    중길: '괜찮은 편',
    소길: '평범한 하루',
    평: '평범한 하루',
  };
  let prev = 101;
  for (let total = 65; total <= 99; total++) {
    const { pct, label } = luckPercentile(total);
    const { grade } = computeLuck(0, [total, total]);
    assert.equal(label, GRADE_LABEL[grade], `${total}점(${grade}) 배지가 "${label}"`);
    assert.ok(pct >= 1 && pct <= 99, `${total}점 pct=${pct}`);
    assert.ok(pct <= prev, `점수가 오르는데 상위%가 나빠짐: ${total}점 ${pct}% (직전 ${prev}%)`);
    prev = pct;
  }
});

test('🏆 배지는 자랑거리(길 이상)일 때만 켜진다', () => {
  for (let total = 65; total <= 99; total++) {
    const { pct, isBrag } = luckPercentile(total);
    assert.equal(isBrag, total >= 88, `${total}점 isBrag=${isBrag}`);
    if (isBrag) assert.ok(pct <= 30, `자랑인데 상위 ${pct}% — 트로피가 김샘`);
  }
});

test('월간 리포트 총평은 "하루"가 아니라 "달"로 말한다', () => {
  // 화면에는 '이번 달 초반 / 중순 / 월말' 이 붙는데 총평만 일간 문장이면
  // 한 화면 안에서 시간 단위가 어긋난다.
  for (const [grade, line] of Object.entries(GRADE_READING_MONTH)) {
    assert.ok(!/하루|오늘/.test(line), `${grade} 월간 총평에 일간 표현: ${line}`);
    assert.ok(/달|시기|한 달|이번 달/.test(line), `${grade} 월간 총평에 월간 표현 없음: ${line}`);
  }
  // 등급 키가 일간/월간 양쪽에 모두 있어야 폴백 없이 매칭된다.
  assert.deepEqual(Object.keys(GRADE_READING_MONTH).sort(), Object.keys(GRADE_READING).sort());
});

test('월간 리포트의 콕 집은 한마디는 일간 표현을 쓰지 않는다', () => {
  // '이번 달의 나' 화면 맨 위에 "오늘이 그런 쪽이에요" 가 박히면 안 된다.
  for (const v of TEMPLATES.month) {
    assert.ok(!/오늘|하루/.test(v.pinpoint), `월간 템플릿 한마디에 일간 표현: ${v.pinpoint}`);
  }
});

test('월간 리포트의 사람 해석도 월간 문장이다', () => {
  for (const line of MONTH_PEOPLE_READINGS) {
    assert.ok(!/오늘|하루/.test(line), `월간 사람 해석에 일간 표현: ${line}`);
  }
  // 일간 풀과 줄 수가 같아야 같은 seed 로직에서 다양성이 유지된다.
  assert.equal(MONTH_PEOPLE_READINGS.length, PEOPLE_READINGS.length);
});

test('down 설계(지침·불안·외로움 공용)는 피로 전용 표현을 쓰지 않는다', () => {
  // moodGroup 은 tired · anxious · lonely 를 모두 'down' 으로 묶는다.
  // 그 풀이 '피곤한', '몸이 무거운' 처럼 피로 전용으로 쓰여 있으면,
  // '불안해요'·'외로워요' 를 고른 사람이 화면 제일 큰 줄에서 남의 말을 읽게 된다.
  const FATIGUE = /(피곤|몸이 무거운|컨디션|지친 날|지친 채|지친 몸|지친 상태|지친 감정|졸리)/;
  const offenders: string[] = [];
  for (const [type, groups] of Object.entries(PLANS)) {
    for (const plan of (groups as any).down) {
      const lines = [plan.headline, plan.vibe, plan.holdOff, ...plan.steps.map((s: any) => s.text)];
      for (const l of lines) if (FATIGUE.test(l)) offenders.push(`${type}: ${l}`);
    }
  }
  assert.deepEqual(offenders, [], `피로 전용 표현 ${offenders.length}건`);
});

test('moodGroup 이 down 으로 묶는 기분은 셋 뿐이고, 설계가 존재한다', () => {
  assert.equal(moodGroup('tired'), 'down');
  assert.equal(moodGroup('anxious'), 'down');
  assert.equal(moodGroup('lonely'), 'down');
  assert.equal(moodGroup('good'), 'up');
  assert.equal(moodGroup('soso'), 'flat');
  for (const [type, groups] of Object.entries(PLANS)) {
    for (const g of ['up', 'flat', 'down']) {
      assert.ok((groups as any)[g]?.length > 0, `${type}.${g} 설계 없음`);
    }
  }
});

test('궁합 한 줄이 관계의 결과 반대로 말하지 않는다', () => {
  // '불꽃 튀는 사이(상충)' 바로 아래에 '편안하게 흘러가는 하루예요' 가 붙으면
  // 한 카드 안에서 말이 갈린다. 상충·원진·형(spark)에는 매끄러움을 단정하지 않는다.
  const SMOOTH = /(편안하게|술술|손발이|죽이 척척|초록불|무난하게 잘 통)/;
  const ZODIACS = [
    'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
    'horse', 'sheep', 'monkey', 'rooster', 'dog', 'pig',
  ] as const;
  const bad: string[] = [];
  for (const a of ZODIACS) {
    for (const b of ZODIACS) {
      for (let d = 0; d < 40; d++) {
        const dateKey = `2026-0${1 + (d % 9)}-${String(1 + (d % 28)).padStart(2, '0')}`;
        const c = computeCompat(dateKey, a, b);
        if (c.vibe !== 'spark') continue;
        if (SMOOTH.test(c.headline)) bad.push(`${a}×${b}: ${c.headline}`);
      }
    }
  }
  assert.deepEqual([...new Set(bad)], [], `spark 조합에 매끄러움 단정 ${bad.length}건`);
});

test('별자리 궁합 한 줄도 관계의 결과 반대로 말하지 않는다', () => {
  const SMOOTH = /(술술|자연스럽게 리듬이|완벽하게 겹치|텔레파시|말 안 해도)/;
  const bad: string[] = [];
  for (const a of STAR_SIGNS) {
    for (const bs of STAR_SIGNS) {
      for (let d = 0; d < 20; d++) {
        const dateKey = `2026-0${1 + (d % 9)}-${String(1 + (d % 28)).padStart(2, '0')}`;
        const c = computeStarCompat(dateKey, a.id, bs.id);
        if (c.vibe !== 'spark') continue;
        if (SMOOTH.test(c.headline)) bad.push(`${a.label}×${bs.label}: ${c.headline}`);
      }
    }
  }
  assert.deepEqual([...new Set(bad)], [], `spark 별자리 조합에 매끄러움 단정 ${bad.length}건`);
});
