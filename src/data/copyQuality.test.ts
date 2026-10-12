import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONCERNS } from './concerns.ts';
import { TEN_GOD_KO, type TenGod } from '../lib/tenGods.ts';
import { dayActOf } from './optionDay/index.ts';
import { TODAY_TABLE } from './todayVerdict.ts';
import { NOTE_TODAY } from './noteToday/index.ts';
import { feelingOf } from './feeling.ts';
import { todayVibe } from '../lib/dayVibe.ts';
import { CONCERN_TODAY, ELEMENT_TODAY, LUCK_BAND, NATAL_TODAY, NAME_TODAY } from './scoreWhyCopy.ts';

// 결과 화면에 실제로 뜨는 글의 공통 기준(2026-10-12 사장님 작업 지시).
//
// 짧은 명령을 줄줄이 늘어놓은 글, 운세와 상관없는 체크리스트, 근거 없는 숫자와
// 단정이 AI 가 쓴 글처럼 읽힌다는 지적을 받았다. 이 앱은 글을 생성하지 않고 표에서
// 고른다. 그래서 기준을 표 전체에 건다. 표를 새로 쓰거나 고칠 때 이 검사가 막는다.
//
//  1. 명령은 한 덩이에 한 번까지. '~세요' 를 연달아 쓰지 않는다.
//  2. 입력에 없는 숫자를 지어내지 않는다. '세 곳', '두세 줄', '15분', '9시' 같은 숫자는
//     구체적인 척하는 말이다.
//  3. 결과를 보장하지 않는다('가능성이 그만큼 커져요', '반드시').
//  4. 운세와 상관없는 행정 체크리스트를 끼우지 않는다(서류 발급, 정부24).
//  5. 상투적인 AI 문장을 기본 문장으로 쓰지 않는다.

type Block = { where: string; text: string };

const GODS = Object.keys(TEN_GOD_KO) as TenGod[];

function blocks(): Block[] {
  const out: Block[] = [];
  for (const c of CONCERNS) {
    for (const o of c.options) {
      for (const g of GODS) {
        const a = dayActOf(c.key, o.key, g);
        out.push({ where: `할 것 ${c.key}/${o.key}/${g}`, text: `${a.doIt} ${a.doWhy}` });
        out.push({ where: `미룰 것 ${c.key}/${o.key}/${g}`, text: `${a.avoid} ${a.avoidWhy}` });
      }
      const ask = TODAY_TABLE[c.key][o.key];
      for (const [band, list] of Object.entries(ask.a)) {
        list.forEach((v, i) => out.push({ where: `오늘 풀이 ${c.key}/${o.key}/${band}/${i}`, text: `${v.head} ${v.sum}` }));
      }
      const f = feelingOf(c.key, o.key);
      if (f) out.push({ where: `마음 ${c.key}/${o.key}`, text: f });
    }
  }
  for (const [id, byConcern] of Object.entries(NOTE_TODAY)) {
    for (const [k, t] of Object.entries(byConcern)) out.push({ where: `쪽지 ${id}/${k}`, text: t });
  }
  // 점수 이유 글감. 실제 화면에서 한 덩이로 붙는 단위로 묶는다.
  for (const [b, x] of Object.entries(LUCK_BAND)) out.push({ where: `점수 ${b}`, text: `${x.head} ${x.act}` });
  for (const [g, x] of Object.entries(NATAL_TODAY)) out.push({ where: `타고난 ${g}`, text: `${x.head} ${x.turn} ${x.act} ${NAME_TODAY[g as keyof typeof NAME_TODAY]}` });
  for (const [c, byState] of Object.entries(ELEMENT_TODAY)) for (const [st, x] of Object.entries(byState)) out.push({ where: `요소 ${c}/${st}`, text: `${x.link} ${x.act}` });
  for (const [c, byGroup] of Object.entries(CONCERN_TODAY)) for (const [g, x] of Object.entries(byGroup)) out.push({ where: `고민 ${c}/${g}`, text: `${x.head} ${x.scene} ${x.act}` });
  const seen = new Set<string>();
  for (let d = 0; d < 60; d += 1) {
    const day = new Date(Date.UTC(2026, 9, 1 + d)).toISOString().slice(0, 10);
    const v = todayVibe(day);
    if (seen.has(v.head)) continue;
    seen.add(v.head);
    const x = v.decision;
    out.push({ where: `일반 쪽지 ${v.head}`, text: `${v.head} ${v.line}` });
    out.push({ where: `일반 풀이 ${v.head}`, text: `${x.overall.headline} ${x.overall.summary}` });
    out.push({ where: `일반 할 것 ${v.head}`, text: `${x.do.action} ${x.do.why}` });
    out.push({ where: `일반 미룰 것 ${v.head}`, text: `${x.dont.action} ${x.dont.why}` });
  }
  return out;
}

