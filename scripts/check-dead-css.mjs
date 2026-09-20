// 소스에 한 번도 안 나오는 CSS 클래스를 막는다.
//
// 화면을 지우면 그 화면의 CSS 는 남는다. check:dead 는 TS export 만 보므로
// 이걸 못 잡는다. 실제로 TopicScreen·MoodScreen·DetailResultScreen 과 편지
// 기능을 지운 뒤 302개 클래스(전체의 38퍼센트)가 그대로 남아 있었고,
// 빌드된 CSS 160kB 중 37kB 가 아무도 안 쓰는 규칙이었다.
//
// 템플릿으로 조립되는 modifier(`${base}--${값}`)는 바탕 이름이 소스에 있으면
// 살아 있는 것으로 본다. 점검 스크립트도 클래스로 화면을 집으므로 같이 훑는다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = [...walk('src'), ...walk('scripts')].filter((f) => /\.(tsx?|mjs)$/.test(f) && !f.endsWith('check-dead-css.mjs'));
const src = files.map((f) => readFileSync(f, 'utf8')).join('\n');
// 주석 안에도 클래스 이름이 나온다. 규칙을 설명하는 글을 클래스로 세면
// 지운 클래스가 영영 살아 있는 것처럼 보인다.
const css = readFileSync('src/styles/globals.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');

const classes = new Set();
for (const m of css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) classes.add(m[1]);

const dead = [];
for (const c of classes) {
  if (src.includes(c)) continue;
  const base = c.split('--')[0];
  if (base !== c && src.includes(base)) continue;
  dead.push(c);
}
dead.sort();

if (dead.length) {
  console.error(`\n❌ 아무도 안 쓰는 CSS 클래스 ${dead.length}개:\n`);
  console.error('  ' + dead.join('  '));
  console.error('\n  화면을 지웠으면 그 CSS 도 같이 지우세요.\n');
  process.exit(1);
}
console.log(`✅ 안 쓰는 CSS 클래스 없음 (클래스 ${classes.size}개, 검사 파일 ${files.length}개)`);
