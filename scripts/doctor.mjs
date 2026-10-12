#!/usr/bin/env node
// 새 컴퓨터에서 받은 직후 '앱인토스 작업을 할 수 있는 상태인가' 를 한 번에 본다.
//
//   npm run doctor
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path/posix';

const rows = [];
const ok = (what, note = '') => rows.push(['✅', what, note]);
const no = (what, fix) => rows.push(['❌', what, fix]);
const warn = (what, note) => rows.push(['⚠️ ', what, note]);

const major = Number(process.versions.node.split('.')[0]);
if (major >= 20) ok(`Node ${process.versions.node}`);
else no(`Node ${process.versions.node}`, 'Node 20 이상(22 권장)을 설치하세요');

const sdk = 'node_modules/@apps-in-toss/web-framework/package.json';
if (existsSync(sdk)) ok('앱인토스 SDK', `web-framework ${JSON.parse(readFileSync(sdk, 'utf8')).version}`);
else no('앱인토스 SDK', 'npm install 을 먼저 실행하세요');

const cfg = readFileSync('apps-in-toss.config.ts', 'utf8');
const appName = (cfg.match(/appName:\s*'([^']+)'/) || [])[1];
const displayName = (cfg.match(/displayName:\s*'([^']+)'/) || [])[1];
ok('앱 설정', `appName ${appName} · 이름 '${displayName}' (콘솔 등록값과 글자까지 같아야 해요)`);

// ait token add 로 넣은 배포 키는 ~/.ait/credentials 에 저장된다 (@apps-in-toss/cli TokenStorage)
const cred = join(homedir(), '.ait', 'credentials');
if (existsSync(cred) && readFileSync(cred, 'utf8').trim().length > 2) ok('배포 키', `${cred} 에 등록됨`);
else warn('배포 키', '업로드(ait deploy)할 때만 필요해요. npx ait token add 로 콘솔의 API 키를 넣으세요');

const ait = readdirSync('.').filter((f) => f.endsWith('.ait'));
if (ait.length) ok('제출 파일', ait.join(', '));
else warn('제출 파일', '아직 없어요. npm run build 하면 생겨요');

console.log('');
for (const [mark, what, note] of rows) console.log(`${mark} ${what}${note ? `  ${note}` : ''}`);
console.log('');
if (rows.some((r) => r[0] === '❌')) process.exit(1);
