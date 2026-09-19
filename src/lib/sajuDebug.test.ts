import { test } from 'node:test';
import assert from 'node:assert/strict';
import { debugSaju, formatDebug } from './sajuDebug.ts';

// 디버그 추적이 실제로 전 단계를 덮는지. 한 칸이라도 비면 그 칸에서 틀렸을 때
// 원인을 못 찾는다.

const SAMPLE = {
  birth: { year: 1992, month: 3, day: 3, hour: 20 },
  gender: 'female' as const,
  name: '김한별',
  concern: 'work' as const,
  option: 'stay',
  dateKey: '2026-09-19',
};

test('디버그: 입력부터 문구까지 아홉 단계가 다 나온다', () => {
  const stages = debugSaju(SAMPLE);
  const steps = stages.map((s) => s.step);
  for (const want of ['RULESET', 'INPUT', 'CALENDAR', 'FOUR PILLARS', 'DERIVED',
    'TIME CYCLES', 'SCORE', 'INTERPRETATION', 'COPY']) {
    assert.ok(steps.some((s) => s.includes(want)), `${want} 단계가 없다`);
  }
  for (const s of stages) {
    assert.ok(s.lines.length > 0, `${s.step} 이 비었다`);
    for (const l of s.lines) assert.ok(l.length > 0, `${s.step} 에 빈 줄`);
  }
});

test('디버그: 시각을 몰라도 끝까지 추적된다', () => {
  const stages = debugSaju({ ...SAMPLE, birth: { ...SAMPLE.birth, hour: null } });
  assert.equal(stages.length, 9);
  const pillars = stages.find((s) => s.step.includes('FOUR PILLARS'))!;
  assert.ok(pillars.lines[0].includes('(없음)'), '시주가 비었다고 표시돼야 한다');
});

test('디버그: 이름이 없어도 끝까지 추적된다', () => {
  const stages = debugSaju({ ...SAMPLE, name: null });
  const derived = stages.find((s) => s.step.includes('DERIVED'))!;
  assert.ok(derived.lines.some((l) => l.includes('이름 (없음)')));
});

test('디버그: 점수 칸에 각 입력값과 가중치가 다 보인다', () => {
  const score = debugSaju(SAMPLE).find((s) => s.step.includes('SCORE'))!;
  assert.equal(score.lines.length, 6, '다섯 칸 + 합계여야 한다');
  for (const l of score.lines.slice(0, 5)) {
    assert.match(l, /\d+\s*×\s*\d+%/, `가중치가 안 보인다: ${l}`);
  }
  assert.match(score.lines[5], /합계 \d+/);
});

test('디버그: 화면에 안 나간다 (어느 화면에서도 부르지 않는다)', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  for (const dir of ['src/screens', 'src/components']) {
    for (const f of readdirSync(dir)) {
      const src = readFileSync(`${dir}/${f}`, 'utf8');
      assert.ok(!src.includes('sajuDebug'), `${dir}/${f} 가 디버그를 부른다`);
    }
  }
});

test('디버그: 콘솔 출력이 사람이 읽는 형태다', () => {
  const text = formatDebug(debugSaju(SAMPLE));
  assert.ok(text.includes('3. FOUR PILLARS'));
  assert.ok(text.split('\n').length > 25);
});
