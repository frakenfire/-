import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TODAY_TABLE } from './todayVerdict.ts';

// 콘텐츠 안전 회귀 테스트 — 오락용 운세 앱에 부적절한 단정/의료/투자보장 표현이
// 템플릿에 새로 섞여 들어오는 것을 CI 단계에서 막는다. (앱인토스 보안·운영 검수 대비)

const here = dirname(fileURLToPath(import.meta.url));
const libDir = join(here, '..', 'lib');

// 명백히 문제 되는 표현만 좁게 지정(정상 문구 오탐 방지).
const BANNED: RegExp[] = [
  /진단/,
  /완치/,
  /처방전/,
  /의학적/,
  /원금\s*보장/,
  /수익\s*보장/,
  /무조건\s*(오른|올라|벌)/,
  /반드시\s*(오른|올라|낫)/,
  /100\s*%\s*(확실|보장)/,
  /절대\s*실패/,
];

function scanDir(dir: string): { file: string; text: string }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => ({ file: join(dir, f), text: readFileSync(join(dir, f), 'utf8') }));
}

test('콘텐츠·로직 문구에 금칙 표현이 없다', () => {
  const files = [...scanDir(here), ...scanDir(libDir)];
  const hits: string[] = [];
  for (const { file, text } of files) {
    for (const re of BANNED) {
      const m = re.exec(text);
      if (m) hits.push(`${file.split('/').slice(-2).join('/')}: "${m[0]}"`);
    }
  }
  assert.equal(hits.length, 0, `금칙 표현 발견:\n${hits.join('\n')}`);
});

test('오늘 점수로 진료를 미루거나 투자를 허락하지 않는다', () => {
  for (const row of Object.values(TODAY_TABLE.health)) {
    for (const text of Object.values(row.a)) {
      assert.doesNotMatch(text, /진료는 오늘 받지|병원에 가지 마|쉬면 바로 회복|잘 쉬는 게 치료/);
    }
  }
  for (const text of Object.values(TODAY_TABLE.money.invest.a)) {
    assert.doesNotMatch(text, /투자를? 넣어도 돼|원금을? 넣어도 돼|내일.*팔게 돼/);
    assert.match(text, /위험|조건/);
  }
});
