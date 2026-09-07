// dist/ 를 한 파일 HTML 로 말아 넣는다 — 아티팩트는 외부 파일을 못 불러오므로
// CSS·JS 는 인라인, 폰트(woff2)는 data URI 로 바꿔 넣는다.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = process.argv[2] ?? 'artifact.html';

let html = readFileSync(join(DIST, 'index.html'), 'utf8');
const assets = join(DIST, 'assets');
const files = readdirSync(assets);

const css = files.find((f) => f.endsWith('.css'));
const js = files.find((f) => f.endsWith('.js'));

// 폰트를 data URI 로
let sheet = readFileSync(join(assets, css), 'utf8');
let fonts = 0;
sheet = sheet.replace(/url\(([^)]+\.woff2)\)/g, (_m, p) => {
  const name = p.replace(/^["']|["']$/g, '').split('/').pop();
  const buf = readFileSync(join(assets, name));
  fonts += 1;
  return `url(data:font/woff2;base64,${buf.toString('base64')})`;
});

const script = readFileSync(join(assets, js), 'utf8');

// <head>/<body> 는 아티팩트가 감싸 주므로 내용만 남긴다
const title = (html.match(/<title>([^<]*)<\/title>/) ?? [, '오늘쪽지 뽑기'])[1];
const body = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/) ?? [, '<div id="root"></div>'])[1]
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<link[^>]*>/g, '');

const out = `<title>${title}</title>
<style>
${sheet}
</style>
${body}
<script type="module">
${script}
</script>
`;

writeFileSync(OUT, out);
console.log(`✅ ${OUT} — ${(out.length / 1024 / 1024).toFixed(2)}MB · 폰트 ${fonts}개 인라인`);