const sentencesOf = (t: string) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
const IMPERATIVE = /세요[.!]?$/;

export function quality(text: string): string | null {
  const ss = sentencesOf(text);
  const imp = ss.filter((s) => IMPERATIVE.test(s));
  if (imp.length > 1) return `명령이 ${imp.length}번이에요`;
  if (/\d/.test(text)) return '숫자를 지어냈어요';
  if (/(두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s?(곳|줄|개|명|가지|통|군데|장|쪽)|(두세|서너|한두)\s?(줄|곳|개|번|명|가지|군데)/.test(text)) return '개수를 지어냈어요';
  if (/가능성이 (그만큼 )?(커|높아)|반드시|무조건|틀림없이|확실히 (돼|붙|합격)|보장/.test(text)) return '결과를 단정해요';
  if (/정부24|증명서를 떼|사본을 떼|서류를 발급|발급받/.test(text)) return '운세와 상관없는 서류 체크리스트예요';
  const CLICHE = [
    '혼자 붙들고 있지 마세요', '콕 집어', '두세 줄이면 충분', '작은 행동이 큰 변화', '나 자신에게 집중하는 시간',
    '새로운 기회의 문', '한 걸음 내딛는 용기', '차근차근 준비해보세요', '너무 조급해하지 마세요',
  ];
  const hit = CLICHE.find((c) => text.includes(c));
  if (hit) return `상투적인 문장 [${hit}]`;
  return null;
}

test('결과 화면 글이 사람이 쓴 글의 기준을 지킨다', () => {
  const bad: string[] = [];
  for (const b of blocks()) {
    const why = quality(b.text);
    if (why) bad.push(`${b.where} ${why}: ${b.text}`);
  }
  assert.deepEqual(bad.slice(0, 40), [], `${bad.length}곳`);
});

test('기준을 보는 눈이 살아 있다', () => {
  // 사장님 작업 지시의 좋은 예
  assert.equal(quality('한동안 연락하지 않았던 동료가 생각난다면 가볍게 안부를 전해보세요. 당장 무언가를 부탁하지 않아도 괜찮아요. 근황을 나누는 대화에서 생각지 못한 소식을 듣게 될 수도 있으니까요.'), null);
  assert.equal(quality('오랜만에 연락하면서 곧바로 부탁부터 꺼내는 건 피하는 편이 좋겠어요. 오늘은 무언가를 얻으려 하기보다 편하게 관계를 이어가는 데 의미를 두세요.'), null);
  // 사장님 작업 지시의 나쁜 예
  assert.ok(quality('오늘 일이 막힌다면 혼자 붙들고 있지 마세요. 아는 사람에게 막힌 부분 하나만 콕 집어 물어보세요.'));
  assert.ok(quality('경력증명서와 자격증 사본을 떼어 한 폴더에 모아두세요. 정부24에서 뗄 수 있는 서류부터 내려받으세요.'));
  assert.ok(quality('같은 이력서를 열 곳에 그대로 넣지 마세요. 세 곳만 골라 공고 문구에 맞춰 첫 줄을 고치세요. 서류가 붙을 가능성이 그만큼 커져요.'));
});
