#!/usr/bin/env node
// 폰의 토스 샌드박스 앱에서 개발 중인 화면을 띄운다.
//
// 왜 따로 두나: npm run dev 는 vite 만 띄워서 PC 크롬에서만 보인다.
// 샌드박스 앱은 granite dev 서버(8081)에 붙고, 웹 화면은 granite.config.ts 의
// web.host 에서 받아 간다. 그 값이 localhost 면 폰은 자기 자신을 찾아가서
// 빈 화면이 된다. 그래서 PC 의 와이파이 IP 를 찾아 넣고 granite dev 를 띄운다.
//
//   npm run dev:toss                  와이파이 IP 를 자동으로 찾는다
//   npm run dev:toss -- 192.168.0.12  IP 를 직접 준다 (자동으로 못 찾을 때)
import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';

function lanIp() {
  for (const list of Object.values(networkInterfaces())) {
    for (const n of list ?? []) {
      if (n.family === 'IPv4' && !n.internal && /^(192\.168|10|172\.(1[6-9]|2\d|3[01]))\./.test(n.address)) {
        return n.address;
      }
    }
  }
  return null;
}

const host = process.argv[2] || lanIp();
if (!host) {
  console.error('\n❌ 와이파이 IP 를 못 찾았어요. 직접 넣어 주세요: npm run dev:toss -- 192.168.0.12\n');
  process.exit(1);
}

console.log(`
폰 토스 샌드박스 앱에서 볼 준비
───────────────────────────────────
  PC 주소    ${host}  (폰과 같은 와이파이여야 해요)
  서버 포트  8081 (granite)  ·  웹 화면 5173 (vite)
  앱 주소    intoss://todaymyheart

  샌드박스 앱에서 서버 주소를 ${host}:8081 로 맞추고 위 앱 주소를 여세요.
  안 열리면 PC 방화벽이 8081·5173 포트를 막고 있는지 먼저 보세요.
`);

const child = spawn('npx', ['granite', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, AIT_DEV_HOST: host },
});
child.on('exit', (code) => process.exit(code ?? 0));
