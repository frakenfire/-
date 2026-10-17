// copy-export.mjs 로 뽑은 표에서 '고친 문구' 를 채운 줄을 소스에 되돌려 넣는다.
//
//   node scripts/copy-import.mjs            → 무엇이 바뀔지 보여주기만 한다
//   node scripts/copy-import.mjs --write    → 실제로 바꾼다
//
// 안전장치
//  - '위치' 의 줄에서 '지금 문구' 를 그대로 찾는다. 소스가 그새 바뀌어 못 찾으면 건너뛰고 알린다.
//  - ${...} 와 {...} 자리는 코드가 값을 끼우는 곳이다. 고친 문구에서 하나라도 빠지거나
//    바뀌면 건너뛴다. 넣으면 화면에 '{watch}' 가 그대로 찍히거나 값이 사라진다.
//  - \n 개수가 달라지면 건너뛴다. 두 줄로 나눠 그리는 자리가 깨진다.
//  - 문구를 감싼 따옴표와 같은 따옴표가 고친 문구에 있으면 이스케이프해서 넣는다.
// 넣은 뒤에는 반드시 npm run verify 를 돌린다. 말투 점검(check:comfort 등)이 거기서 돈다.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WRITE = process.argv.includes('--write');
const DIR = process.env.COPY_DIR ?? 'release/copy';

function parseCsv(text) {
  const out = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((v) => v !== '')) out.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); out.push(row); }
  return out;
}

const slots = (s) => (s.match(/\$\{[^}]*\}|\{[A-Za-z_][\w.]*\}/g) ?? []).sort().join('|');
const breaks = (s) => (s.match(/\\n/g) ?? []).length;

const edits = [];
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.csv')).sort()) {
  const rows = parseCsv(readFileSync(join(DIR, f), 'utf8').replace(/^﻿/, ''));
  const head = rows.shift() ?? [];
  const col = (name) => head.indexOf(name);
  const [cNo, cAt, cOld, cNew] = [col('번호'), col('위치'), col('지금 문구'), col('고친 문구')];
  if ([cNo, cAt, cOld, cNew].some((c) => c < 0)) {
    console.error(`❌ ${f}: '번호·위치·지금 문구·고친 문구' 칸을 못 찾았어요. 칸 이름을 바꾸면 안 돼요.`);
    process.exit(1);
  }
  for (const r of rows) {
    const old = r[cOld] ?? '';
    const trimmed = (r[cNew] ?? '').trim();
    if (!trimmed || trimmed === old.trim()) continue;
    // 앞뒤 띄어쓰기는 원래 것을 지킨다. '${userName}님의 ' 끝 칸이 사라지면
    // 화면에 '지우님의오늘 점수' 로 붙어 나온다. 고치는 쪽은 그 칸이 안 보인다.
    const next = old.match(/^\s*/)[0] + trimmed + old.match(/\s*$/)[0];
    const m = /^(.+):(\d+)$/.exec(r[cAt] ?? '');
    if (!m) continue;
    edits.push({ sheet: f, no: r[cNo], file: m[1], line: Number(m[2]), old, next });
  }
}

const skipped = [];
const byFile = new Map();
for (const e of edits) {
  if (slots(e.old) !== slots(e.next)) { skipped.push([e, '값을 끼우는 자리(${...}, {...})가 바뀜']); continue; }
  if (breaks(e.old) !== breaks(e.next)) { skipped.push([e, '\\n 개수가 바뀜']); continue; }
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}

let applied = 0;
for (const [file, list] of byFile) {
  let src;
  try { src = readFileSync(file, 'utf8'); } catch { for (const e of list) skipped.push([e, '파일이 없음']); continue; }
  // 뒤에서부터 바꿔야 앞 줄의 위치가 안 밀린다
  list.sort((a, b) => b.line - a.line);
  for (const e of list) {
    let start = 0;
    for (let n = 1; n < e.line; n++) start = src.indexOf('\n', start) + 1;
    const at = src.indexOf(e.old, start);
    const lineEnd = src.indexOf('\n', start);
    if (at < 0 || (lineEnd >= 0 && at > lineEnd && !e.old.includes('\n'))) {
      skipped.push([e, '그 줄에서 지금 문구를 못 찾음 (소스가 그새 바뀜)']);
      continue;
    }
    const quote = src[at - 1];
    let next = e.next;
    if (quote === "'" || quote === '"' || quote === '`') {
      next = next.replace(new RegExp(`(?<!\\\\)${quote === '`' ? '`' : quote}`, 'g'), '\\' + quote);
    }
    src = src.slice(0, at) + next + src.slice(at + e.old.length);
    applied++;
    if (!WRITE) console.log(`  ${e.file}:${e.line}\n    - ${e.old}\n    + ${next}`);
  }
  if (WRITE) writeFileSync(file, src, 'utf8');
}

console.log(`\n${WRITE ? '✅ 바꿈' : '미리보기'}: ${applied}줄 / 고친 줄 ${edits.length}개`);
if (skipped.length) {
  console.log(`⚠️ 건너뜀 ${skipped.length}줄:`);
  for (const [e, why] of skipped) console.log(`  - [${e.sheet} #${e.no}] ${e.file}:${e.line}  ${why}\n      ${e.next}`);
}
if (!WRITE && applied) console.log('\n실제로 넣으려면: node scripts/copy-import.mjs --write  그다음 npm run verify');
